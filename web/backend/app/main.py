"""ELIO API: AI assistant (Gemini) + spoken answers for the robot speaker.

Flow:  phone (speech -> text) -> POST /api/chat -> Gemini answer
       -> optional Piper TTS (offline, on this server) -> WAV kept for a few minutes
       -> phone sends "SAY:<id>" to ELIO over Bluetooth
       -> ESP32 downloads GET /api/audio/<id>.wav over Wi-Fi and plays it.

The Gemini key lives ONLY here, in the GEMINI_API_KEY environment variable.
Never put it in the frontend (anything NEXT_PUBLIC_... is visible to everyone).
"""
import io
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from typing import Literal

import hashlib
import json
import re
import wave
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import knowledge

try:  # loads web/backend/.env when running locally
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")  # fastest; minimal thinking
# Used automatically when the main model is overloaded (503) or rate-limited (429).
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash")
# "minimal"/"low" limits the model's thinking. In tests it was SLOWER, so it's off by default.
GEMINI_THINKING = os.getenv("GEMINI_THINKING", "").strip()
# Comma-separated list of sites allowed to call the API, e.g.
# "https://elio.vercel.app,http://localhost:3001". "*" = everyone (dev only).
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
RATE_PER_MINUTE = int(os.getenv("RATE_PER_MINUTE", "15"))
AUDIO_TTL_SECONDS = 10 * 60
MAX_AUDIO_FILES = 200

