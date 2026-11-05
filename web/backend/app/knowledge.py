"""Predefined answers (instant, no AI) + fact sheets for Gemini.

Files: web/backend/knowledge/<topic>.json
  {"facts": "text given to Gemini for this topic",
   "faq": [{"q": ["question variant", ...], "a": "answer read aloud"}, ...]}
Edit them freely; they are reloaded automatically when the file changes.
Questions can be written without diacritics; matching ignores them anyway.
"""
import json
import os
import re
import threading
import unicodedata

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge")
# app topic id -> knowledge file
TOPIC_FILES = {"general": "general.json", "blocks": "blocks.json", "robotics": "elio.json"}

# Words that don't carry meaning for matching ("what is", "tell me"...).
STOP = set("""
ce cum care cine cat cate unde cand de la si sau sa se ma mi imi iti ti te il o un una unei unui e este sunt esti
eu tu el ea noi voi ei ele al ale lui lor din in pe pentru cu fara mai foarte prea despre asta acesta aceasta
poti poate putea spune spunemi explica explicami zi zimi vreau as stii stiu face fac faci a ai am au fi fost
da nu ok te rog rog hai ii le li nea ne va vom fie dar ca daca atunci
bloc blocul blocurile blocuri blocului cod codul inseamna folosesc folosim lucru chestia
what is are the a an how do does can you tell me about of to in on for and or why who which
""".split())
GENERIC = {"elio", "lego", "spike", "robot", "progr"}  # too common to decide alone
NO_STEM = {"elio", "lego", "spike", "esp32", "l298n", "hc", "sr04", "wifi", "bluetooth"}


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def stems(text: str) -> set:
    out = set()
    for w in normalize(text).split():
        if w in STOP:
            continue
        # crude Romanian stemming: "senzorul", "senzori", "senzorului" -> "senzo"
        out.add(w if (w in NO_STEM or len(w) <= 4 or w.isdigit()) else w[:5])
    return out


_lock = threading.Lock()
_cache: dict = {}  # topic -> (mtime, facts, [(stems, normalized, answer, first_question)])


def _load(topic: str):
    name = TOPIC_FILES.get(topic)
    if not name:
        return "", []
    path = os.path.join(BASE, name)
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return "", []
    with _lock:
        hit = _cache.get(topic)
        if hit and hit[0] == mtime:
            return hit[1], hit[2]
        try:
            data = json.load(open(path, encoding="utf-8"))
        except Exception as e:
            print(f"[knowledge] {name} has an error and was skipped: {e}")
            return "", []
        entries = []
        for item in data.get("faq", []):
            answer = (item.get("a") or "").strip()
            shown = item.get("show") or item["q"][0]  # "show" = how the question appears as a button
            for q in item.get("q", []) + ([item["show"]] if item.get("show") else []):
                s = stems(q)
                if answer:
                    entries.append((s, normalize(q), answer, shown))
        _cache[topic] = (mtime, data.get("facts", ""), entries)
        return _cache[topic][1], entries


def facts(topic: str) -> str:
    return _load(topic)[0]


def find_answer(question: str, topic: str):
    """Best predefined answer, or None when we're not confident (then Gemini answers)."""
    q_norm = normalize(question)
    q_words = set(q_norm.split())
    q = stems(question)
    if len(q) > 9:  # long, specific questions go to the AI
        return None
    if not q:  # only small words ("cine esti tu"): accept the same words in any order
        for t in TOPIC_FILES:
            for _, norm, answer, _ in _load(t)[1]:
                if set(norm.split()) == q_words:
                    return answer
        return None
    best, best_score = None, 0.0
    for t in TOPIC_FILES:
        bonus = 0.05 if t == topic else 0.0
        for s, norm, answer, _ in _load(t)[1]:
            if norm == q_norm:
                return answer
            if not s:
                continue
            inter = len(q & s)
            if not inter:
                continue
            score = inter / len(q | s) + bonus
            # every important word of the stored question is in the child's question
            if s <= q and len(s) >= 2:
                score = max(score, 0.75 + bonus)
            # one distinctive word ("steering", "variabila") in a short question
            elif s <= q and len(q) <= 2 and len(next(iter(s))) >= 5 and not (s & GENERIC):
                score = max(score, 0.62 + bonus)
            if score > best_score:
                best, best_score = answer, score
    return best if best_score >= 0.6 else None


def suggestions(topic: str, limit: int = 6) -> list:
    """Questions shown as buttons: entries that have a "show" text, in file order."""
    name = TOPIC_FILES.get(topic)
    try:
        data = json.load(open(os.path.join(BASE, name), encoding="utf-8")) if name else {}
    except Exception:
        return []
    return [item["show"] for item in data.get("faq", []) if item.get("show")][:limit]


def all_answers():
    for t in TOPIC_FILES:
        seen = set()
        for _, _, answer, _ in _load(t)[1]:
            if answer not in seen:
                seen.add(answer)
                yield answer


def answers_to_warm(everything: bool = False):
    """Answers whose voice is prepared at startup: the button questions, or all."""
    if everything:
        yield from all_answers()
        return
    for name in TOPIC_FILES.values():
        try:
            data = json.load(open(os.path.join(BASE, name), encoding="utf-8"))
        except Exception:
            continue
        for item in data.get("faq", []):
            if item.get("show") and item.get("a"):
                yield item["a"].strip()
