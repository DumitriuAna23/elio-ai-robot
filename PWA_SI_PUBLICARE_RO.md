# ELIO ca aplicație instalabilă (PWA), publică, fără Expo Go

## O singură aplicație, două variante
Același link deschide automat:
- **varianta desktop** pe ecrane mai late de 850px (laptop, tabletă pe orizontală);
- **varianta de mobil** pe ecrane mai înguste (telefon, tabletă pe verticală).
Comutarea se face în `components/responsive/Responsive.tsx`. Se încarcă doar varianta potrivită,
iar dacă rotești tableta sau micșorezi fereastra, aplicația trece singură pe cealaltă variantă.

Varianta de mobil e refăcută după aplicația Expo, în culorile ELIO de pe web:
- Acasă – salut, starea robotului, butoane către toate paginile, buton „Instalează”
- Control – conectare Bluetooth, joystick, viteză, distanță, stare, STOP de urgență (Control + Monitor din Expo)
- Blocuri – aceleași categorii și blocuri ca pe desktop, adaugi prin atingere, rulezi, salvezi
- Asistent – chat cu backend-ul (/api/chat), subiecte, întrebări cu vocea, răspuns vocal opțional
- Învață – quiz, ghicitori, „Descoperă”
- Emoții – expresia de repaus (salvată pe dispozitiv)
- Proiecte – programele salvate din Blocuri; le deschizi sau le ștergi
- Setări – limbă, răspunsuri vocale, Bluetooth, Wi-Fi pentru ELIO, instalare
Fișierele: `components/mobile/`, `lib/`, `app/mobile.css`.
Varianta desktop a rămas neschimbată.

## Ce s-a adăugat (în web/frontend)
- app/manifest.ts – numele, culorile și iconițele aplicației
- app/layout.tsx – iconițe, culoare temă, suport iPhone „Add to Home Screen”
- public/sw.js – service worker (face aplicația instalabilă, merge și cu net slab)
- components/pwa/RegisterServiceWorker.tsx – activează service worker-ul (doar în producție)
- public/icons/ – iconițele ELIO (192, 512, maskable, Apple)
- .gitignore – ca node_modules/.next să nu ajungă pe GitHub
- services/robotBluetooth.ts – adăugată funcția de trimitere Wi-Fi (`sendWifiConfig`)

## 1. Test local
    cd web\frontend
    npm install
    npm run build
    npm start
Deschide http://localhost:3000 în Chrome/Edge. În bara de adrese apare iconița „Instalează”.
(Cu `npm run dev` nu apare, service worker-ul e oprit intenționat în dezvoltare.)

## 2. Publicare gratuită pe Vercel (link public HTTPS)
1. Pune proiectul pe GitHub (repo nou, încarci tot folderul ELIO_Complete_2026).
2. Intră pe vercel.com → Sign up cu GitHub → Add New → Project → alegi repo-ul.
3. La **Root Directory** alegi `web/frontend`. Framework: Next.js (detectat automat).
4. Deploy. Primești un link de tipul https://elio-xxxx.vercel.app
5. La fiecare `git push`, Vercel publică automat versiunea nouă.

Backend-ul (web/backend) nu e folosit încă de frontend. Când îl conectați:
render.com → New → Blueprint/Web Service → Root Directory `web/backend` (render.yaml există deja),
apoi în Vercel → Settings → Environment Variables: `NEXT_PUBLIC_API_BASE_URL=https://elio-api.onrender.com` → Redeploy.

Ca să apară în căutările Google, după publicare adaugă site-ul în Google Search Console
(search.google.com/search-console) → „Adaugă proprietate” → linkul Vercel. Indexarea durează câteva zile.
Până atunci, oricine deschide linkul direct poate instala aplicația.

## 3. Instalare
- Laptop (Chrome/Edge): deschizi linkul → iconița „Instalează” din bara de adrese.
- Android (Chrome): deschizi linkul → meniul ⋮ → „Instalează aplicația”.
- iPhone (Safari): deschizi linkul → Partajare → „Adaugă pe ecranul principal”.

## Important: Bluetooth (controlul robotului)
Web Bluetooth merge în Chrome/Edge pe Windows, macOS, Android și ChromeOS.
NU merge pe iPhone/iPad (niciun browser de pe iOS nu îl suportă) și nici în Firefox.
Pe iPhone, PWA-ul merge pentru Learn, Code, Assistant etc., dar nu se poate conecta la robot.
Pentru robot pe iPhone e nevoie de aplicația nativă din `mobile/` construită cu EAS
(cont Apple Developer, 99 $/an).
Pentru Android fără Expo Go, alternativ la PWA:
    cd mobile
    npx eas-cli build -p android --profile preview
→ primești un .apk instalabil direct.