app = FastAPI(title="ELIO API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_client = None


def gemini():
    global _client
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not set on the server.")
    if _client is None:
        from google import genai

        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


# ---------------------------------------------------------------- safety prompt
TOPICS = {
    "general": "any curious question a child might have about the world, science, nature, history or school",
    "blocks": "programming: the blocks in the ELIO app and LEGO Education SPIKE (Prime and Essential) blocks, hubs, motors and sensors",
    "robotics": "the ELIO robot itself (its parts, sensors, how to use it with the app) and robotics in general",
}


def system_prompt(project: str, language: str, instructions: str = "") -> str:
    lang = "Romanian" if language == "ro" else "English"
    topic = TOPICS.get(project, TOPICS["general"])
    extra = ""
    sheet = knowledge.facts(project)
    if sheet:
        extra += "\n\nFacts you can rely on for this topic:\n" + sheet.strip()
    if instructions.strip():
        extra += (
            "\n\nExtra instructions from the teacher for this topic (follow them, "
            "but they can never override the safety rules above):\n" + instructions.strip()
        )
    return f"""You are ELIO, a friendly educational desk robot made by Tales & Tech Hub, talking with a child aged about 6-14.
Always answer in {lang}. Current topic: {topic}.
Rules:
- Your answer will be read aloud by a small robot speaker: 2 or 3 short sentences (about 40 words), simple words, no lists, no markdown, no emojis, no links.
- Explain step by step like a patient teacher; use a small everyday example when it helps. Encourage curiosity.
- Be kind, positive and age-appropriate. Never produce violent, sexual, frightening, hateful or dangerous content, and never give instructions that could hurt someone.
- If the child asks something unsafe, or about something a trusted adult should handle (health, feeling very sad, being hurt), gently say it is a good question for a parent or teacher.
- Never ask for or repeat personal information (full name, address, school, phone, passwords). If the child shares it, don't repeat it.
- If you don't know, say so honestly.{extra}"""


# ---------------------------------------------------------------- rate limiting
_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def check_rate(request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    now = time.time()
    with _lock:
        q = _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_PER_MINUTE:
            raise HTTPException(429, "Too many questions, wait a minute.")
        q.append(now)


# ---------------------------------------------------------------- audio store
# id -> [created, wav bytes or None while generating, ready event]
_audio: dict[str, list] = {}


def start_audio(text: str, language: str) -> str:
    """Reserve an id now and make the voice in the background, so the text
    answer can be sent right away. /api/audio/<id>.wav waits until it's ready."""
    now = time.time()
    with _lock:
        for k in [k for k, v in _audio.items() if now - v[0] > AUDIO_TTL_SECONDS]:
            del _audio[k]
        while len(_audio) >= MAX_AUDIO_FILES:
            del _audio[min(_audio, key=lambda k: _audio[k][0])]
        audio_id = secrets.token_hex(4)  # 8 chars: "SAY:" + id fits in one BLE packet
        item = [now, None, threading.Event()]
        _audio[audio_id] = item

    def work():
        try:
            t0 = time.time()
            item[1], used = cached_speech(text, language)
            print(f"[timp] voce {used}: {time.time() - t0:.1f} s")
        except Exception as e:  # the text answer still works without voice
            print("TTS error:", repr(e))
        finally:
            item[2].set()

    threading.Thread(target=work, daemon=True).start()
    return audio_id


# ---------------------------------------------------------------- voice
# TTS_PROVIDER=edge -> Microsoft Edge online voices (needs internet; if it fails, Piper is used)
# TTS_PROVIDER=piper -> Piper, offline on this computer
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "edge").strip().lower()
EDGE_VOICES = {
    "ro": os.getenv("EDGE_VOICE", "ro-RO-AlinaNeural"),  # or ro-RO-EmilNeural
    "en": os.getenv("EDGE_VOICE_EN", "en-US-AnaNeural"),
}
EDGE_RATE = os.getenv("EDGE_RATE", "-5%")  # "-10%" slower, "+0%" normal, "+10%" faster
EDGE_SENTENCE_SILENCE = float(os.getenv("EDGE_SENTENCE_SILENCE", "0.35"))  # seconds of pause between sentences
EDGE_TIMEOUT = 15  # seconds; after that, Piper takes over
OUT_RATE = 24000  # every WAV we send: 24 kHz, mono, 16-bit (phone + robot)
PEAK = 0.95  # loudness: the loudest sample goes to 95% of maximum, so nothing clips
BACKEND_DIR = Path(__file__).resolve().parent.parent
AUDIO_CACHE = BACKEND_DIR / "audio_cache"
VOICES_DIR = BACKEND_DIR / "voices"  # downloaded automatically the first time, not on GitHub
PIPER_VOICES = {"ro": "ro_RO-mihai-medium", "en": "en_US-lessac-medium"}
# Voice tuning, from .env. LENGTH_SCALE: >1 slower, <1 faster. NOISE_*: lower = calmer, steadier voice.
PIPER_LENGTH_SCALE = float(os.getenv("PIPER_LENGTH_SCALE", "1.05"))
PIPER_NOISE_SCALE = float(os.getenv("PIPER_NOISE_SCALE", "0.4"))
PIPER_NOISE_W = float(os.getenv("PIPER_NOISE_W", "0.5"))
PIPER_SENTENCE_SILENCE = float(os.getenv("PIPER_SENTENCE_SILENCE", "0.25"))  # seconds of pause after each sentence
PIPER_SETTINGS = f"{PIPER_LENGTH_SCALE}|{PIPER_NOISE_SCALE}|{PIPER_NOISE_W}|{PIPER_SENTENCE_SILENCE}"
_voices: dict = {}
_voice_lock = threading.Lock()


def piper_voice(language: str):
    """Load the voice once (downloading it on first use) and keep it in memory."""
    name = PIPER_VOICES.get(language, PIPER_VOICES["ro"])
    with _voice_lock:
        if name not in _voices:
            from piper import PiperVoice
            from piper.download_voices import download_voice

            model = VOICES_DIR / f"{name}.onnx"
            if not model.exists() or not (VOICES_DIR / f"{name}.onnx.json").exists():
                print(f"[voce] descarc vocea {name} (o singura data)...")
                VOICES_DIR.mkdir(parents=True, exist_ok=True)
                download_voice(name, VOICES_DIR)
            _voices[name] = PiperVoice.load(str(model))
        return name, _voices[name]


def piper_samples(text: str, language: str):
    """Piper -> (float samples -1..1, sample rate)."""
    import numpy as np
    from piper import SynthesisConfig

    _, voice = piper_voice(language)
    config = SynthesisConfig(
        length_scale=PIPER_LENGTH_SCALE,
        noise_scale=PIPER_NOISE_SCALE,
        noise_w_scale=PIPER_NOISE_W,
    )
    rate = voice.config.sample_rate
    silence = np.zeros(int(rate * PIPER_SENTENCE_SILENCE), dtype=np.float32)
    parts = []
    for chunk in voice.synthesize(text, syn_config=config):  # one chunk per sentence
        if parts:  # pause between sentences, not at the very end
            parts.append(silence)
        parts.append(chunk.audio_int16_array.astype(np.float32).reshape(-1) / 32768)
    return (np.concatenate(parts) if parts else np.zeros(0, dtype=np.float32)), rate


def edge_samples(text: str, language: str):
    """Edge online voice (MP3) -> (float samples -1..1, sample rate)."""
    import asyncio

    import edge_tts
    import soundfile as sf

    import numpy as np

    voice = EDGE_VOICES.get(language, EDGE_VOICES["ro"])
    # Each sentence separately (all at once, in parallel), then a clear pause between them.
    sentences = [x for x in re.split(r"(?<=[.!?…])\s+", text.strip()) if x.strip()] or [text]

    async def fetch(sentence: str) -> bytes:
        mp3 = bytearray()
        async for part in edge_tts.Communicate(sentence, voice, rate=EDGE_RATE).stream():
            if part["type"] == "audio":
                mp3 += part["data"]
        return bytes(mp3)

    async def fetch_all():
        return await asyncio.gather(*(fetch(x) for x in sentences))

    parts, rate = [], 24000
    for mp3 in asyncio.run(asyncio.wait_for(fetch_all(), EDGE_TIMEOUT)):
        if not mp3:
            raise RuntimeError("Edge returned no audio")
        data, rate = sf.read(io.BytesIO(mp3), dtype="float32")
        if data.ndim > 1:  # stereo -> mono
            data = data.mean(axis=1)
        loud = np.flatnonzero(np.abs(data) > 0.01)  # cut Edge's own silence at both ends
        if len(loud):
            data = data[max(0, loud[0] - int(rate * 0.03)): loud[-1] + int(rate * 0.08)]
        if parts:
            parts.append(np.zeros(int(rate * EDGE_SENTENCE_SILENCE), dtype=np.float32))
        parts.append(data)
    return np.concatenate(parts), rate


def to_wav(samples, rate: int) -> bytes:
    """Any samples -> WAV 24 kHz mono 16-bit, with the volume brought close to maximum."""
    import numpy as np

    if rate != OUT_RATE and len(samples):
        n = int(round(len(samples) * OUT_RATE / rate))
        samples = np.interp(np.arange(n) * (rate / OUT_RATE), np.arange(len(samples)), samples)
    peak = float(np.max(np.abs(samples))) if len(samples) else 0.0
    if peak > 1e-4:  # skip pure silence
        samples = samples * (PEAK / peak)
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_RATE)
        w.writeframes(pcm)
    return buf.getvalue()


