# ELIO – context pentru Claude Code

Proiectul ELIO (Tales & Tech Hub): robot educațional pentru copii + aplicație web/PWA + backend AI.
Utilizatorul vorbește română și nu e programator: explică pașii simplu, în română, și spune exact ce să ruleze.

## Structura
- `web/frontend` – Next.js 15 (App Router), React 19, TypeScript. Rulează pe portul **3001** (`npm run dev`), ca să nu se confunde cu altă aplicație de pe 3000.
- `web/backend` – FastAPI + Google Gemini (`google-genai`). Venv în `web/backend/.venv`.
  Pornire: `cd web\backend`, `.\.venv\Scripts\activate`, `python -m uvicorn app.main:app --reload --port 8000`.
  Atenție: VS Code poate activa alt `.venv` (din rădăcina proiectului); folosește-l pe cel din `web/backend`.
- `firmware/elio_firmware/elio_firmware.ino` – firmware ESP32 complet, NEÎNCĂRCAT încă pe placă (pe placă e firmware-ul vechi, fără sursă).
- `mobile/` – vechea aplicație Expo; nu se mai folosește (înlocuită de varianta mobilă a site-ului).

## Frontend
- O singură aplicație, două variante după lățime (850px): `components/responsive/Responsive.tsx` montează doar varianta potrivită.
  Desktop: componentele originale (`components/desktop`, `RobotControlPanel`, editor Blockly). NU le schimba fără cerere.
  Mobil: `components/mobile/MobileLayout.tsx` + `components/mobile/screens/*` (Home, Robot, Code, Assistant, Learn, Emotions, Projects, Settings), stil în `app/mobile.css` (clase `m*`).
- Blocuri pe mobil (`MobileCode.tsx`): ACELAȘI editor Blockly ca pe desktop (`components/code/CodeWorkspace`) + același `services/codeRunner` (run/halt/clear, `getWorkspace()`); aspectul pentru telefon e doar în `mobile.css` (`.mCodeArea`, categoriile pe un rând). Salvare în Proiecte (`lib/programs.ts`): `workspace` = JSON Blockly; programele vechi (listă de id-uri) se convertesc la deschidere. Blocurile Blockly sunt doar în engleză.
- PWA: `app/manifest.ts` (id `/?app=elio`), `public/sw.js` (doar în producție), iconițe în `public/icons`.
- Bluetooth: `services/robotBluetooth.ts` (Web Bluetooth; nu merge pe iPhone). Hook: `lib/useElio.ts`.
- Limbă: `lib/language.ts` (localStorage `elio-language`). Prompturi pe subiect: `lib/prompts.ts` + `components/mobile/PromptsCard.tsx`.
- Asistent: `components/mobile/screens/MobileAssistant.tsx`
  - subiecte: `general` (Discuție liberă), `blocks` (Cod și blocuri), `robotics` (afișat „ELIO”)
  - folosește `POST /api/chat/stream` (NDJSON: `{"t"}` text, `{"audio","text"}` părți de voce în ordine, `{"done"}`)
  - istoric separat pe fiecare subiect, doar în memorie: ieșirea din fila Asistent șterge toate conversațiile (subiectul ales rămâne în `sessionStorage` `elio-chat-topic`); schimbarea subiectului oprește și șterge răspunsul care se încărca
  - cu vocea pornită, textul fiecărei părți apare când începe vocea ei (`onplaying`); fără voce de la server/eroare → textul apare tot; siguranță 25 s
  - microfon push-to-talk (ține apăsat, eliberezi = trimite), `hush()` oprește vocea
  - recunoaștere vocală: la apăsare pornesc împreună SpeechRecognition (rezervă) și o înregistrare (`getUserMedia` + `MediaRecorder`, max 60 s). La eliberare: înregistrarea → WAV 16 kHz mono (`toWav16k`, scris de mână) → `POST /api/transcribe?lang=`. Se folosește textul Gemini; dacă e gol/eroare → textul browserului; ambele goale → nu trimite nimic. Cât așteaptă: „Te ascult...”. Microfonul se eliberează după fiecare înregistrare; audio nu se salvează nicăieri. Merge și pe iPhone (fără SpeechRecognition).
  - voce pe telefon = WAV de la backend (playbackRate 1, viteza se reglează doar în backend); „Robotul vorbește” (setare) → trimite `SAY:<id>` prin BLE
- `.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## Backend (`web/backend/app/main.py`)
- `.env` (NU se pune pe GitHub, nu se afișează cheia): `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite`,
  `GEMINI_FALLBACK_MODEL=gemini-3.6-flash`, `ALLOWED_ORIGINS=http://localhost:3001`. Gemini e folosit DOAR pentru text.
