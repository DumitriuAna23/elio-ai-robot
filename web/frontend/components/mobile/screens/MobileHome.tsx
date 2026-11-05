"use client";
import Link from "next/link";
import Icon from "../Icon";
import InstallCard from "../InstallCard";
import { PAGES, type PageKey } from "../pages";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";

const TILES: PageKey[] = ["robot", "code", "assistant", "learn", "emotions", "projects", "settings"];

export default function MobileHome() {
  const { lang, tr } = useLang();
  const { connected, distance } = useElio();

  return (
    <div className="mStack">
      <section className="mHero">
        <div>
          <span className="mEyebrow">TALES & TECH HUB</span>
          <h1>{tr("Salut, sunt ELIO!", "Hi, I'm ELIO!")}</h1>
          <p>{tr("Robotul tău pentru învățare.", "Your learning robot.")}</p>
        </div>
        <img src="/elio-robot-transparent.png" alt="ELIO" />
      </section>

      <Link href="/robot" className={`mCard mStatus ${connected ? "on" : ""}`}>
        <i><Icon name="bluetooth" /></i>
        <div>
          <strong>{connected ? tr("ELIO este conectat", "ELIO is connected") : tr("ELIO nu este conectat", "ELIO is not connected")}</strong>
          <small>
            {connected
              ? `${tr("Distanță", "Distance")}: ${distance === null ? "—" : distance.toFixed(1) + " cm"}`
              : tr("Atinge pentru a-l conecta", "Tap to connect")}
          </small>
        </div>
        <Icon name="chevron" size={18} />
      </Link>

      <InstallCard compact />

      <div className="mTiles">
        {TILES.map((k) => (
          <Link key={k} href={PAGES[k].href} className={`mTile ${k === "robot" ? "wide" : ""}`}>
            <i><Icon name={PAGES[k].icon} size={26} /></i>
            <strong>{lang === "ro" ? PAGES[k].ro : PAGES[k].en}</strong>
            <small>{lang === "ro" ? PAGES[k].descRo : PAGES[k].descEn}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