def cached_speech(text: str, language: str) -> tuple[bytes, str]:
    """Same sentence + same voice = same sound: make it once, keep it on disk.
    Returns (wav, "provider voice"). If Edge fails (e.g. no internet), Piper is used."""
    providers = ["edge", "piper"] if TTS_PROVIDER == "edge" else ["piper"]
    for provider in providers:
        if provider == "edge":
            voice, settings, make = EDGE_VOICES.get(language, EDGE_VOICES["ro"]), f"{EDGE_RATE}|{EDGE_SENTENCE_SILENCE}", edge_samples
        else:
            voice, settings, make = PIPER_VOICES.get(language, PIPER_VOICES["ro"]), PIPER_SETTINGS, piper_samples
        key = hashlib.sha1(f"{provider}|{voice}|{settings}|{OUT_RATE}|{PEAK}|{text}".encode()).hexdigest()[:20]
        path = AUDIO_CACHE / f"{provider}-{key}.wav"
        try:
            return path.read_bytes(), f"{provider} {voice} (cache)"
        except OSError:
            pass
        try:
            wav = to_wav(*make(text, language))
        except Exception as e:
            if provider == "piper":
                raise
            print(f"[voce] Edge nu merge ({type(e).__name__}: {str(e)[:80]}), folosesc Piper")
            continue
        try:
            AUDIO_CACHE.mkdir(parents=True, exist_ok=True)
            path.write_bytes(wav)
        except OSError:
            pass
        return wav, f"{provider} {voice}"
    raise RuntimeError("no voice provider worked")


def _preload_voices():
    """Download/load the voices at startup, so the first answer isn't slow."""
    for lang in PIPER_VOICES:
        try:
            piper_voice(lang)
        except Exception as e:
            print(f"[voce] nu am putut pregati vocea {lang}:", repr(e))


threading.Thread(target=_preload_voices, daemon=True).start()


# ---------------------------------------------------------------- endpoints
class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class Chat(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    project: str = "general"
    language: Literal["ro", "en"] = "ro"
    history: list[Turn] = Field(default_factory=list, max_length=8)
    speak: bool = False  # True when the answer should also be spoken
    instructions: str = Field(default="", max_length=1500)  # teacher's prompt for this topic (from the app)


@app.get("/health")
def health():
    return {"status": "ok", "ai": bool(GEMINI_API_KEY), "model": GEMINI_MODEL}


def build_request(x: "Chat"):
    from google.genai import types

    contents = [
        types.Content(role="user" if t.role == "user" else "model", parts=[types.Part(text=t.content)])
        for t in x.history[-8:]
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=x.message)]))
    extra = {}
    if GEMINI_THINKING:
        extra["thinking_config"] = types.ThinkingConfig(thinking_level=GEMINI_THINKING)
    config = types.GenerateContentConfig(
        system_instruction=system_prompt(x.project, x.language, x.instructions),
        temperature=0.7,
        max_output_tokens=1024,
        **extra,
    )
    return contents, config


