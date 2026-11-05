"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { BOTTOM_BAR, MENU_GROUPS, PAGES, type PageKey } from "./pages";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";

// Phone version shell: top bar with logo + robot status + menu, slide-in menu
// with every page, and a bottom bar for the five most used pages.
export default function MobileLayout({ page, children }: { page: PageKey; title?: string; children: ReactNode }) {
  const { lang, tr } = useLang();
  const { connected } = useElio();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const label = (k: PageKey) => (lang === "ro" ? PAGES[k].ro : PAGES[k].en);

  return (
    <div className="mobileOnly mApp">
      <header className="mTop">
        <Link href="/home" className="mBrand" aria-label="ELIO">
          <img src="/icons/icon-192.png" alt="" width={34} height={34} />
          <span>
            <b>ELIO</b>
            <small>{label(page)}</small>
          </span>
        </Link>
        <Link href="/robot" className={`mBle ${connected ? "on" : ""}`} aria-label={tr("Starea robotului", "Robot status")}>
          <Icon name="bluetooth" size={16} />
          {connected ? tr("Conectat", "Connected") : tr("Offline", "Offline")}
        </Link>
        <button className="mMenuBtn" onClick={() => setOpen(true)} aria-label={tr("Deschide meniul", "Open menu")}>
          <Icon name="menu" />
        </button>
      </header>

      <main className="mMain">{children}</main>

      <nav className="mBottom" aria-label={tr("Navigare", "Navigation")}>
        {BOTTOM_BAR.map((k) => (
          <Link key={k} href={PAGES[k].href} className={k === page ? "active" : ""} aria-current={k === page ? "page" : undefined}>
            <Icon name={PAGES[k].icon} />
            <small>{label(k)}</small>
          </Link>
        ))}
      </nav>

      <div className={`mDrawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <button className="mBackdrop" onClick={() => setOpen(false)} aria-label={tr("Închide meniul", "Close menu")} tabIndex={open ? 0 : -1} />
        <aside className="mPanel" role="dialog" aria-label={tr("Meniu", "Menu")}>
          <div className="mPanelHead">
            <div>
              <b>ELIO</b>
              <p>{tr("Unde vrei să mergi?", "Where would you like to go?")}</p>
            </div>
            <button className="mIconBtn" onClick={() => setOpen(false)} aria-label={tr("Închide meniul", "Close menu")} tabIndex={open ? 0 : -1}>
              <Icon name="close" />
            </button>
          </div>
          {MENU_GROUPS.map((g) => (
            <div key={g.en} className="mGroup">
              <span>{lang === "ro" ? g.ro : g.en}</span>
              {g.items.map((k) => (
                <Link key={k} href={PAGES[k].href} className={`mItem ${k === page ? "active" : ""}`} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
                  <i><Icon name={PAGES[k].icon} /></i>
                  <div>
                    <strong>{label(k)}</strong>
                    <small>{lang === "ro" ? PAGES[k].descRo : PAGES[k].descEn}</small>
                  </div>
                  {k === page && <Icon name="check" size={18} />}
                </Link>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
