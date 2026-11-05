# ELIO: asistent AI (Gemini) + răspunsuri în difuzorul robotului

## Cum funcționează
1. Copilul apasă microfonul în pagina Asistent și vorbește. Telefonul transformă vocea în text.
2. Aplicația trimite textul la backend (`web/backend`), care îl întreabă pe Gemini.
3. Dacă robotul e conectat prin Bluetooth, backend-ul face și varianta audio a răspunsului (Gemini TTS).
4. Telefonul trimite robotului comanda scurtă `SAY:<id>`.
5. ESP32 descarcă prin Wi-Fi fișierul `/api/audio/<id>.wav` și îl redă pe difuzor (MAX98357A).
Dacă robotul nu e conectat, răspunsul se citește din telefon.

**Cheia Gemini stă DOAR în backend.** Nu o puneți în frontend, în cod sau pe GitHub
și nu o trimiteți nimănui (nici în chat). Tot ce începe cu `NEXT_PUBLIC_` e vizibil oricui.

## 1. Backend pe laptop
    cd web\backend
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    copy .env.example .env
Deschide `web\backend\.env` și pune cheia la `GEMINI_API_KEY=`. Fișierul `.env` nu ajunge pe GitHub.

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Verifică: http://localhost:8000/health trebuie să arate `"ai": true`.

## 2. Frontend legat de backend
În `web\frontend\.env.local`:
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
Repornește `npm run dev`. În pagina Asistent (varianta de mobil) poți scrie sau vorbi.

## 3. Publicare backend (Render, link https)
1. render.com → New → Web Service → alegi repo-ul de pe GitHub.
2. Root Directory: `web/backend`. Build: `pip install -r requirements.txt`.
   Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Environment: `GEMINI_API_KEY` = cheia ta, `ALLOWED_ORIGINS` = linkul Vercel (ex. `https://elio-xxx.vercel.app`).
4. Primești ceva de genul `https://elio-api.onrender.com`.
5. În Vercel → Settings → Environment Variables: `NEXT_PUBLIC_API_BASE_URL=https://elio-api.onrender.com` → Redeploy.
Pe planul gratuit Render serverul „adoarme” după ~15 minute fără folosire; prima întrebare după aceea durează ~1 minut.

## 4. Robotul (ESP32)
Firmware-ul complet e în `firmware/elio_firmware/elio_firmware.ino` (pași în `firmware/FIRMWARE_RO.md`).
Completează sus `API_BASE` = adresa backend-ului. Robotul trebuie să fie pe Wi-Fi
(Setări → Wi-Fi pentru ELIO în aplicație). Test pe laptop fără Render:
`API_BASE = "http://IP-ul-laptopului:8000"` (laptopul și robotul în aceeași rețea).

## 5. Setări utile (în `.env` sau în Render)
- `GEMINI_MODEL` (implicit `gemini-3.8-flash`) și `GEMINI_TTS_MODEL` (implicit `gemini-3.8-flash-tts`).
  Dacă Google schimbă numele modelelor, se schimbă doar aici.
- `GEMINI_VOICE` (implicit `Kore`). Alte voci: Puck, Aoede, Leda, Zephyr, Charon…
- `RATE_PER_MINUTE` (implicit 15) – câte întrebări pe minut de la un dispozitiv, ca să nu se consume cheia.

## Siguranță și date ale copiilor
- Backend-ul îi cere lui Gemini răspunsuri scurte, potrivite vârstei, fără date personale.
- La planul gratuit al Gemini API, Google poate folosi conversațiile pentru îmbunătățirea produselor.
  Pentru o aplicație folosită de copii, activați facturarea (plan plătit) în Google AI Studio și
  verificați termenii actuali; cereți și acordul părinților (GDPR).
- Se trimite doar textul întrebării; înregistrarea vocală rămâne în telefon.

## Răspunsuri rapide (predefinite)
Întrebările frecvente au răspuns instant, fără Gemini: `web/backend/knowledge/*.json`.
Vezi `web/backend/knowledge/CUM_EDITEZI_RO.md`. Vocea lor e păstrată în `web/backend/audio_cache`.
Pentru întrebările noi, textul apare cuvânt cu cuvânt, iar vocea pornește după prima propoziție.