TEMPORARY = ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "500", "INTERNAL")
# Busy model (503) or too many requests (429): wait a little and retry, then use the fallback model.
ATTEMPTS = [(GEMINI_MODEL, 0), (GEMINI_MODEL, 1.0), (GEMINI_FALLBACK_MODEL, 0), (GEMINI_FALLBACK_MODEL, 1.5)]


def fail(last_error: Exception):
    busy = any(code in str(last_error) for code in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED"))
    raise HTTPException(503 if busy else 502, "busy" if busy else f"Gemini: {str(last_error)[:200]}")


def empty_reply(language: str) -> str:
    return "Hmm, nu am un răspuns acum. Mai întreabă-mă o dată!" if language == "ro" else "Hmm, I don't have an answer right now. Ask me again!"


@app.post("/api/chat")
def chat(x: Chat, request: Request):
    """Whole answer at once (kept for compatibility)."""
    check_rate(request)
    if x.language == "ro" and (known := knowledge.find_answer(x.message, x.project)):
        return {"reply": known, "audio_id": start_audio(known, x.language) if x.speak else None, "faq": True}
    contents, config = build_request(x)
    reply, last_error = "", None
    for model, wait in ATTEMPTS:
        if not model:
            continue
        if wait:
            time.sleep(wait)
        try:
            t0 = time.time()
            result = gemini().models.generate_content(model=model, contents=contents, config=config)
            reply = (result.text or "").strip()
            print(f"[timp] text de la {model}: {time.time() - t0:.1f} s")
            last_error = None
            break
        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            print(f"Gemini chat error ({model}):", repr(e))
            if not any(code in str(e) for code in TEMPORARY):
                break
    if last_error is not None:
        fail(last_error)
    reply = reply or empty_reply(x.language)
    return {"reply": reply, "audio_id": start_audio(reply, x.language) if x.speak else None}


def line(obj) -> str:
    return json.dumps(obj, ensure_ascii=False) + "\n"


SENTENCE_END = re.compile(r"[.!?](?=\s|$)")


@app.post("/api/chat/stream")
def chat_stream(x: Chat, request: Request):
    """Answer word by word. One JSON object per line:
    {"t": "text piece"}  {"audio": "<id>"} (voice parts, play them in order)  {"done": true}"""
    check_rate(request)

    # 1) Predefined answer: instant text, voice usually already on disk.
    if x.language == "ro" and (known := knowledge.find_answer(x.message, x.project)):
        print(f"[rapid] raspuns predefinit pentru: {x.message[:60]}")

        def faq_lines():
            yield line({"t": known, "faq": True})
            if x.speak:
                yield line({"audio": start_audio(known, x.language), "text": known})
            yield line({"done": True})

        return StreamingResponse(faq_lines(), media_type="application/x-ndjson", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})

    # 2) Ask Gemini (retry / fallback model before we start answering).
    contents, config = build_request(x)
    stream = first = used_model = None
    last_error: Exception | None = None
    t0 = time.time()
    for model, wait in ATTEMPTS:
        if not model:
            continue
        if wait:
            time.sleep(wait)
        try:
            it = iter(gemini().models.generate_content_stream(model=model, contents=contents, config=config))
            first = next(it, None)  # errors (busy model...) show up here, before we start answering
            stream, used_model, last_error = it, model, None
            print(f"[timp] primele cuvinte de la {model}: {time.time() - t0:.1f} s")
            break
        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            print(f"Gemini chat error ({model}):", repr(e))
            if not any(code in str(e) for code in TEMPORARY):
                break
    if stream is None:
        fail(last_error or Exception("no model available"))

    def piece(chunk) -> str:
        try:
            return chunk.text or ""
        except Exception:
            return ""

    def lines():
        parts = []
        spoken = 0  # how many characters already sent to the voice
        try:
            def all_chunks():
                if first is not None:
                    yield first
                yield from stream
            for chunk in all_chunks():
                text = piece(chunk)
                if not text:
                    continue
                parts.append(text)
                yield line({"t": text})
                # Voice starts with the FIRST sentence while the rest is still coming.
                if x.speak and spoken == 0:
                    so_far = "".join(parts)
                    m = SENTENCE_END.search(so_far)
                    if m and m.end() >= 20:
                        first_sentence = so_far[: m.end()].strip()
                        spoken = m.end()
                        yield line({"audio": start_audio(first_sentence, x.language), "text": first_sentence})
        except Exception as e:  # stream broke in the middle: keep what we already have
            print("Gemini stream error:", repr(e))
        reply = "".join(parts).strip()
        if not reply:
            reply = empty_reply(x.language)
            yield line({"t": reply})
        print(f"[timp] raspuns complet de la {used_model}: {time.time() - t0:.1f} s")
        if x.speak:
            rest = "".join(parts)[spoken:].strip() if spoken else reply
            if rest:
                yield line({"audio": start_audio(rest, x.language), "text": rest})
        yield line({"done": True})

    return StreamingResponse(lines(), media_type="application/x-ndjson", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})


