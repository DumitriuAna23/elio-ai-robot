"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ElioJoystick, { type ElioDirection } from "@/components/robot/ElioJoystick";
import Icon from "../Icon";
import BluetoothCard from "../BluetoothCard";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";

const STATES: Record<string, [string, string]> = {
  DISCONNECTED: ["Deconectat", "Disconnected"],
  CONNECTED: ["Conectat", "Connected"],
  IDLE: ["Pregătit", "Ready"],
  MOVING: ["În mișcare", "Moving"],
  LISTENING: ["Ascult", "Listening"],
  THINKING: ["Mă gândesc", "Thinking"],
  TALKING: ["Vorbesc", "Talking"],
  OBSTACLE: ["Obstacol detectat", "Obstacle detected"],
};

// Joystick + speed + sensors + emergency stop (Expo "Control" and "Monitor" in one page).
export default function MobileRobot() {
  const { lang, tr } = useLang();
  const elio = useElio();
  const { connected, command } = elio;
  const [speed, setSpeed] = useState(60);
  const beat = useRef<number | null>(null);

  const stopBeat = useCallback(() => {
    if (beat.current !== null) window.clearInterval(beat.current);
    beat.current = null;
  }, []);

  // Same as desktop: the direction is re-sent every 120 ms while the joystick is
  // held, so the ESP32 stops on its own if the phone goes quiet.
  const onDirection = useCallback(
    (d: ElioDirection) => {
      stopBeat();
      if (d === "STOP") { void command("STOP"); return; }
      void command(d);
      beat.current = window.setInterval(() => void command(d), 120);
    },
    [command, stopBeat]
  );

  useEffect(() => { if (!connected) stopBeat(); }, [connected, stopBeat]);
  useEffect(() => { if (connected) void command(`SPEED:${speed}`); }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stopBeat(); void command("STOP"); }, [stopBeat, command]);

  const changeSpeed = (v: number) => { setSpeed(v); void command(`SPEED:${v}`); };
  const st = STATES[elio.state.trim().toUpperCase()];
  const stateLabel = st ? (lang === "ro" ? st[0] : st[1]) : elio.state;

  return (
    <div className="mStack">
      <BluetoothCard elio={elio} />

      <section className={`mCard mJoy ${connected ? "" : "disabled"}`}>
        <ElioJoystick language={lang} onDirectionChange={onDirection} />
        {!connected && <p className="mNote center">{tr("Conectează ELIO ca să-l poți conduce.", "Connect ELIO to drive it.")}</p>}
      </section>

      <section className="mCard">
        <div className="mRow">
          <strong className="mLabel"><Icon name="gauge" size={18} /> {tr("Viteză", "Speed")}</strong>
          <b className="mValue">{speed}%</b>
        </div>
        <input
          className="mRange"
          type="range"
          min={10}
          max={100}
          step={5}
          value={speed}
          onChange={(e) => changeSpeed(Number(e.target.value))}
          style={{ ["--p" as string]: `${((speed - 10) / 90) * 100}%` }}
          aria-label={tr("Viteză", "Speed")}
        />
        <div className="mRow mMuted"><small>{tr("Lent", "Gentle")}</small><small>{tr("Rapid", "Fast")}</small></div>
      </section>

      <div className="mPair">
        <section className="mCard mMetric">
          <small>{tr("Distanță obstacol", "Obstacle distance")}</small>
          <b>{elio.distance === null ? "—" : elio.distance.toFixed(1)}<em>{elio.distance === null ? "" : " cm"}</em></b>
        </section>
        <section className="mCard mMetric">
          <small>{tr("Stare robot", "Robot state")}</small>
          <b className="text">{stateLabel}</b>
        </section>
      </div>

      <button className="mBtn danger big" onClick={() => { stopBeat(); void command("STOP"); }} disabled={!connected}>
        <Icon name="stop" /> {tr("OPREȘTE MOTOARELE", "STOP MOTORS")}
      </button>
      <p className="mNote">{tr("Când ieși din pagină sau închizi aplicația, ELIO se oprește automat. Bluetooth rămâne conectat.", "When you leave this page or close the app, ELIO stops automatically. Bluetooth stays connected.")}</p>
    </div>
  );
}
