"use client";
import { useState } from "react";
import Icon from "./Icon";
import { useInstall } from "@/lib/install";
import { useLang } from "@/lib/language";

// "Install ELIO" card: native install dialog on Chrome/Edge/Android,
// step-by-step hint on iPhone (Safari has no install button for websites).
export default function InstallCard({ compact = false }: { compact?: boolean }) {
  const { canInstall, installed, ios, install } = useInstall();
  const { tr } = useLang();
  const [hidden, setHidden] = useState(false);

  if (installed || hidden) return null;
  if (!canInstall && !ios && compact) return null;

  return (
    <section className="mCard mInstall">
      <i><Icon name="download" /></i>
      <div>
        <strong>{tr("Instalează aplicația ELIO", "Install the ELIO app")}</strong>
        {canInstall ? (
          <p>{tr("Pe ecranul principal, ca o aplicație.", "On your home screen, like an app.")}</p>
        ) : ios ? (
          <p>
            {tr("În Safari apasă ", "In Safari tap ")}
            <Icon name="share" size={14} />
            {tr(" Partajare, apoi „Adaugă pe ecranul principal”.", " Share, then “Add to Home Screen”.")}
          </p>
        ) : (
          <p>{tr("Deschide meniul browserului (⋮) și alege „Instalează aplicația”.", "Open the browser menu (⋮) and choose “Install app”.")}</p>
        )}
      </div>
      {canInstall ? (
        <button className="mBtn primary small" onClick={() => void install()}>{tr("Instalează", "Install")}</button>
      ) : (
        <button className="mIconBtn" onClick={() => setHidden(true)} aria-label={tr("Ascunde", "Hide")}><Icon name="close" size={18} /></button>
      )}
    </section>
  );
}
