"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";
import { getPrompt } from "@/lib/prompts";

type Turn = { role: "user" | "assistant"; content: string };
const PROJECTS = [
  { id: "general", ro: "Discuție liberă", en: "Free discussion", exRo: "Explică-mi ce este o variabilă.", exEn: "Explain what a variable is." },
  { id: "blocks", ro: "Cod și blocuri", en: "Code and blocks", exRo: "Explică-mi un program Scratch cu repetiții.", exEn: "Explain a Scratch program with loops." },
  { id: "robotics", ro: "ELIO", en: "ELIO", exRo: "Ce senzori ai?", exEn: "What sensors do you have?" },
];
const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const canRecord = () =>
  typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function" && typeof MediaRecorder !== "undefined";

// Microphone recording (webm/mp4) -> WAV 16 kHz mono 16-bit, what /api/transcribe expects.
// Returns null for recordings that are too short to hold a word.
async function toWav16k(blob: Blob): Promise<Blob | null> {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    void ctx.close();
  }
  if (decoded.duration < 0.3) return null;
  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
  const src = offline.createBufferSource();
  src.buffer = decoded;            // stereo is mixed down to mono automatically
  src.connect(offline.destination);
  src.start();
  const samples = (await offline.startRendering()).getChannelData(0);

  const out = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (at: number, s: string) => { for (let i = 0; i < s.length; i++) out.setUint8(at + i, s.charCodeAt(i)); };
  text(0, "RIFF");
  out.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  out.setUint32(16, 16, true);       // size of the fmt part
  out.setUint16(20, 1, true);        // PCM
  out.setUint16(22, 1, true);        // mono
  out.setUint32(24, rate, true);
  out.setUint32(28, rate * 2, true); // bytes per second
  out.setUint16(32, 2, true);        // bytes per sample
  out.setUint16(34, 16, true);       // bits per sample
  text(36, "data");
  out.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([out.buffer], { type: "audio/wav" });
}

// Each topic keeps its own conversation only while this screen is open:
// leaving the Assistant tab deletes all conversations (they are kept only in memory).
type Chats = Record<string, Turn[]>;
const OLD_CHATS_KEY = "elio-chats";  // older versions saved chats here; removed on open
const TOPIC_KEY = "elio-chat-topic";

