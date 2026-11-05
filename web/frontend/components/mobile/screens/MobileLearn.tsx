"use client";
import { useState } from "react";
import Icon from "../Icon";
import { useLang } from "@/lib/language";

type Mode = "quiz" | "riddles" | "discover";
type Q = { q: [string, string]; options: [string, string][]; answer: number };
const QUIZ: Q[] = [
  { q: ["Ce senzor măsoară distanța lui ELIO față de obstacole?", "Which sensor measures ELIO's distance to obstacles?"], options: [["HC-SR04", "HC-SR04"], ["L298N", "L298N"], ["GC9A01", "GC9A01"], ["MAX98357A", "MAX98357A"]], answer: 0 },
  { q: ["Ce face un bloc „repetă 10”?", "What does a “repeat 10” block do?"], options: [["Rulează blocurile din el de 10 ori", "Runs the blocks inside it 10 times"], ["Așteaptă 10 secunde", "Waits 10 seconds"], ["Setează viteza la 10", "Sets speed to 10"]], answer: 0 },
  { q: ["Prin ce comunică telefonul cu ELIO?", "How does the phone talk to ELIO?"], options: [["Bluetooth", "Bluetooth"], ["Cablu USB", "USB cable"], ["Radio FM", "FM radio"]], answer: 0 },
  { q: ["Ce este o variabilă?", "What is a variable?"], options: [["Un loc unde păstrăm o valoare", "A place to keep a value"], ["Un tip de motor", "A kind of motor"], ["O culoare din program", "A colour in the program"]], answer: 0 },
  { q: ["Ce culoare au blocurile de Mișcare?", "What colour are the Motion blocks?"], options: [["Albastru", "Blue"], ["Verde", "Green"], ["Mov", "Purple"]], answer: 0 },
];
const RIDDLES: [string, string, string, string][] = [
  ["Am ochi, dar nu văd ca tine; am roți, dar nu sunt mașină. Cine sunt?", "ELIO!", "I have eyes but don't see like you; I have wheels but I'm not a car. Who am I?", "ELIO!"],
  ["Cu cât iei mai mult din mine, cu atât devin mai mare. Ce sunt?", "O groapă", "The more you take from me, the bigger I get. What am I?", "A hole"],
  ["Am chei, dar nu deschid nicio ușă. Ce sunt?", "O tastatură", "I have keys but open no doors. What am I?", "A keyboard"],
];
const FACTS: [string, string][] = [
  ["Sunetul circulă prin aer cu aproximativ 343 de metri pe secundă. Așa măsoară ELIO distanța: trimite un sunet și cronometrează ecoul.", "Sound travels through air at about 343 metres per second. That's how ELIO measures distance: it sends a sound and times the echo."],
  ["Primul robot industrial, Unimate, a început să lucreze într-o fabrică în 1961.", "The first industrial robot, Unimate, started working in a factory in 1961."],
  ["Lumina de la Soare ajunge pe Pământ în aproximativ 8 minute.", "Sunlight takes about 8 minutes to reach Earth."],
];

export default function MobileLearn() {
  const { lang, tr } = useLang();
  const i = lang === "ro" ? 0 : 1;
  const [mode, setMode] = useState<Mode | null>(null);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState(false);

  const open = (m: Mode) => { setMode(m); setN(0); setPicked(null); setScore(0); setReveal(false); };

  if (!mode) {
    const cards: [Mode, string, string, string, string, string][] = [
      ["quiz", "🏆", "Quiz", "Quiz", "Întrebări despre robot, cod și știință", "Questions about robots, code and science"],
      ["riddles", "🧩", "Ghicitori", "Riddles", "Antrenează curiozitatea și logica", "Train curiosity and logic"],
      ["discover", "🚀", "Descoperă", "Discover", "Știință și tehnologie pe înțeles", "Science and technology made simple"],
    ];
    return (
      <div className="mStack">
        <h1 className="mH1">{tr("Învață cu ELIO", "Learn with ELIO")}</h1>
        <p className="mNote">{tr("Alege o activitate.", "Choose an activity.")}</p>
        {cards.map(([m, e, ro, en, dro, den]) => (
          <button key={m} className="mCard mActivity" onClick={() => open(m)}>
            <span className="mEmoji">{e}</span>
            <div><strong>{lang === "ro" ? ro : en}</strong><small>{lang === "ro" ? dro : den}</small></div>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
    );
  }

  const back = <button className="mBtn ghost small" onClick={() => setMode(null)}>← {tr("Activități", "Activities")}</button>;

  if (mode === "quiz") {
    if (n >= QUIZ.length) {
      return (
        <div className="mStack">
          {back}
          <section className="mCard center">
            <span className="mEmoji big">🏆</span>
            <h2 className="mH2">{tr("Bravo!", "Well done!")}</h2>
            <p className="mValue">{score} / {QUIZ.length}</p>
            <button className="mBtn primary" onClick={() => open("quiz")}>{tr("Încă o dată", "Play again")}</button>
          </section>
        </div>
      );
    }
    const q = QUIZ[n];
    return (
      <div className="mStack">
        {back}
        <section className="mCard">
          <small className="mMuted">{tr("Întrebarea", "Question")} {n + 1} / {QUIZ.length}</small>
          <h2 className="mH2">{q.q[i]}</h2>
          <div className="mOptions">
            {q.options.map((o, k) => (
              <button
                key={k}
                className={`mOption ${picked !== null && k === q.answer ? "right" : ""} ${picked === k && k !== q.answer ? "wrong" : ""}`}
                disabled={picked !== null}
                onClick={() => { setPicked(k); if (k === q.answer) setScore((s) => s + 1); }}
              >
                {o[i]}
              </button>
            ))}
          </div>
          {picked !== null && (
            <button className="mBtn primary" onClick={() => { setN(n + 1); setPicked(null); }}>
              {n + 1 < QUIZ.length ? tr("Următoarea", "Next") : tr("Vezi scorul", "See score")}
            </button>
          )}
        </section>
      </div>
    );
  }

  const list = mode === "riddles" ? RIDDLES : FACTS;
  const item = list[n % list.length];
  return (
    <div className="mStack">
      {back}
      <section className="mCard center">
        <span className="mEmoji big">{mode === "riddles" ? "🧩" : "🚀"}</span>
        {mode === "riddles" ? (
          <>
            <h2 className="mH2">{(item as string[])[i === 0 ? 0 : 2]}</h2>
            {reveal ? <p className="mValue">{(item as string[])[i === 0 ? 1 : 3]}</p> : <button className="mBtn ghost" onClick={() => setReveal(true)}>{tr("Arată răspunsul", "Show answer")}</button>}
          </>
        ) : (
          <p className="mFact">{(item as string[])[i]}</p>
        )}
        <button className="mBtn primary" onClick={() => { setN(n + 1); setReveal(false); }}>{tr("Următoarea", "Next")}</button>
      </section>
    </div>
  );
}