# ---------------------------------------------------------------- speech to text
# The app records the child's question (WAV 16 kHz mono) and Gemini writes it down.
# The audio is only kept in memory for this request; nothing is saved.
MAX_UPLOAD_BYTES = 3 * 1024 * 1024
TRANSCRIBE_VOCAB = (
    "ELIO, robot, LEGO SPIKE, SPIKE Prime, Essential, blocuri, bucle, repetă, dacă, altfel, variabilă, "
    "senzor de distanță, senzor de culoare, motor, giroscop, Bluetooth, Wi-Fi, Tales & Tech Hub"
)


def transcribe_prompt(lang: str) -> str:
    language = "engleză" if lang == "en" else "română"
    return (
        f"Transcrie exact ce spune vorbitorul (de obicei un copil) în limba {language}. "
        "Răspunde DOAR cu textul transcris, fără ghilimele sau explicații. "
        "Dacă nu se aude vorbire, răspunde cu un text gol. "
        f"Vocabular posibil: {TRANSCRIBE_VOCAB}."
    )


def transcribe_wav(audio: bytes, lang: str):
    from google.genai import types

    contents = [types.Part.from_bytes(data=audio, mime_type="audio/wav"), types.Part(text=transcribe_prompt(lang))]
    # Gemini 3 can't switch thinking off completely (thinking_budget=0 -> 400); "minimal" is the lowest.
    no_thinking = types.ThinkingConfig(thinking_level="minimal")
    last_error = None
    for model, wait in ATTEMPTS:
        if not model:
            continue
        if wait:
            time.sleep(wait)
        for thinking in (no_thinking, None):  # some models can't turn thinking off: then use their default
            try:
                t0 = time.time()
                config = types.GenerateContentConfig(temperature=0, max_output_tokens=512, thinking_config=thinking)
                result = gemini().models.generate_content(model=model, contents=contents, config=config)
                text = (result.text or "").strip().strip('"„”“«»').strip()
                print(f"[timp] transcriere de la {model}: {time.time() - t0:.1f} s")
                return {"text": text}
            except HTTPException:
                raise
            except Exception as e:
                last_error = e
                print(f"Gemini transcribe error ({model}):", repr(e))
                if thinking is not None and ("thinking" in str(e).lower() or "INVALID_ARGUMENT" in str(e)):
                    continue
                break
        if last_error is not None and not any(code in str(last_error) for code in TEMPORARY):
            break
    return JSONResponse({"error": "busy"}, status_code=503)


@app.post("/api/transcribe")
async def transcribe(request: Request, lang: Literal["ro", "en"] = "ro"):
    """Raw WAV in the request body -> {"text": "..."}."""
    check_rate(request)
    size = request.headers.get("content-length", "")
    if size.isdigit() and int(size) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Recording too long.")
    audio = await request.body()
    if not audio:
        raise HTTPException(400, "Empty recording.")
    if len(audio) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Recording too long.")
    if audio[:4] != b"RIFF" or audio[8:12] != b"WAVE":
        raise HTTPException(415, "Send a WAV file.")
    return await run_in_threadpool(transcribe_wav, audio, lang)


@app.get("/api/faq")
def faq(topic: str = "general"):
    """Popular questions shown as buttons in the app."""
    return {"questions": knowledge.suggestions(topic)}


@app.get("/api/audio/{audio_id}.wav")
def audio(audio_id: str):
    item = _audio.get(audio_id)
    if not item:
        raise HTTPException(404, "Audio expired or not found.")
    item[2].wait(timeout=30)  # still being generated: wait for it
    if not item[1]:
        raise HTTPException(503, "Voice not available.")
    return Response(item[1], media_type="audio/wav", headers={"Cache-Control": "no-store"})


@app.get("/api/learn/quiz")
def quiz():
    return {"question": "Which sensor measures ELIO's distance to obstacles?", "options": ["HC-SR04", "L298N", "GC9A01", "MAX98357A"], "answer": "HC-SR04"}
