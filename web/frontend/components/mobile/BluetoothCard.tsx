"use client";
import Icon from "./Icon";
import { useLang } from "@/lib/language";
import type { useElio } from "@/lib/useElio";

// Connect / disconnect card, with a clear message where Web Bluetooth can't work (iPhone, Firefox).
export default function BluetoothCard({ elio }: { elio: ReturnType<typeof useElio> }) {
  const { tr } = useLang();

  if (!elio.available) {
    return (
      <section className="mCard mWarn">
        <i><Icon name="bluetooth" /></i>
        <div>
          <strong>{tr("Bluetooth indisponibil aici", "Bluetooth not available here")}</strong>
          <p>
            {tr(
              "Controlul robotului merge în Chrome pe Android sau pe laptop (Chrome/Edge). Pe iPhone și în Firefox browserul nu permite Bluetooth.",
              "Robot control works in Chrome on Android or on a laptop (Chrome/Edge). iPhone and Firefox don't allow Bluetooth in the browser."
            )}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`mCard mBleCard ${elio.connected ? "on" : ""}`}>
      <div className="mRow">
        <div className="mBleInfo">
          <span className="mDot" />
          <div>
            <strong>{elio.connected ? tr("Conectat la ELIO", "Connected to ELIO") : elio.connecting ? tr("Se caută ELIO…", "Searching for ELIO…") : tr("Deconectat", "Disconnected")}</strong>
            <small>Bluetooth</small>
          </div>
        </div>
        {elio.connected ? (
          <button className="mBtn ghost small" onClick={() => void elio.disconnect()}>{tr("Deconectează", "Disconnect")}</button>
        ) : (
          <button className="mBtn primary small" onClick={() => void elio.connect()} disabled={elio.connecting}>
            {elio.connecting ? tr("Se conectează…", "Connecting…") : tr("Conectează", "Connect")}
          </button>
        )}
      </div>
      {elio.error && <p className="mError">{elio.error}</p>}
    </section>
  );
}
