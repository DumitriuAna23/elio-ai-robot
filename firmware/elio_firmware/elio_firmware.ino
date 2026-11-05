/*
  ============================================================
  ELIO – firmware complet (Wemos D1 R32 / ESP32-WROOM-32)
  Tales & Tech Hub
  ============================================================
  Se potrivește cu aplicația web/PWA ELIO:
    Bluetooth (BLE), nume "ELIO", serviciu 12345678-1234-1234-1234-123456789000
      ...9001  COMENZI    (scriere)   FORWARD BACKWARD LEFT RIGHT STOP SPEED:n SAY:<id> HUSH
      ...9002  TELEMETRIE (notify)    DISTANCE:12.3   STATE:IDLE|MOVING|OBSTACLE|TALKING
      ...9003  WI-FI      (scriere)   {"ssid":"...","password":"..."}  adaugă rețea și conectează
                                      {"action":"forget","ssid":"..."}  șterge rețea
                                      {"action":"list"}                 cere lista
               telemetrie Wi-Fi:      WIFI:<rețea curentă sau ->  WIFINET:<rețea salvată>...  WIFIEND
    Robotul ține minte până la 5 rețele și o alege singur pe cea disponibilă.

  Siguranță:
    - motoarele se opresc singure dacă nu mai vin comenzi 450 ms (aplicația
      retrimite direcția la 120 ms cât timp ții joystick-ul)
    - se oprește la deconectare Bluetooth
    - nu merge înainte dacă un obstacol e mai aproape de OBSTACLE_CM

  Biblioteci (Arduino IDE → Library Manager):
    - "GFX Library for Arduino" (autor moononournation)  – doar pentru ecran
    Restul (BLE, WiFi, HTTPClient, Preferences, I2S) vin cu placa ESP32.

  Setări placă în Arduino IDE:
    Board: "ESP32 Dev Module"
    Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"   ← OBLIGATORIU (BLE + Wi-Fi + HTTPS)

  ÎNAINTE de prima încărcare, salvați firmware-ul vechi:
    esptool --port COM3 read_flash 0 ALL elio_backup.bin
  ============================================================
*/

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "driver/i2s.h"

// ============================================================
// 1. SETĂRI DE COMPLETAT
// ============================================================

// Adresa backend-ului (fără "/" la final). Pentru test pe laptop:
// "http://192.168.1.25:8000" (IP-ul laptopului, aceeași rețea Wi-Fi).
const char* API_BASE = "https://elio-api.onrender.com";

// Rețea Wi-Fi implicită (opțional). Se poate schimba din aplicație: Setări → Wi-Fi.
const char* DEFAULT_WIFI_SSID = "";
const char* DEFAULT_WIFI_PASS = "";

#define USE_DISPLAY 1          // 0 dacă nu aveți ecranul sau biblioteca GFX
#define OBSTACLE_CM 12.0f      // aceeași valoare ca în aplicație (codeRunner.ts)
#define HEARTBEAT_MS 450       // oprire automată fără comenzi
#define VOLUME_PERCENT 70      // volum difuzor 0..100

// Dacă un motor merge invers, schimbați 0 ↔ 1:
#define INVERT_LEFT 0
#define INVERT_RIGHT 0
#define SWAP_SIDES 0           // 1 dacă stânga/dreapta sunt inversate

// ============================================================
// 2. PINI (Wemos D1 R32)
// ============================================================
// L298N (ENA + ENB unite pe același pin)
#define PIN_EN   12   // atenție: GPIO12 e pin de boot; ținut LOW la pornire
#define PIN_IN1  17   // motor A (stânga)
#define PIN_IN2  13
#define PIN_IN3  14   // motor B (dreapta)
#define PIN_IN4  27
// HC-SR04
#define PIN_TRIG 25
#define PIN_ECHO 34   // prin divizor 1k/2k
// GC9A01
#define TFT_SCLK 22
#define TFT_MOSI 21
#define TFT_DC   26
#define TFT_CS   19
#define TFT_RST  16
// MAX98357A
#define I2S_BCLK 18
#define I2S_LRC  23
#define I2S_DIN  5

