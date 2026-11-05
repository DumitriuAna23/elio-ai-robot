"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/language";

const FACES: [string, string, string, string][] = [
  ["HAPPY", "😊", "Fericit", "Happy"],
  ["LOVE", "😍", "Iubire", "Love"],
  ["COOL", "😎", "Relaxat", "Cool"],
  ["CURIOUS", "🤔", "Curios", "Curious"],
  ["SAD", "😢", "Trist", "Sad"],
  ["SURPRISED", "😮", "Surprins", "Surprised"],
];
const KEY = "elio-rest-face";

// Same six expressions as desktop. The choice is saved on this device; showing it
// on the robot's screen needs a new ESP32 firmware command (not in the project yet).
export default function MobileEmotions() {
  const { lang, tr } = useLang();
  const [face, setFace] = useState("HAPPY");

  useEffect(() => {
    try { setFace(localStorage.getItem(KEY) || "HAPPY"); } catch {}
  }, []);
  const pick = (f: string) => { setFace(f); try { localStorage.setItem(KEY, f); } catch {} };
  const sel = FACES.find((f) => f[0] === face) ?? FACES[0];

  return (
    <div className="mStack">
      <section className="mCard mFacePreview">
        <div className="mFace" aria-hidden="true">{sel[1]}</div>
        <div>
          <small className="mMuted">{tr("Expresia de repaus", "Rest face")}</small>
          <h2 className="mH2">{lang === "ro" ? sel[2] : sel[3]}</h2>
        </div>
      </section>
      <div className="mFaceGrid">
        {FACES.map(([id, e, ro, en]) => (
          <button key={id} className={`mCard mFaceBtn ${face === id ? "active" : ""}`} onClick={() => pick(id)} aria-pressed={face === id}>
            <span>{e}</span>
            <strong>{lang === "ro" ? ro : en}</strong>
          </button>
        ))}
      </div>
      <p className="mNote">{tr("Alegerea se salvează pe acest dispozitiv. Ca robotul să afișeze expresia pe ecran, firmware-ul ESP32 are nevoie de o comandă nouă.", "Your choice is saved on this device. For the robot to show it on its screen, the ESP32 firmware needs a new command.")}</p>
    </div>
  );
}
