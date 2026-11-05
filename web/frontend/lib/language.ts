"use client";
import { useCallback, useEffect, useState } from "react";

// Same storage key the desktop pages and the language screen already use.
export type Lang = "ro" | "en";
const KEY = "elio-language";
const EVENT = "elio-language-change";

function read(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "ro" || v === "en") return v;
  } catch {}
  return "ro";
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("ro");

  useEffect(() => {
    setLangState(read());
    const sync = () => setLangState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setLang = useCallback((value: Lang) => {
    try { localStorage.setItem(KEY, value); } catch {}
    setLangState(value);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // tr("text în română", "English text")
  const tr = useCallback((ro: string, en: string) => (lang === "ro" ? ro : en), [lang]);

  return { lang, setLang, tr };
}
