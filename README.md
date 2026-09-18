# ELIO App — Expo SDK 54
Mobile companion for the ELIO educational robot by Tales and Tech Hub.

## Requirements
- Node.js 20.19+ recommended for Expo SDK 54
- Expo Go compatible with SDK 54

## Run
1. Extract this ZIP into a NEW folder (do not overwrite the old project).
2. Open `elio-app` in VS Code.
3. Run `npm install`.
4. Run `npx expo start -c`.
5. Scan the QR code with Expo Go.

## Current MVP
- Home dashboard
- Assistant chat UI (AI backend placeholder)
- Learn modes
- Robot controls prepared for ESP32 HTTP API
- Settings / language / voice toggles

## Robot API expected
POST `/command` JSON body: `{ "command": "forward|backward|left|right|stop" }`
GET `/telemetry` -> `{ "distance": 24.6, "state": "idle" }`

The mobile app intentionally contains no AI secret key. Add AI through a protected backend later.