// ============================================================
// 3. BLE UUID-uri (identice cu services/robotBluetooth.ts)
// ============================================================
#define SERVICE_UUID   "12345678-1234-1234-1234-123456789000"
#define COMMAND_UUID   "12345678-1234-1234-1234-123456789001"
#define TELEMETRY_UUID "12345678-1234-1234-1234-123456789002"
#define WIFI_UUID      "12345678-1234-1234-1234-123456789003"

#if USE_DISPLAY
#include <Arduino_GFX_Library.h>
Arduino_DataBus* bus = new Arduino_ESP32SPI(TFT_DC, TFT_CS, TFT_SCLK, TFT_MOSI, GFX_NOT_DEFINED);
Arduino_GFX* gfx = new Arduino_GC9A01(bus, TFT_RST, 0, true);
#endif

// ============================================================
// STARE
// ============================================================
enum Move { M_STOP, M_FORWARD, M_BACKWARD, M_LEFT, M_RIGHT };
volatile Move currentMove = M_STOP;
volatile uint32_t lastMoveCmd = 0;
volatile int speedPercent = 60;
volatile bool bleConnected = false;
float distanceCm = -1;
volatile bool obstacleHit = false;   // oprit din cauza unui obstacol

String robotState = "IDLE";
String sentState = "";
volatile bool talking = false;
volatile bool audioCancel = false;   // HUSH: oprește vorbitul imediat

// comenzi primite din task-ul BLE, procesate în loop()
portMUX_TYPE cmdMux = portMUX_INITIALIZER_UNLOCKED;
String pendingCmd = "";
volatile bool hasPendingCmd = false;
String pendingWifi = "";
volatile bool hasPendingWifi = false;

QueueHandle_t sayQueue;

BLECharacteristic* telemetryChar = nullptr;
BLEServer* bleServer = nullptr;
Preferences prefs;

// ============================================================
// MOTOARE
// ============================================================
#if ESP_ARDUINO_VERSION_MAJOR >= 3
void pwmSetup() { ledcAttach(PIN_EN, 1000, 8); }
void pwmWrite(uint8_t duty) { ledcWrite(PIN_EN, duty); }
#else
void pwmSetup() { ledcSetup(0, 1000, 8); ledcAttachPin(PIN_EN, 0); }
void pwmWrite(uint8_t duty) { ledcWrite(0, duty); }
#endif

void sideWrite(bool left, int dir) {  // dir: 1 înainte, -1 înapoi, 0 stop
  if (SWAP_SIDES) left = !left;
  if (left && INVERT_LEFT) dir = -dir;
  if (!left && INVERT_RIGHT) dir = -dir;
  int a = left ? PIN_IN1 : PIN_IN3;
  int b = left ? PIN_IN2 : PIN_IN4;
  digitalWrite(a, dir > 0 ? HIGH : LOW);
  digitalWrite(b, dir < 0 ? HIGH : LOW);
}

uint8_t dutyFromSpeed(int pct) {
  pct = constrain(pct, 0, 100);
  if (pct == 0) return 0;
  return map(pct, 1, 100, 110, 255);  // sub ~110 motoarele L298N de obicei nu pornesc
}

void applyMove(Move m) {
  currentMove = m;
  switch (m) {
    case M_FORWARD:  sideWrite(true, 1);  sideWrite(false, 1);  break;
    case M_BACKWARD: sideWrite(true, -1); sideWrite(false, -1); break;
    case M_LEFT:     sideWrite(true, -1); sideWrite(false, 1);  break;
    case M_RIGHT:    sideWrite(true, 1);  sideWrite(false, -1); break;
    default:         sideWrite(true, 0);  sideWrite(false, 0);  break;
  }
  pwmWrite(m == M_STOP ? 0 : dutyFromSpeed(speedPercent));
}

void stopMotors() { applyMove(M_STOP); }

// ============================================================
// SENZOR DISTANȚĂ
// ============================================================
float readDistanceOnce() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, 25000);  // ~4 m
  if (us == 0) return -1;
  return us / 58.0f;
}

float readDistance() {  // mediana ultimelor 3 citiri (o citire nouă la fiecare apel)
  static float h[3] = {-1, -1, -1};
  static uint8_t k = 0;
  h[k] = readDistanceOnce();
  k = (k + 1) % 3;
  float a = h[0], b = h[1], c = h[2];
  float lo = min(a, min(b, c)), hi = max(a, max(b, c));
  return a + b + c - lo - hi;
}

