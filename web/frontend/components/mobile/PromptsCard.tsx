"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useLang } from "@/lib/language";
import { getPrompts, savePrompts, PROMPT_MAX, type TopicId } from "@/lib/prompts";

const TOPICS: { id: TopicId; ro: string; en: string; exRo: string; exEn: string }[] = [
  { id: "general", ro: "Discuție liberă", en: "Free discussion",
    exRo: "Ex.: Răspunde într-o singură propoziție scurtă. Folosește exemple din natură și din viața de zi cu zi. La final pune o întrebare scurtă copilului.",
    exEn: "E.g.: Answer in one short sentence. Use examples from nature and everyday life. End with a short question for the child." },
  { id: "blocks", ro: "Cod și blocuri", en: "Code and blocks",
    exRo: "Ex.: Copiii au 8–10 ani și învață cu blocurile ELIO. Explică folosind numele blocurilor din aplicație (mergi înainte, repetă, dacă…atunci). Nu da codul complet, dă un indiciu.",
    exEn: "E.g.: Children are 8–10 and learn with ELIO blocks. Explain using the block names in the app (move forward, repeat, if…then). Don't give the full code, give a hint." },
  { id: "robotics", ro: "ELIO", en: "ELIO",
    exRo: "Ex.: Robotul are ESP32, driver L298N, senzor HC-SR04, ecran GC9A01 și difuzor MAX98357A. Explică pe înțelesul unui copil de 10 ani, cu analogii simple.",
    exEn: "E.g.: The robot has an ESP32, L298N driver, HC-SR04 sensor, GC9A01 screen and MAX98357A speaker. Explain for a 10-year-old with simple analogies." },
];

// Teacher area: one prompt per assistant topic, saved on this device.
export default function PromptsCard() {
  const { lang, tr } = useLang();
  const [topic, setTopic] = useState<TopicId>("general");
  const [prompts, setPrompts] = useState<Record<TopicId, string>>({ general: "", blocks: "", robotics: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPrompts(getPrompts()); }, []);
  const t = TOPICS.find((x) => x.id === topic)!;

  function save() {
    savePrompts(prompts);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <section className="mCard mForm">
      <strong className="mLabel"><Icon name="chat" size={18} /> {tr("Instrucțiuni pentru asistent", "Assistant instructions")}</strong>
      <p className="mNote">
        {tr(
          "Scrie cum vrei să răspundă ELIO la fiecare subiect: lungime, vârsta copiilor, stil, ce să evite. Regulile de siguranță rămân mereu active.",
          "Write how ELIO should answer for each topic: length, children's age, style, what to avoid. The safety rules always stay on."
        )}
      </p>
      <div className="mChips" role="tablist">
        {TOPICS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={topic === x.id} className={`mChip ${topic === x.id ? "active" : ""}`} onClick={() => setTopic(x.id)}>
            {lang === "ro" ? x.ro : x.en}
            {prompts[x.id].trim() ? " ✓" : ""}
          </button>
        ))}
      </div>
      <textarea
        className="mTextarea"
        rows={6}
        maxLength={PROMPT_MAX}
        value={prompts[topic]}
        placeholder={lang === "ro" ? t.exRo : t.exEn}
        onChange={(e) => setPrompts((p) => ({ ...p, [topic]: e.target.value }))}
      />
      <div className="mRow">
        <small className="mMuted">{prompts[topic].length} / {PROMPT_MAX}</small>
        <button type="button" className="mLink" onClick={() => setPrompts((p) => ({ ...p, [topic]: lang === "ro" ? t.exRo.replace(/^Ex\.: /, "") : t.exEn.replace(/^E\.g\.: /, "") }))}>
          {tr("Folosește exemplul", "Use the example")}
        </button>
      </div>
      <div className="mPair">
        <button type="button" className="mBtn primary" onClick={save}>{saved ? tr("Salvat ✓", "Saved ✓") : tr("Salvează", "Save")}</button>
        <button type="button" className="mBtn ghost" onClick={() => setPrompts((p) => ({ ...p, [topic]: "" }))}>{tr("Golește", "Clear")}</button>
      </div>
      <small className="mMuted">{tr("Instrucțiunile se salvează pe acest dispozitiv.", "Instructions are saved on this device.")}</small>
    </section>
  );
}
