# Întrebări și răspunsuri predefinite ELIO

Fișierele din acest folder:
- `elio.json` – tab-ul **ELIO** (despre robot)
- `blocks.json` – tab-ul **Cod și blocuri** (blocurile ELIO + LEGO SPIKE)
- `general.json` – tab-ul **Discuție liberă**

Fiecare are:
- `facts` – fișa pe care o primește Gemini pentru întrebările care NU sunt în listă
- `faq` – lista de întrebări cu răspuns instant

## O intrebare
```json
{
 "q": ["ce senzori ai", "cum vezi", "ai ochi"],
 "a": "Am un senzor ultrasonic HC-SR04 în față...",
 "show": "Ce senzori ai?"
}
```
- `q` – mai multe feluri în care copiii pot pune aceeași întrebare (fără diacritice e ok)
- `a` – răspunsul; scurt (2–3 propoziții), pentru că e citit cu voce tare
- `show` – opțional: dacă există, întrebarea apare ca buton în aplicație (primele 6)

## Reguli
- Atenție la virgule: între întrebări pui `,` dar NU după ultima.
- Salvezi fișierul și gata: backend-ul îl citește din nou singur.
- Dacă ai greșit ceva în fișier, în terminal apare `[knowledge] ... has an error` și lista aceea e ignorată până o repari.
- Răspunsul se potrivește doar când ELIO e sigur; altfel întrebarea merge la Gemini.

## Voce
Vocea răspunsurilor predefinite se face o singură dată și se păstrează în `web/backend/audio_cache`.
Vocea e făcută de Piper, direct pe calculator (offline, gratuit, fără limită pe zi).
Dacă schimbi vocea sau viteza, șterge folderul `audio_cache`.