// ============================================================
// TELEMETRIE
// ============================================================
void notifyText(const String& s) {
  if (!bleConnected || !telemetryChar) return;
  telemetryChar->setValue((uint8_t*)s.c_str(), s.length());
  telemetryChar->notify();
}

void updateState() {
  String s;
  if (talking) s = "TALKING";
  else if (obstacleHit) s = "OBSTACLE";
  else if (currentMove != M_STOP) s = "MOVING";
  else s = "IDLE";
  robotState = s;
  if (s != sentState) {
    sentState = s;
    notifyText("STATE:" + s);
  }
}

// ============================================================
// ECRAN (ochii lui ELIO)
// ============================================================
#if USE_DISPLAY
const uint16_t C_BG = 0x0000;
const uint16_t C_BLUE = 0x253F;    // #22A7FF
const uint16_t C_ORANGE = 0xFBC2;  // #FF7A12
String drawnFace = "";
uint32_t lastMouth = 0;
bool mouthOpen = false;

void drawEyes(uint16_t color, int r, int dy) {
  gfx->fillCircle(80, 100 + dy, r, color);
  gfx->fillCircle(160, 100 + dy, r, color);
  gfx->fillCircle(80 + r / 3, 100 + dy - r / 3, r / 4, 0xFFFF);
  gfx->fillCircle(160 + r / 3, 100 + dy - r / 3, r / 4, 0xFFFF);
}

void drawFace() {
  String face = bleConnected ? robotState : "SLEEP";
  bool mouthTick = face == "TALKING" && millis() - lastMouth > 160;
  if (face == drawnFace && !mouthTick) return;
  if (face != drawnFace) {
    gfx->fillScreen(C_BG);
    if (face == "SLEEP") {
      gfx->fillRoundRect(55, 98, 50, 8, 4, C_BLUE);
      gfx->fillRoundRect(135, 98, 50, 8, 4, C_BLUE);
    } else if (face == "OBSTACLE") {
      drawEyes(C_ORANGE, 30, 0);
      gfx->fillCircle(120, 170, 14, C_ORANGE);
    } else {
      drawEyes(C_BLUE, 24, 0);
      if (face == "IDLE") gfx->fillRoundRect(95, 160, 50, 10, 5, C_BLUE);
      if (face == "MOVING") gfx->fillRoundRect(100, 162, 40, 8, 4, C_BLUE);
    }
    drawnFace = face;
  }
  if (face == "TALKING") {
    lastMouth = millis();
    mouthOpen = !mouthOpen;
    gfx->fillRect(80, 150, 80, 40, C_BG);
    if (mouthOpen) gfx->fillRoundRect(95, 152, 50, 30, 14, C_BLUE);
    else gfx->fillRoundRect(95, 162, 50, 10, 5, C_BLUE);
  }
}
#endif

// ============================================================
// AUDIO (MAX98357A) – redă WAV-ul generat de Gemini
// ============================================================
void i2sSetup() {
  i2s_config_t cfg = {};
  cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  cfg.sample_rate = 24000;
  cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
  cfg.channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT;
  cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  cfg.intr_alloc_flags = 0;
  cfg.dma_buf_count = 8;
  cfg.dma_buf_len = 256;
  cfg.use_apll = false;
  cfg.tx_desc_auto_clear = true;
  i2s_driver_install(I2S_NUM_0, &cfg, 0, nullptr);

  i2s_pin_config_t pins = {};
  pins.mck_io_num = I2S_PIN_NO_CHANGE;
  pins.bck_io_num = I2S_BCLK;
  pins.ws_io_num = I2S_LRC;
  pins.data_out_num = I2S_DIN;
  pins.data_in_num = I2S_PIN_NO_CHANGE;
  i2s_set_pin(I2S_NUM_0, &pins);
  i2s_zero_dma_buffer(I2S_NUM_0);
}

bool readExact(Stream* s, uint8_t* buf, size_t n, uint32_t timeoutMs = 4000) {
  size_t got = 0;
  uint32_t start = millis();
  while (got < n) {
    int av = s->available();
    if (av > 0) {
      got += s->readBytes(buf + got, min((size_t)av, n - got));
      start = millis();
    } else {
      if (millis() - start > timeoutMs) return false;
      delay(2);
    }
  }
  return true;
}

