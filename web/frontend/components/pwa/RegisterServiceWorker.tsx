"use client";
import { useEffect } from "react";
import "@/lib/install"; // starts listening for the browser's install offer as early as possible

// Registers /sw.js so the browser offers "Install app" / "Add to Home screen".
// Skipped in development so cached files don't hide your code changes.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
