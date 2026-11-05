"use client";
import { useEffect, useState } from "react";

// Chrome/Edge fire "beforeinstallprompt" once, early. We keep it so an
// "Install app" button can show the native install dialog later.
let deferred: any = null;
const EVENT = "elio-install-change";

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    window.dispatchEvent(new Event(EVENT));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    window.dispatchEvent(new Event(EVENT));
  });
}

function standalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function useInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1));
    const sync = () => {
      setCanInstall(!!deferred);
      setInstalled(standalone());
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const install = async () => {
    if (!deferred) return false;
    deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    deferred = null;
    window.dispatchEvent(new Event(EVENT));
    return choice?.outcome === "accepted";
  };

  return { canInstall, installed, ios, install };
}