void playWav(const char* id) {
  audioCancel = false;
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[voice] Wi-Fi neconectat");
    return;
  }
  String url = String(API_BASE) + "/api/audio/" + id + ".wav";
  Serial.println("[voice] " + url);

  HTTPClient http;
  WiFiClientSecure secure;
  WiFiClient plain;
  bool ok;
  if (url.startsWith("https")) {
    secure.setInsecure();  // fișierul audio nu e secret; evităm gestionarea certificatelor
    ok = http.begin(secure, url);
  } else {
    ok = http.begin(plain, url);
  }
  if (!ok) return;
  http.setTimeout(30000);  // the server may still be generating the voice
  int code = http.GET();
  if (audioCancel) { http.end(); return; }  // HUSH arrived while downloading
  if (code != 200) {
    Serial.printf("[voice] HTTP %d\n", code);
    http.end();
    return;
  }
  Stream* s = http.getStreamPtr();

  // --- antet WAV: căutăm "fmt " și "data"
  uint8_t hdr[12];
  if (!readExact(s, hdr, 12) || memcmp(hdr, "RIFF", 4) || memcmp(hdr + 8, "WAVE", 4)) { http.end(); return; }
  uint32_t rate = 24000; uint16_t channels = 1, bits = 16;
  uint32_t dataLen = 0;
  while (true) {
    uint8_t ch[8];
    if (!readExact(s, ch, 8)) { http.end(); return; }
    uint32_t len = ch[4] | (ch[5] << 8) | (ch[6] << 16) | ((uint32_t)ch[7] << 24);
    if (!memcmp(ch, "fmt ", 4)) {
      uint8_t f[40];
      size_t take = min((uint32_t)sizeof(f), len);
      if (!readExact(s, f, take)) { http.end(); return; }
      for (uint32_t i = take; i < len; i++) { uint8_t d; readExact(s, &d, 1); }
      channels = f[2] | (f[3] << 8);
      rate = f[4] | (f[5] << 8) | (f[6] << 16) | ((uint32_t)f[7] << 24);
      bits = f[14] | (f[15] << 8);
    } else if (!memcmp(ch, "data", 4)) {
      dataLen = len;
      break;
    } else {
      for (uint32_t i = 0; i < len; i++) { uint8_t d; if (!readExact(s, &d, 1)) { http.end(); return; } }
    }
  }
  if (bits != 16 || channels < 1 || channels > 2) { Serial.println("[voice] WAV nesuportat"); http.end(); return; }
  i2s_set_clk(I2S_NUM_0, rate, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_STEREO);

  talking = true;
  const int vol = constrain(VOLUME_PERCENT, 0, 100);
  static int16_t in[512];
  static int16_t out[1024];
  uint32_t left = dataLen ? dataLen : 0xFFFFFFFF;
  while (left > 0 && !audioCancel) {
    size_t want = min((uint32_t)sizeof(in), left);
    want -= want % (2 * channels);
    if (want == 0) break;
    if (!readExact(s, (uint8_t*)in, want, 3000)) break;
    left -= want;
    size_t frames = want / (2 * channels);
    for (size_t i = 0; i < frames; i++) {
      int16_t l = in[i * channels];
      int16_t r = channels == 2 ? in[i * 2 + 1] : l;
      out[i * 2] = (int32_t)r * vol / 100;
      out[i * 2 + 1] = (int32_t)l * vol / 100;
    }
    size_t written;
    i2s_write(I2S_NUM_0, out, frames * 4, &written, portMAX_DELAY);
  }
  i2s_zero_dma_buffer(I2S_NUM_0);
  http.end();
  talking = false;
}

void audioTask(void*) {
  char id[17];
  for (;;) {
    if (xQueueReceive(sayQueue, id, portMAX_DELAY) == pdTRUE) {
      playWav(id);  // părțile răspunsului se redau în ordine
    }
  }
}