// Chat with the ELIO backend (/api/chat -> Gemini). Voice input: a recording sent to
// /api/transcribe (Gemini), with the browser's speech recognition as backup. When ELIO is connected the
// backend also makes a spoken version and the phone sends "SAY:<id>" over
// Bluetooth: the ESP32 downloads /api/audio/<id>.wav and plays it on its speaker.
// Without the robot, the phone reads the answer (if voice responses are on).
export default function MobileAssistant() {
  const { lang, tr } = useLang();
  const elio = useElio();
  const [project, setProject] = useState("general");
  const [chats, setChats] = useState<Chats>({});
  const [restored, setRestored] = useState(false);
  const history = chats[project] ?? [];
  // Changes the conversation of one topic (not always the one on screen).
  const setTopicHistory = (topic: string, fn: (h: Turn[]) => Turn[]) =>
    setChats((c) => ({ ...c, [topic]: fn(c[topic] ?? []) }));
  useEffect(() => {
    try {
      sessionStorage.removeItem(OLD_CHATS_KEY);
      const t = sessionStorage.getItem(TOPIC_KEY); if (t && PROJECTS.some((p) => p.id === t)) setProject(t);
    } catch {}
    setRestored(true);
  }, []);
  useEffect(() => { if (restored) try { sessionStorage.setItem(TOPIC_KEY, project); } catch {} }, [project, restored]);

  // The answer being loaded right now: switching topic (or leaving the screen)
  // stops it; on topic change the unfinished question + answer is removed.
  const pending = useRef<{ ctrl: AbortController; topic: string; base: number } | null>(null);
  function cancelPending() {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    p.ctrl.abort();
    setTopicHistory(p.topic, (h) => h.slice(0, p.base));
    setLoading(false);
  }
  useEffect(() => () => { pending.current?.ctrl.abort(); }, []);  // leaving: stop the answer being loaded
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const rec = useRef<any>(null);
  const end = useRef<HTMLDivElement | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    const sr = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setCanListen(sr || (!!API && canRecord()));
    alive.current = true;
    return () => {
      alive.current = false;
      holding.current = false;
      rec.current?.abort?.();
      stopRecorder();
    };
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [history, loading]);

  const current = PROJECTS.find((p) => p.id === project) ?? PROJECTS[0];
  // Popular questions (answered instantly by the server) shown as buttons.
  const [suggest, setSuggest] = useState<string[]>([]);
  useEffect(() => {
    if (!API) return;
    let alive = true;
    fetch(`${API}/api/faq?topic=${project}`)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => { if (alive) setSuggest(Array.isArray(d.questions) ? d.questions : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [project]);
  // Robot voice needs the new ESP32 firmware; it stays off until enabled in Settings.
  const [robotVoice, setRobotVoice] = useState(false);
  useEffect(() => { try { setRobotVoice(localStorage.getItem("elio-robot-voice") === "on"); } catch {} }, []);
  const robotSpeaks = elio.connected && robotVoice;

  const phoneVoice = () => { try { return localStorage.getItem("elio-voice") !== "off"; } catch { return true; } };
  const player = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { player.current?.pause(); }, []);

  // Fallback when the server has no audio: the browser's own voice (needs a
  // Romanian voice installed on the device for Romanian).
  function speakBrowser(text: string) {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ro" ? "ro-RO" : "en-US";
      u.rate = 1;  // normal speed, every word clear
      u.pitch = 1.2;
      const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith(lang));
      // No voice for this language on the device: stay quiet instead of an
      // English voice reading Romanian text with a foreign accent.
      if (!v) return;
      u.voice = v;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  // Voice parts arrive one after another (first sentence early, then the rest):
  // play them in order on this phone/laptop.
  const queue = useRef<{ id: string; text: string; onStart?: () => void }[]>([]);
  const playing = useRef(false);
  function playNext() {
    const next = queue.current.shift();
    if (!next) { playing.current = false; return; }
    playing.current = true;
    const a = new Audio(`${API}/api/audio/${next.id}.wav`);
    a.playbackRate = 1;  // normal speed: the server already sets a calm, clear pace
    player.current = a;
    let begun = false, failed = false;
    const begin = () => { if (!begun) { begun = true; next.onStart?.(); } };  // shows this part's text
    const fail = () => { if (failed) return; failed = true; begin(); speakBrowser(next.text); playNext(); };
    a.onplaying = begin;
    a.onended = playNext;
    a.onerror = fail;
    a.play().catch(fail);
  }
  function queueVoice(id: string, text: string, onStart?: () => void) {
    if (!phoneVoice()) { onStart?.(); return; }
    queue.current.push({ id, text, onStart });
    if (!playing.current) playNext();
  }

  // Stops ELIO talking right away (phone/laptop and robot speaker).
  // Shows the whole answer that is still waiting for its voice (used when stopping).
  const revealAll = useRef<(() => void) | null>(null);
  function hush() {
    const show = revealAll.current;
    revealAll.current = null;
    show?.();
    queue.current = [];
    playing.current = false;
    try { player.current?.pause(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    if (elio.connected && robotVoice) void elio.command("HUSH");
  }

  // Push-to-talk: hold the mic while speaking, release to send.
  // Two things listen at the same time: the browser's speech recognition and a
  // recording that the backend sends to Gemini. Gemini's text is used first; the
  // browser's text is the backup. The recording only lives in memory.
  const holding = useRef(false);
  const heard = useRef("");      // text from earlier recognition sessions while holding
  const live = useRef("");       // text from the current session
  const srText = useRef<Promise<string>>(Promise.resolve(""));
  const recording = useRef<Promise<Blob | null>>(Promise.resolve(null));
  const recorder = useRef<{ mr?: MediaRecorder; stream?: MediaStream; timer?: number } | null>(null);
  const sendLatest = useRef<(text: string) => void>(() => {});

  function startRecorder() {
    const box: { mr?: MediaRecorder; stream?: MediaStream; timer?: number } = {};
    recorder.current = box;
    recording.current = new Promise<Blob | null>(async (resolve) => {
      if (!API || !canRecord()) return resolve(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        box.stream = stream;
        if (!holding.current || recorder.current !== box) {   // released before the mic was ready
          stream.getTracks().forEach((t) => t.stop());
          return resolve(null);
        }
        const mr = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(chunks.length ? new Blob(chunks, { type: mr.mimeType || chunks[0].type }) : null);
        };
        mr.onerror = () => { stream.getTracks().forEach((t) => t.stop()); resolve(null); };
        box.mr = mr;
        mr.start();
        box.timer = window.setTimeout(() => micUpRef.current(), 60_000);  // at most 60 s
      } catch {
        resolve(null);
      }
    });
  }
  function stopRecorder() {
    const box = recorder.current;
    if (!box) return;
    window.clearTimeout(box.timer);
    try {
      if (box.mr && box.mr.state !== "inactive") box.mr.stop();
      else box.stream?.getTracks().forEach((t) => t.stop());
    } catch {
      box.stream?.getTracks().forEach((t) => t.stop());
    }
  }

  // Gemini's transcript of the recording ("" when it fails or hears nothing).
  async function geminiText(blob: Blob | null): Promise<string> {
    if (!blob || !API) return "";
    try {
      const wav = await toWav16k(blob);
      if (!wav) return "";
      const res = await fetch(`${API}/api/transcribe?lang=${lang === "en" ? "en" : "ro"}`, {
        method: "POST",
        headers: { "Content-Type": "audio/wav" },
        body: wav,
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return "";
      const data = await res.json();
      return typeof data.text === "string" ? data.text.trim() : "";
    } catch {
      return "";
    }
  }

  function startRec() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { srText.current = Promise.resolve(""); return; }
    let done: (t: string) => void = () => {};
    srText.current = new Promise<string>((resolve) => { done = resolve; });
    const r = new SR();
    r.lang = lang === "ro" ? "ro-RO" : "en-US";
    r.continuous = true;
    r.interimResults = true;
    live.current = "";
    r.onresult = (e: any) => {
      live.current = Array.from(e.results as ArrayLike<any>).map((x: any) => x[0]?.transcript ?? "").join(" ").trim();
    };
    r.onerror = () => {};
    r.onend = () => {
      heard.current = `${heard.current} ${live.current}`.trim();
      live.current = "";
      if (holding.current) {            // browser stopped on a pause: keep listening
        try { r.start(); return; } catch {}
      }
      const text = heard.current;
      heard.current = "";
      done(text);
    };
    rec.current = r;
    try { r.start(); } catch { done(""); }
  }
  function micDown(e: React.PointerEvent) {
    e.preventDefault();
    if (loading || transcribing || holding.current) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    hush();
    holding.current = true;
    heard.current = "";
    setListening(true);
    startRec();
    startRecorder();
  }
  async function micUp() {
    if (!holding.current) return;
    holding.current = false;
    const r = rec.current;
    try { r?.stop(); } catch {}
    stopRecorder();
    setListening(false);
    setTranscribing(true);
    // The browser's text: wait for it to finish, but not forever.
    const browser = Promise.race([
      srText.current,
      new Promise<string>((ok) => setTimeout(() => ok(`${heard.current} ${live.current}`.trim()), 3000)),
    ]);
    const [blob, backup] = await Promise.all([recording.current, browser]);
    const text = (await geminiText(blob)) || backup;
    if (!alive.current) return;
    setTranscribing(false);
    if (text) sendLatest.current(text);
  }
  const micUpRef = useRef(micUp);
  micUpRef.current = micUp;

  sendLatest.current = (text: string) => { void sendMessage(text); };
  async function sendMessage(spoken?: string) {
    const q = (spoken ?? draft).trim();
    if (!q || loading) return;
    const prior = history;
    const topic = project;
    const ctrl = new AbortController();
    const me = { ctrl, topic, base: prior.length };
    pending.current = me;
    const setHistory = (fn: (h: Turn[]) => Turn[]) => { if (!ctrl.signal.aborted) setTopicHistory(topic, fn); };
    hush();
    if (spoken === undefined) setDraft("");
    setHistory((h) => [...h, { role: "user", content: q }]);
    setLoading(true);
    let keepLoading = false;  // true = text waits for the voice, the dots stay until it starts
    try {
      if (!API) throw new Error("no-api");
      const res = await fetch(`${API}/api/chat/stream`, {
        signal: ctrl.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, project, language: lang, history: prior.slice(-8), speak: robotSpeaks || phoneVoice(), instructions: getPrompt(project) }),
      });
      if (res.status === 429) throw new Error("busy");
      if (!res.ok || !res.body) {
        let detail = "";
        try { detail = (await res.json())?.detail ?? ""; } catch {}
        if (detail === "busy") throw new Error("ai-busy");
        throw new Error(`server:${res.status}:${detail}`);
      }

      // Words arrive one piece at a time. With voice on, each part of the text
      // appears when its voice starts; with voice off, as soon as it arrives.
      const voiceFirst = robotSpeaks || phoneVoice();
      let reply = "";
      let gotAudio = false;
      let started = false;   // some text arrived from the server
      let bubble = false;    // the answer bubble is on screen
      let covered = 0;       // how much of the reply is already shown (voice mode)
      const display = (text: string) => {
        if (ctrl.signal.aborted || !text) return;
        const isFirst = !bubble;
        bubble = true;
        setHistory((h) => {
          const copy = [...h];
          if (isFirst) copy.push({ role: "assistant", content: text });
          else copy[copy.length - 1] = { role: "assistant", content: text };
          return copy;
        });
        setLoading(false);
      };
      const reveal = (part: string) => {
        const t = part.trim();
        const i = t ? reply.indexOf(t, covered) : -1;
        covered = i >= 0 ? i + t.length : Math.min(reply.length, covered + t.length + 1);
        display(reply.slice(0, covered).trim());
      };
      const showAll = () => display(reply.trim());
      revealAll.current = showAll;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (ctrl.signal.aborted) return;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let msg: any;
          try { msg = JSON.parse(line); } catch { continue; }
          if (typeof msg.t === "string") {
            reply += msg.t;
            started = true;
            if (!voiceFirst) display(reply);
          }
          if (typeof msg.audio === "string" && !ctrl.signal.aborted) {
            gotAudio = true;
            const text = typeof msg.text === "string" ? msg.text : "";
            const onStart = () => reveal(text);
            if (robotSpeaks) { if (await elio.command(`SAY:${msg.audio}`)) onStart(); else queueVoice(msg.audio, text, onStart); }
            else queueVoice(msg.audio, text, onStart);
          }
        }
      }
      if (!started) throw new Error("server:500:empty");
      if (!gotAudio) {
        // no voice from the server: show everything, browser voice as a fallback
        showAll();
        revealAll.current = null;
        if (phoneVoice()) speakBrowser(reply);
      } else if (!bubble) {
        keepLoading = true;
        // safety: if the voice still hasn't started after 25 s, show the text anyway
        setTimeout(() => { if (!bubble && revealAll.current === showAll) showAll(); }, 25000);
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;  // stopped on purpose (topic changed)
      const noApi = e instanceof Error && e.message === "no-api";
      const busy = e instanceof Error && e.message === "busy";
      const aiBusy = e instanceof Error && e.message === "ai-busy";
      const server = e instanceof Error && e.message.startsWith("server:") ? e.message.split(":") : null;
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: aiBusy
            ? tr("ELIO are acum prea mulți prieteni care îl întreabă ceva. Mai încearcă peste un minut!", "Lots of friends are asking ELIO things right now. Try again in a minute!")
            : busy
            ? tr("Ai pus multe întrebări una după alta. Așteaptă un minut și încearcă din nou.", "That's a lot of questions in a row. Wait a minute and try again.")
            : noApi
            ? tr("Asistentul nu este conectat încă la server. Setați NEXT_PUBLIC_API_BASE_URL după ce publicați backend-ul.", "The assistant isn't connected to a server yet. Set NEXT_PUBLIC_API_BASE_URL after deploying the backend.")
            : server
            ? tr(`Serverul a răspuns cu eroare ${server[1]} (${server.slice(2).join(":") || "fără detalii"}). Uită-te în terminalul backend-ului.`, `The server returned error ${server[1]} (${server.slice(2).join(":") || "no details"}). Check the backend terminal.`)
            : tr(`Nu pot ajunge la server (${API}). Verifică dacă backend-ul e pornit.`, `Can't reach the server (${API}). Check that the backend is running.`),
        },
      ]);
    } finally {
      if (pending.current === me) { pending.current = null; if (!keepLoading) setLoading(false); }
    }
  }

  return (
    <div className="mChat">
      <div className="mChips scroll">
        {PROJECTS.map((p) => (
          <button key={p.id} className={`mChip ${project === p.id ? "active" : ""}`} onClick={() => { if (p.id === project) return; cancelPending(); hush(); setProject(p.id); }}>
            {lang === "ro" ? p.ro : p.en}
          </button>
        ))}
      </div>

      <div className="mMessages">
        {history.length === 0 && (
          <div className="mCard mWelcome">
            <img src="/elio-robot-transparent.png" alt="" />
            <p>{tr("ELIO îți explică pas cu pas. Alege un subiect și întreabă-l ce vrei să înțelegi.", "ELIO explains step by step. Pick a topic and ask what you want to understand.")}</p>
            {lang === "ro" && suggest.length > 0 ? (
              <div className="mSuggest">
                {suggest.map((q) => (
                  <button key={q} className="mSuggestBtn" onClick={() => void sendMessage(q)}>{q}</button>
                ))}
              </div>
            ) : (
              <button className="mLink" onClick={() => setDraft(lang === "ro" ? current.exRo : current.exEn)}>
                „{lang === "ro" ? current.exRo : current.exEn}”
              </button>
            )}
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`mBubble ${m.role}`}>{m.content}</div>
        ))}
        {loading && <div className="mBubble assistant typing"><span /><span /><span /></div>}
        {(listening || transcribing) && (
          <div className="mBubble user mListening">
            <span className="mWave"><i /><i /><i /><i /></span>
            {listening
              ? tr("Te ascult… ridică degetul ca să trimiți", "Listening… release to send")
              : tr("Te ascult...", "Listening...")}
          </div>
        )}
        <div ref={end} />
      </div>

      <p className="mSpeaker">
        <Icon name={robotSpeaks ? "robot" : "chat"} size={14} />
        {canListen ? tr("Ține apăsat microfonul și vorbește · ", "Hold the mic and speak · ") : ""}
        {robotSpeaks ? tr("se aude în ELIO", "plays on ELIO") : tr("se aude din telefon", "plays on the phone")}
      </p>

      <form className="mComposer" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
        {canListen && (
          <button
            type="button"
            className={`mIconBtn mMic ${listening || transcribing ? "rec" : ""}`}
            onPointerDown={micDown}
            onPointerUp={() => void micUp()}
            onPointerCancel={() => void micUp()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={loading || transcribing}
            aria-label={transcribing ? tr("Te ascult...", "Listening...") : tr("Ține apăsat și vorbește", "Hold and speak")}
          >
            <Icon name="mic" />
          </button>
        )}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={tr("Întreabă-l pe ELIO...", "Ask ELIO...")} enterKeyHint="send" />
        <button type="submit" className="mIconBtn send" disabled={!draft.trim() || loading} aria-label={tr("Trimite", "Send")}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
