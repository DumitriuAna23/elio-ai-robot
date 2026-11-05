"use client";
import { useEffect, useState, type ReactNode } from "react";

// Switches between the desktop and the mobile version by screen width.
// Same breakpoint as globals.css (850px). Before the browser has measured the
// screen, both are rendered and CSS hides the wrong one (no flash, no layout
// jump); after that only the matching version is mounted, so the hidden one
// doesn't run (no second joystick, no second Blockly editor).
export const MOBILE_QUERY = "(max-width: 850px)";

export default function Responsive({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const [mode, setMode] = useState<"desktop" | "mobile" | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMode(mq.matches ? "mobile" : "desktop");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      {mode !== "mobile" && <div className="desktopOnly">{desktop}</div>}
      {mode !== "desktop" && mobile}
    </>
  );
}