// ============================================================
// WI-FI
// ============================================================
// Extrage valoarea unui câmp text din JSON-ul trimis de aplicație.
bool jsonString(const String& js, const char* key, String& out) {
  String k = String("\"") + key + "\"";
  int p = js.indexOf(k);
  if (p < 0) return false;
  p = js.indexOf(':', p + k.length());
  if (p < 0) return false;
  p = js.indexOf('"', p);
  if (p < 0) return false;
  out = "";
  for (int i = p + 1; i < (int)js.length(); i++) {
    char c = js[i];
    if (c == '"') return true;
    if (c == '\\' && i + 1 < (int)js.length()) {
      char e = js[++i];
      if (e == 'n') out += '\n';
      else if (e == 't') out += '\t';
      else if (e == 'u' && i + 4 < (int)js.length()) {
        uint32_t cp = strtoul(js.substring(i + 1, i + 5).c_str(), nullptr, 16);
        i += 4;
        if (cp < 0x80) out += (char)cp;
        else if (cp < 0x800) { out += (char)(0xC0 | (cp >> 6)); out += (char)(0x80 | (cp & 0x3F)); }
        else { out += (char)(0xE0 | (cp >> 12)); out += (char)(0x80 | ((cp >> 6) & 0x3F)); out += (char)(0x80 | (cp & 0x3F)); }
      } else out += e;
    } else out += c;
  }
  return false;
}

// Robotul ține minte până la MAX_NETS rețele (acasă, școală, sediu...).
// Când nu e conectat, caută rețelele din jur și intră în cea salvată cu semnalul cel mai bun.
#define MAX_NETS 5
String netSsid[MAX_NETS], netPass[MAX_NETS];
int netCount = 0;
uint32_t lastWifiAttempt = 0;
bool wifiScanning = false;
volatile bool sendWifiInfo = false;   // trimite starea + lista către aplicație

void saveNets() {
  for (int i = 0; i < MAX_NETS; i++) {
    String ks = "s" + String(i), kp = "p" + String(i);
    if (i < netCount) { prefs.putString(ks.c_str(), netSsid[i]); prefs.putString(kp.c_str(), netPass[i]); }
    else { prefs.remove(ks.c_str()); prefs.remove(kp.c_str()); }
  }
}

void loadNets() {
  netCount = 0;
  for (int i = 0; i < MAX_NETS; i++) {
    String ks = "s" + String(i), kp = "p" + String(i);
    String ss = prefs.getString(ks.c_str(), "");
    if (ss.length()) { netSsid[netCount] = ss; netPass[netCount] = prefs.getString(kp.c_str(), ""); netCount++; }
  }
  if (netCount == 0) {  // rețeaua implicită din cod (dacă e completată)
    String ss = DEFAULT_WIFI_SSID;
    if (ss.length()) { netSsid[0] = ss; netPass[0] = DEFAULT_WIFI_PASS; netCount = 1; }
  }
}

int findNet(const String& ssid) {
  for (int i = 0; i < netCount; i++) if (netSsid[i] == ssid) return i;
  return -1;
}

void addNet(const String& ssid, const String& pass) {  // cea nouă devine prima
  int f = findNet(ssid);
  if (f >= 0) { for (int i = f; i < netCount - 1; i++) { netSsid[i] = netSsid[i + 1]; netPass[i] = netPass[i + 1]; } netCount--; }
  if (netCount == MAX_NETS) netCount--;  // se pierde cea mai veche
  for (int i = netCount; i > 0; i--) { netSsid[i] = netSsid[i - 1]; netPass[i] = netPass[i - 1]; }
  netSsid[0] = ssid; netPass[0] = pass; netCount++;
  saveNets();
}

void forgetNet(const String& ssid) {
  int f = findNet(ssid);
  if (f < 0) return;
  for (int i = f; i < netCount - 1; i++) { netSsid[i] = netSsid[i + 1]; netPass[i] = netPass[i + 1]; }
  netCount--;
  saveNets();
  if (WiFi.status() == WL_CONNECTED && WiFi.SSID() == ssid) WiFi.disconnect();
}

void wifiConnect(const String& ssid, const String& pass) {
  if (ssid.length() == 0) return;
  Serial.println("[wifi] Conectare la " + ssid);
  WiFi.disconnect();
  delay(50);
  WiFi.begin(ssid.c_str(), pass.c_str());
  lastWifiAttempt = millis();
}

