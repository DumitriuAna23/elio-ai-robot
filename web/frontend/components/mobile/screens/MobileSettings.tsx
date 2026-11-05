"use client";
import { useEffect, useState } from "react";
import InstallCard from "../InstallCard";
import BluetoothCard from "../BluetoothCard";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";
import WifiCard from "../WifiCard";

export default function MobileSettings() {
  const { lang, setLang, tr } = useLang();
  const elio = useElio();
  const [voice, setVoice] = useState(true);
  const [robotVoice, setRobotVoice] = useState(false);

  useEffect(() => { try { setVoice(localStorage.getItem("elio-voice") !== "off"); } catch {} }, []);
  const toggleVoice = () => { const v = !voice; setVoice(v); try { localStorage.setItem("elio-voice", v ? "on" : "off"); } catch {} };
  useEffect(() => { try { setRobotVoice(localStorage.getItem("elio-robot-voice") === "on"); } catch {} }, []);
  const toggleRobotVoice = () => { const v = !robotVoice; setRobotVoice(v); try { localStorage.setItem("elio-robot-voice", v ? "on" : "off"); } catch {} };

  return (
    <div className="mStack">
      <h1 className="mH1">{tr("Setări", "Settings")}</h1>

      <section className="mCard">
        <strong className="mLabel">{tr("Limbă", "Language")}</strong>
        <div className="mSegment">
          <button className={lang === "ro" ? "active" : ""} onClick={() => setLang("ro")}>🇷🇴 Română</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>🇬🇧 English</button>
        </div>
      </section>

      <section className="mCard">
        <div className="mRow">
          <div>
            <strong className="mLabel">{tr("Răspunsuri vocale", "Voice responses")}</strong>
            <small className="mMuted">{tr("Telefonul citește răspunsurile asistentului cu voce tare", "The phone reads the assistant's answers out loud")}</small>
          </div>
          <button role="switch" aria-checked={voice} className={`mSwitch ${voice ? "on" : ""}`} onClick={toggleVoice} aria-label={tr("Răspunsuri vocale", "Voice responses")}><span /></button>
        </div>
      </section>

      <section className="mCard">
        <div className="mRow">
          <div>
            <strong className="mLabel">{tr("Robotul vorbește", "Robot speaks")}</strong>
            <small className="mMuted">{tr("Răspunsurile asistentului se aud în difuzorul lui ELIO. Necesită firmware-ul ELIO nou și Wi-Fi pe robot.", "Assistant answers play on ELIO's speaker. Needs the new ELIO firmware and Wi-Fi on the robot.")}</small>
          </div>
          <button role="switch" aria-checked={robotVoice} className={`mSwitch ${robotVoice ? "on" : ""}`} onClick={toggleRobotVoice} aria-label={tr("Robotul vorbește", "Robot speaks")}><span /></button>
        </div>
      </section>

      <BluetoothCard elio={elio} />

      <WifiCard elio={elio} />

      <InstallCard />
    </div>
  );
}