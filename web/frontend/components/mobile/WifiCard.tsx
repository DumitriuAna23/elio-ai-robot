"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useLang } from "@/lib/language";
import type { useElio } from "@/lib/useElio";
import { forgetWifi, onWifi, requestWifiList, sendWifiConfig, type WifiInfo } from "@/services/robotBluetooth";

// Networks remembered on THIS phone/laptop, so they can be re-sent to ELIO later.
// Note: stored in this browser's storage in plain form; only use it on your own device.
type SavedNet = { ssid: string; password: string };
const STORE = "elio-wifi-networks";
function loadSaved(): SavedNet[] {
  try { const v = JSON.parse(localStorage.getItem(STORE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function storeSaved(list: SavedNet[]) {
  try { localStorage.setItem(STORE, JSON.stringify(list.slice(0, 10))); } catch {}
}

// ELIO's Wi-Fi networks: see which one it's on, add a new place, forget old ones.
// The robot remembers up to 5 and joins the available one by itself.
export default function WifiCard({ elio }: { elio: ReturnType<typeof useElio> }) {
  const { tr } = useLang();
  const [wifi, setWifi] = useState<WifiInfo>({ known: false, current: null, saved: [] });
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [remember, setRemember] = useState(true);
  const [local, setLocal] = useState<SavedNet[]>([]);

  useEffect(() => onWifi(setWifi), []);
  useEffect(() => { setLocal(loadSaved()); }, []);

  function rememberNet(n: SavedNet) {
    const list = [n, ...loadSaved().filter((x) => x.ssid !== n.ssid)];
    storeSaved(list);
    setLocal(list);
  }
  function dropLocal(name: string) {
    if (!window.confirm(tr(`Ștergi „${name}” din aplicație?`, `Remove “${name}” from the app?`))) return;
    const list = loadSaved().filter((x) => x.ssid !== name);
    storeSaved(list);
    setLocal(list);
  }
  async function resend(n: SavedNet) {
    setMsg(null);
    setBusy(true);
    try {
      await sendWifiConfig(n.ssid, n.password);
      setMsg({ ok: true, text: tr(`„${n.ssid}” a fost trimisă la ELIO. Se conectează…`, `“${n.ssid}” was sent to ELIO. Connecting…`) });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!elio.connected) return;
    const t = setTimeout(() => void requestWifiList().catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [elio.connected]);

  const fail = (err: unknown) => setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await sendWifiConfig(ssid, password);
      if (remember) rememberNet({ ssid: ssid.trim(), password });
      setMsg({ ok: true, text: tr(`„${ssid.trim()}” a fost salvată. ELIO se conectează…`, `“${ssid.trim()}” was saved. ELIO is connecting…`) });
      setSsid("");
      setPassword("");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function forget(name: string) {
    if (!window.confirm(tr(`Ștergi rețeaua „${name}” din ELIO?`, `Remove “${name}” from ELIO?`))) return;
    setMsg(null);
    try { await forgetWifi(name); } catch (err) { fail(err); }
  }

  return (
    <section className="mCard mForm">
      <strong className="mLabel"><Icon name="wifi" size={18} /> {tr("Wi-Fi pentru ELIO", "ELIO Wi-Fi")}</strong>

      {!elio.connected ? (
        <p className="mNote">{tr("Conectează robotul prin Bluetooth ca să vezi și să schimbi rețelele lui.", "Connect ELIO over Bluetooth to see and change its networks.")}</p>
      ) : !wifi.known ? (
        <p className="mNote">{tr("Se citește starea Wi-Fi… Dacă nu apare nimic, robotul are firmware-ul vechi.", "Reading Wi-Fi status… If nothing shows up, the robot has the old firmware.")}</p>
      ) : (
        <>
          <div className={`mWifiNow ${wifi.current ? "on" : ""}`}>
            <span className="mDot" />
            <div>
              <strong>{wifi.current ? tr(`Conectat la „${wifi.current}”`, `Connected to “${wifi.current}”`) : tr("Nu e conectat la Wi-Fi", "Not connected to Wi-Fi")}</strong>
              <small>{wifi.current ? tr("Asistentul poate vorbi prin robot", "The assistant can speak through the robot") : tr("Caută singur rețelele salvate", "Looking for saved networks by itself")}</small>
            </div>
          </div>
          {wifi.saved.length > 0 && (
            <ul className="mNets">
              {wifi.saved.map((n) => (
                <li key={n}>
                  <span>{n}</span>
                  {n === wifi.current && <em>{tr("acum", "now")}</em>}
                  <button type="button" className="mIconBtn" onClick={() => void forget(n)} aria-label={tr(`Șterge ${n}`, `Remove ${n}`)}>
                    <Icon name="trash" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <form className="mForm" onSubmit={add}>
        <p className="mNote">{tr("Adaugă rețeaua fiecărui loc unde folosești robotul (acasă, școală, sediu). ELIO ține minte până la 5 și se conectează singur la cea disponibilă. Doar Wi-Fi de 2,4 GHz.", "Add the network of each place you use the robot (home, school, office). ELIO remembers up to 5 and joins the available one by itself. 2.4 GHz Wi-Fi only.")}</p>
        <label>
          {tr("Numele rețelei (SSID)", "Network name (SSID)")}
          <input value={ssid} onChange={(e) => setSsid(e.target.value)} maxLength={32} autoCapitalize="none" autoCorrect="off" placeholder={tr("Ex. TalesTech", "E.g. TalesTech")} />
        </label>
        <label>
          {tr("Parolă", "Password")}
          <span className="mPass">
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={63} autoCapitalize="none" autoComplete="off" placeholder="••••••••" />
            <button type="button" className="mLink" onClick={() => setShow((v) => !v)}>{show ? tr("Ascunde", "Hide") : tr("Arată", "Show")}</button>
          </span>
        </label>
        <label className="mCheck">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {tr("Ține minte rețeaua și în aplicație", "Also remember this network in the app")}
        </label>
        <div className="mPair">
          <button className="mBtn primary" type="submit" disabled={!elio.connected || busy || !ssid.trim()}>
            {busy ? tr("Se trimite…", "Sending…") : tr("Trimite la ELIO", "Send to ELIO")}
          </button>
          <button className="mBtn ghost" type="button" disabled={!ssid.trim()} onClick={() => { rememberNet({ ssid: ssid.trim(), password }); setMsg({ ok: true, text: tr("Salvată în aplicație.", "Saved in the app.") }); setSsid(""); setPassword(""); }}>
            {tr("Doar salvează", "Save only")}
          </button>
        </div>
        {msg && <p className={msg.ok ? "mNote strong" : "mError"}>{msg.text}</p>}
      </form>

      {local.length > 0 && (
        <div className="mForm">
          <strong className="mLabel">{tr("Rețele salvate în aplicație", "Networks saved in the app")}</strong>
          <ul className="mNets">
            {local.map((n) => (
              <li key={n.ssid}>
                <span>{n.ssid}</span>
                <button type="button" className="mBtn primary small" disabled={!elio.connected || busy} onClick={() => void resend(n)}>
                  {tr("Trimite la ELIO", "Send to ELIO")}
                </button>
                <button type="button" className="mIconBtn" onClick={() => dropLocal(n.ssid)} aria-label={tr(`Șterge ${n.ssid}`, `Remove ${n.ssid}`)}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <small className="mMuted">{tr("Parolele sunt păstrate doar pe acest dispozitiv, în browser. Folosește opțiunea doar pe telefonul sau laptopul tău.", "Passwords are kept only on this device, in the browser. Only use this on your own phone or laptop.")}</small>
        </div>
      )}
    </section>
  );
}