// Apelat din loop(): fără blocare (scanare asincronă).
void wifiManager() {
  if (WiFi.status() == WL_CONNECTED || netCount == 0) { wifiScanning = false; return; }
  if (!wifiScanning) {
    if (millis() - lastWifiAttempt < 15000) return;  // lăsăm încercarea curentă să termine
    WiFi.scanNetworks(true);
    wifiScanning = true;
    return;
  }
  int n = WiFi.scanComplete();
  if (n == WIFI_SCAN_RUNNING) return;
  wifiScanning = false;
  int best = -1, bestRssi = -1000;
  for (int i = 0; i < n; i++) {
    int f = findNet(WiFi.SSID(i));
    if (f >= 0 && WiFi.RSSI(i) > bestRssi) { best = f; bestRssi = WiFi.RSSI(i); }
  }
  WiFi.scanDelete();
  static int roundRobin = 0;
  if (best < 0) best = (roundRobin++) % netCount;  // rețele ascunse: le încercăm pe rând
  wifiConnect(netSsid[best], netPass[best]);
}

void notifyWifi() {
  notifyText(String("WIFI:") + (WiFi.status() == WL_CONNECTED ? WiFi.SSID() : String("-")));
  delay(25);
  for (int i = 0; i < netCount; i++) { notifyText("WIFINET:" + netSsid[i]); delay(25); }
  notifyText("WIFIEND");
}

void handleWifiJson(const String& js) {
  String action, ssid, pass;
  jsonString(js, "action", action);
  jsonString(js, "ssid", ssid);
  if (action == "list") { sendWifiInfo = true; return; }
  if (action == "forget") { forgetNet(ssid); sendWifiInfo = true; return; }
  // implicit: adaugă / actualizează și conectează acum
  if (ssid.length() == 0 || ssid.length() > 32) { Serial.println("[wifi] date invalide"); return; }
  jsonString(js, "password", pass);
  addNet(ssid, pass);
  wifiConnect(ssid, pass);
  sendWifiInfo = true;
}

// ============================================================
// COMENZI
// ============================================================
void handleCommand(String cmd) {
  cmd.trim();
  if (cmd == "HUSH") { audioCancel = true; xQueueReset(sayQueue); return; }
  if (cmd.startsWith("SAY:")) {
    String id = cmd.substring(4);
    id.trim();
    if (id.length() == 0 || id.length() > 16) return;
    for (size_t i = 0; i < id.length(); i++) if (!isxdigit((unsigned char)id[i])) return;
    char buf[17] = {0};
    id.toCharArray(buf, sizeof(buf));
    xQueueSend(sayQueue, buf, 0);
    return;
  }
  if (cmd.startsWith("SPEED:")) {
    speedPercent = constrain((int)cmd.substring(6).toInt(), 0, 100);
    if (currentMove != M_STOP) applyMove(currentMove);
    return;
  }
  Move m;
  if (cmd == "FORWARD") m = M_FORWARD;
  else if (cmd == "BACKWARD") m = M_BACKWARD;
  else if (cmd == "LEFT") m = M_LEFT;
  else if (cmd == "RIGHT") m = M_RIGHT;
  else if (cmd == "STOP") m = M_STOP;
  else return;  // comenzi necunoscute sunt ignorate

  if (m == M_FORWARD && distanceCm > 0 && distanceCm < OBSTACLE_CM) { m = M_STOP; obstacleHit = true; }  // siguranță
  else if (m != M_STOP) obstacleHit = false;
  lastMoveCmd = millis();
  if (m != currentMove) applyMove(m);
}

// ============================================================
// BLE
// ============================================================
class ServerCb : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    bleConnected = true;
    sentState = "";
  }
  void onDisconnect(BLEServer* s) override {
    bleConnected = false;
    stopMotors();
    delay(200);
    s->getAdvertising()->start();
  }
};

class CommandCb : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    String v = String(c->getValue().c_str());
    portENTER_CRITICAL(&cmdMux);
    pendingCmd = v;
    hasPendingCmd = true;
    portEXIT_CRITICAL(&cmdMux);
    // STOP se execută imediat, fără să aștepte loop()
    if (v == "STOP") stopMotors();
    if (v == "HUSH") audioCancel = true;
  }
};

class WifiCb : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    pendingWifi = String(c->getValue().c_str());
    hasPendingWifi = true;
  }
};

