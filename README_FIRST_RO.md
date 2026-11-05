# ELIO – pachet web + mobil

## Structura
- `mobile/` = aplicația Expo React Native originală, păstrată și extinsă cu Control, Monitor și Blocks.
- `web/` = codul-sursă web primit (frontend Next.js + backend FastAPI), fără directoarele generate `.next` și `node_modules`.

## Pe telefon
- Control: viteză și joystick original, fără cardurile de monitorizare și siguranță care au fost mutate în Monitor.
- Monitor: starea BLE, telemetrie și STOP de urgență.
- Home: linkuri și către Emotions și Projects, care erau doar placeholder în sursa desktop.
- Blocks: toate categoriile și definițiile de blocuri din web. UI mobilă este adaptată la tema existentă, prin atingere, nu este copia motorului vizual Blockly din browser.
- Conexiunea BLE se inițializează global în `app/_layout.tsx` prin `context/ElioConnection.tsx`, se păstrează la schimbarea taburilor și încearcă reconectarea când aplicația este în prim plan. Nu se garantează conexiune în background.

## Limite importante
- Doar blocurile `move-forward`, `move-backward`, `turn-left`, `turn-right`, `stop-elio`, `set-speed`, `wait` și `green-flag` au execuție demonstrativă prin protocolul BLE existent. Restul blocurilor desktop sunt afișate în editor; executarea lor necesită firmware/backend nou.
- Motorul Blockly web rămâne în `web/`; nu poate fi importat direct într-o componentă nativă React Native fără un WebView și adaptare suplimentară.
- Aplicația web și backend-ul nu sunt necesare pentru conexiunea Bluetooth locală.
- Testați pe Android cu development build, cu roțile robotului ridicate; ESP32 trebuie să oprească motoarele independent când nu mai primește heartbeat.

## Pornire mobil
```sh
cd mobile
npm install
npx tsc --noEmit
npx expo start --dev-client
```
Pentru build nou după modificările native: `npx eas-cli build --profile development --platform android`.

## Pornire web
```sh
cd web/frontend
npm install
npm run dev
```
Backend: `cd web/backend`, instalați `requirements.txt`, apoi porniți aplicația ASGI conform configurației locale.
