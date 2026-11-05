# ELIO Web Premium V2

Blue/orange Tales & Tech Hub responsive redesign with real ELIO robot photo.

# ELIO Web Full Stack
ELIO web/PWA starter with Next.js frontend, FastAPI backend, Web Bluetooth robot control, emotions, AI-ready assistant, Learn area and Scratch-inspired visual programming.

## Run frontend
cd frontend
npm install
npm run dev

## Run backend
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload

Set NEXT_PUBLIC_API_BASE_URL in frontend/.env.local before deployment.