void bleSetup() {
  BLEDevice::init("ELIO");
  BLEDevice::setMTU(185);
  bleServer = BLEDevice::createServer();
  bleServer->setCallbacks(new ServerCb());
  BLEService* svc = bleServer->createService(SERVICE_UUID);

  BLECharacteristic* cmd = svc->createCharacteristic(COMMAND_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  cmd->setCallbacks(new CommandCb());

  telemetryChar = svc->createCharacteristic(TELEMETRY_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  telemetryChar->addDescriptor(new BLE2902());

  BLECharacteristic* wifi = svc->createCharacteristic(WIFI_UUID, BLECharacteristic::PROPERTY_WRITE);
  wifi->setCallbacks(new WifiCb());

  svc->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("[ble] ELIO pornit, astept conectare");
}

// ============================================================
// SETUP / LOOP
// ============================================================
void setup() {
  pinMode(PIN_EN, OUTPUT); digitalWrite(PIN_EN, LOW);
  pinMode(PIN_IN1, OUTPUT); pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT); pinMode(PIN_IN4, OUTPUT);
  sideWrite(true, 0); sideWrite(false, 0);
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== ELIO firmware ===");

  pwmSetup();
  stopMotors();
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

#if USE_DISPLAY
  gfx->begin();
  gfx->fillScreen(C_BG);
  drawFace();
#endif

  prefs.begin("elio", false);
  loadNets();
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  if (netCount > 0) wifiConnect(netSsid[0], netPass[0]);

  i2sSetup();
  sayQueue = xQueueCreate(6, 17);
  xTaskCreatePinnedToCore(audioTask, "audio", 12288, nullptr, 2, nullptr, 0);

  bleSetup();
}

void loop() {
  static uint32_t lastDist = 0, lastTele = 0;
  static bool wifiWasOk = false;
  static bool bleWas = false;
  static uint32_t bleSince = 0, lastWifiInfo = 0;

  if (hasPendingCmd) {
    portENTER_CRITICAL(&cmdMux);
    String c = pendingCmd;
    hasPendingCmd = false;
    portEXIT_CRITICAL(&cmdMux);
    handleCommand(c);
  }
  if (hasPendingWifi) {
    hasPendingWifi = false;
    handleWifiJson(pendingWifi);
  }

  // oprire automată (heartbeat)
  if (currentMove != M_STOP && millis() - lastMoveCmd > HEARTBEAT_MS) stopMotors();

  // senzor distanță la ~15 ori pe secundă
  if (millis() - lastDist > 60) {
    lastDist = millis();
    distanceCm = readDistance();
    if (currentMove == M_FORWARD && distanceCm > 0 && distanceCm < OBSTACLE_CM) { stopMotors(); obstacleHit = true; }
    if (obstacleHit && (distanceCm < 0 || distanceCm > OBSTACLE_CM + 5)) obstacleHit = false;
  }

  // telemetrie la ~5 ori pe secundă
  if (bleConnected && millis() - lastTele > 200) {
    lastTele = millis();
    if (distanceCm > 0) notifyText("DISTANCE:" + String(distanceCm, 1));
  }
  updateState();

  wifiManager();
  if (bleConnected && !bleWas) bleSince = millis();
  bleWas = bleConnected;
  bool wifiOk = WiFi.status() == WL_CONNECTED;
  if (bleConnected && bleSince && millis() - bleSince > 800) { bleSince = 0; sendWifiInfo = true; }
  if (bleConnected && millis() - lastWifiInfo > 5000) {  // starea Wi-Fi la fiecare 5 s
    lastWifiInfo = millis();
    notifyText(String("WIFI:") + (wifiOk ? WiFi.SSID() : String("-")));
  }
  if (sendWifiInfo && bleConnected) { sendWifiInfo = false; lastWifiInfo = millis(); notifyWifi(); }
  if (wifiOk != wifiWasOk) {
    wifiWasOk = wifiOk;
    if (bleConnected) sendWifiInfo = true;
    if (wifiOk) Serial.println("[wifi] conectat, IP " + WiFi.localIP().toString());
    else Serial.println("[wifi] deconectat");
  }

#if USE_DISPLAY
  drawFace();
#endif
  delay(5);
}
