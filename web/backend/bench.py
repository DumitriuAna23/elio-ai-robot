# Test rapid: cât durează fiecare model Gemini. Rulează: python bench.py
import os, time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
models = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"]

for model in models:
    for thinking in (True, False):
        cfg = {"max_output_tokens": 200}
        if thinking:
            cfg["thinking_config"] = types.ThinkingConfig(thinking_level="low" if "3.8" in model else "minimal")
        t0 = time.time()
        try:
            r = client.models.generate_content(model=model, contents="Spune salut unui copil, într-o propoziție.",
                                               config=types.GenerateContentConfig(**cfg))
            print(f"{model:24} gandire={'min' if thinking else 'implicit':8} {time.time()-t0:5.1f} s  -> {(r.text or '').strip()[:50]}")
        except Exception as e:
            print(f"{model:24} gandire={'min' if thinking else 'implicit':8} EROARE: {str(e)[:90]}")