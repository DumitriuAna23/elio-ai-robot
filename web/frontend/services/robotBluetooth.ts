"use client";

export type Telemetry = { distance: number | null; state: string };
const SERVICE = "12345678-1234-1234-1234-123456789000";
const COMMAND = "12345678-1234-1234-1234-123456789001";
const TELEMETRY = "12345678-1234-1234-1234-123456789002";
const WIFI_CONFIG = "12345678-1234-1234-1234-123456789003";

type Listener = (value: Telemetry) => void;
let device: any = null;
let command: any = null;
let telemetryCharacteristic: any = null;
let elioService: any = null;
let last: Telemetry = { distance: null, state: "DISCONNECTED" };
const listeners = new Set<Listener>();
// Wi-Fi reported by the new ELIO firmware: current network + saved networks.
export type WifiInfo = { known: boolean; current: string | null; saved: string[] };
let wifi: WifiInfo = { known: false, current: null, saved: [] };
let wifiPending: string[] = [];
const wifiListeners = new Set<(w: WifiInfo) => void>();
const emitWifi = () => wifiListeners.forEach((l) => l({ ...wifi, saved: [...wifi.saved] }));
export function onWifi(listener: (w: WifiInfo) => void) {
  wifiListeners.add(listener);
  listener({ ...wifi, saved: [...wifi.saved] });
  return () => { wifiListeners.delete(listener); };
}
let connecting: Promise<boolean> | null = null;
let autoTimer: ReturnType<typeof setInterval> | null = null;
let intentionallyDisconnected = false;
let writeQueue: Promise<void> = Promise.resolve();
const emit = () => { listeners.forEach(listener => listener({ ...last })); if (typeof window !== 'undefined') window.dispatchEvent(new Event('elio-ble-state')); };
export const supported = () => typeof navigator !== 'undefined' && !!(navigator as any).bluetooth && window.isSecureContext;
export const isConnected = () => !!device?.gatt?.connected && !!command;
export function onTelemetry(listener: Listener) {
  listeners.add(listener);
  listener({ ...last });
  return () => { listeners.delete(listener); };
}
function onValueChanged(event: any) {
  const value = event.target?.value;
  if (!value) return;
  const data = new TextDecoder().decode(value);
  if (data.startsWith('DISTANCE:')) {
    const distance = Number(data.slice(9));
    if (Number.isFinite(distance)) last.distance = distance;
  } else if (data.startsWith('STATE:')) {
    last.state = data.slice(6);
  } else if (data.startsWith('WIFI:')) {
    const v = data.slice(5);
    wifi = { ...wifi, known: true, current: v === '-' ? null : v };
wifiPending = [];
    emitWifi();
    return;
  } else if (data.startsWith('WIFINET:')) {
    wifiPending.push(data.slice(8));
    return;
  } else if (data === 'WIFIEND') {
    wifi = { ...wifi, known: true, saved: wifiPending };
    wifiPending = [];
    emitWifi();
    return;
  }
  emit();
}
function disconnected() {
  command = null;
  telemetryCharacteristic = null;
  elioService = null;
  wifi = { known: false, current: null, saved: [] };
  wifiPending = [];
  emitWifi();
  last = { distance: null, state: 'DISCONNECTED' };
  emit();
}
async function attach(target: any): Promise<boolean> {
  if (isConnected()) return true;
  if (connecting) return connecting;
  connecting = (async () => {
    if (device && device !== target) {
      device.removeEventListener('gattserverdisconnected', disconnected);
    }
    device = target;
    device.removeEventListener('gattserverdisconnected', disconnected);
    device.addEventListener('gattserverdisconnected', disconnected);
    const server = await target.gatt.connect();
    if (!server?.connected) throw new Error('ELIO GATT connection was not established.');
    const service = await server.getPrimaryService(SERVICE);
    elioService = service;
    command = await service.getCharacteristic(COMMAND);
    telemetryCharacteristic = await service.getCharacteristic(TELEMETRY);
    telemetryCharacteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
    telemetryCharacteristic.addEventListener('characteristicvaluechanged', onValueChanged);
    await telemetryCharacteristic.startNotifications();
    last = { distance: null, state: 'CONNECTED' };
    emit();
    return true;
  })();
  try { return await connecting; }
  catch (error) { disconnected(); throw error; }
  finally { connecting = null; }
}
// First pairing MUST be called directly from the user's Connect button.
export async function connect(): Promise<boolean> {
  if (!supported()) throw new Error('Use Chrome/Edge with Bluetooth on HTTPS or localhost.');
  if (isConnected()) return true;
  intentionallyDisconnected = false;
  const bt = (navigator as any).bluetooth;
  // Keep requestDevice in the direct click flow: don't await getDevices first.
  const selected = await bt.requestDevice({
    filters: [{ name: 'ELIO' }],
    optionalServices: [SERVICE],
  });
  return attach(selected);
}
// Silent reconnect only works after permission has been granted for this origin.
export async function reconnectKnown(): Promise<boolean> {
  if (intentionallyDisconnected || !supported()) return false;
  if (isConnected()) return true;
  const bt = (navigator as any).bluetooth;
  if (typeof bt.getDevices !== 'function') return false;
  const known = await bt.getDevices();
  const elio = known.find((d: any) => d.name === 'ELIO');
  if (!elio) return false;
  return attach(elio);
}
export function keepConnected() {
  if (autoTimer) return;
  void reconnectKnown().catch(() => {});
  autoTimer = setInterval(() => {
    if (!isConnected() && !intentionallyDisconnected) {
      void reconnectKnown().catch(() => {});
    }
  }, 12000);
}
export function stopAutoReconnect() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = null;
}
export async function send(payload: string): Promise<boolean> {
  // Serialize writes: Web Bluetooth allows only one GATT operation at a time.
  const result = writeQueue.catch(() => {}).then(async (): Promise<boolean> => {
    if (!isConnected()) return false;
    const characteristic = command;
    const data = new TextEncoder().encode(payload);
    try {
      if (characteristic.properties.writeWithoutResponse && typeof characteristic.writeValueWithoutResponse === 'function') {
        await characteristic.writeValueWithoutResponse(data);
      } else {
        await characteristic.writeValue(data);
      }
      return true;
    } catch (error) {
      if (!device?.gatt?.connected) { disconnected(); return false; }
      throw error;
    }
  });
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}
export async function stopRobot() {
  if (isConnected()) await send('STOP');
}
export async function disconnect() {
  intentionallyDisconnected = true;
  try { await stopRobot(); } catch {}
  try { if (device?.gatt?.connected) device.gatt.disconnect(); } catch {}
  disconnected();
}