- Gemini e lent pe planul gratuit (4–30 s); setarea de „thinking” a încetinit, e oprită implicit.
- `POST /api/transcribe?lang=ro|en`: corp = WAV brut (`audio/wav`, citit cu `request.body()`, fără python-multipart), max 3 MB (413), gol → 400, ne-WAV → 415. `check_rate`, `ATTEMPTS` (reîncercare + rezervă), temperature 0, `thinking_level="minimal"` (Gemini 3 nu acceptă `thinking_budget=0` → 400; la 400 reîncearcă fără setare). Răspuns `{"text"}`; eroare Gemini → 503 `{"error":"busy"}`. Audio doar în memorie. ~1,5 s.
- Răspunsuri instant fără AI: `app/knowledge.py` + `knowledge/{elio,blocks,general}.json` (faq: `q` variante, `a` răspuns, `show` = buton). Potrivirea e strictă (fără răspunsuri greșite). Fișa `facts` merge în promptul Gemini.
- Voce: `TTS_PROVIDER=edge|piper` în `.env`, pentru toate răspunsurile (predefinite + Gemini). Gemini NU mai face voce.
  Edge (`edge-tts`, online, MP3 decodat cu `soundfile`): `EDGE_VOICE=ro-RO-AlinaNeural` (sau `ro-RO-EmilNeural`), `EDGE_VOICE_EN=en-US-AnaNeural`, `EDGE_RATE=-5%`; fiecare propoziție cerută separat (în paralel), liniștea Edge tăiată, apoi pauză `EDGE_SENTENCE_SILENCE=0.35` s; timeout 15 s; la orice eroare → Piper automat.
  Orice furnizor → `to_wav()`: WAV 24 kHz mono 16-bit, volum normalizat la vârf 0.95 (fără clipping).
- Piper (offline, `piper-tts`). Voci: `ro_RO-mihai-medium`, `en_US-lessac-medium`,
  descărcate automat la prima pornire în `web/backend/voices/` (în .gitignore), încărcate în fundal la start. Reglaje în `.env`: `PIPER_LENGTH_SCALE=1.05` (>1 mai rar), `PIPER_NOISE_SCALE=0.4`, `PIPER_NOISE_W=0.5` (mai mic = voce mai calmă), `PIPER_SENTENCE_SILENCE=0.25` (pauză în s între propoziții, adăugată manual).
  ~0,4 s/propoziție. Cache pe disc în `audio_cache/<furnizor>-<cheie>.wav` (cheie = furnizor+voce+reglaje+text). Prima propoziție primește voce separat.
- Rate limit pe IP, reîncercare + model de rezervă la 503/429, mesaj prietenos „busy”.
- Siguranță copii: promptul de sistem are reguli (fără date personale, conținut potrivit vârstei); instrucțiunile profesorului nu pot anula regulile.

## Firmware (Wemos D1 R32 / ESP32)
Pini: L298N EN(A+B)=12, IN1=17, IN2=13, IN3=14, IN4=27; HC-SR04 TRIG=25, ECHO=34; GC9A01 SCLK=22, MOSI=21, DC=26, CS=19, RST=16; MAX98357A BCLK=18, LRC=23, DIN=5.
BLE „ELIO”, serviciu `12345678-1234-1234-1234-123456789000`: `…9001` comenzi (FORWARD/BACKWARD/LEFT/RIGHT/STOP/SPEED:n/SAY:<id>/HUSH),
`…9002` telemetrie (DISTANCE:x, STATE:…, WIFI:<rețea|->, WIFINET:…, WIFIEND), `…9003` Wi-Fi JSON (adaugă / `{"action":"forget"|"list"}`), până la 5 rețele.
Siguranță: heartbeat 450 ms, oprire la obstacol < 12 cm, oprire la deconectare. Partition Scheme „Huge APP”. Înainte de încărcare: backup cu `esptool read_flash`.

## Ghiduri pentru utilizator
`PWA_SI_PUBLICARE_RO.md`, `AI_SI_VOCE_RO.md`, `firmware/FIRMWARE_RO.md`, `web/backend/knowledge/CUM_EDITEZI_RO.md`.

## Încă de făcut / idei
- Publicare: frontend pe Vercel (root `web/frontend`), backend pe Render (root `web/backend`), apoi `NEXT_PUBLIC_API_BASE_URL` și `ALLOWED_ORIGINS`.
- Încărcarea firmware-ului nou pe placă și test cu roțile ridicate.
- Pagina Asistent pe desktop e încă placeholder.
- Răspunsurile instant sunt doar în română.