// Wi-Fi setup over BLE (needs the new ELIO firmware). The robot remembers up to
// 5 networks and joins whichever saved one is available. Passwords are never
// stored by the app. A successful write does not prove Wi-Fi connected: the
// robot reports "WIFI:<network>" when it is online.
async function writeWifi(payload: object) {
  if (!isConnected() || !elioService) throw new Error('Connect ELIO over Bluetooth first.');
  const data = new TextEncoder().encode(JSON.stringify(payload));
  if (data.byteLength > 180) throw new Error('Wi-Fi credentials are too long for this BLE protocol.');
  let characteristic: any;
  try { characteristic = await elioService.getCharacteristic(WIFI_CONFIG); }
  catch { throw new Error('This ELIO firmware does not support Wi-Fi setup yet.'); }
  const job = writeQueue.catch(() => {}).then(() => characteristic.writeValueWithResponse ? characteristic.writeValueWithResponse(data) : characteristic.writeValue(data));
  writeQueue = job.then(() => undefined, () => undefined);
  await job;
}

export async function sendWifiConfig(ssid: string, password: string) {
  const name = ssid.trim();
  if (!name || name.length > 32 || password.length > 63) throw new Error('Invalid Wi-Fi name or password length.');
  await writeWifi({ ssid: name, password });
}
export const forgetWifi = (ssid: string) => writeWifi({ action: 'forget', ssid });
export const requestWifiList = () => writeWifi({ action: 'list' });