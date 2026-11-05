import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./mobile.css";
import ElioBluetoothKeeper from "@/components/bluetooth/ElioBluetoothKeeper";
import RegisterServiceWorker from "@/components/pwa/RegisterServiceWorker";

export const metadata: Metadata = {
  title: "ELIO",
  description: "AI Educational & Desk Companion Robot",
  applicationName: "ELIO",
  appleWebApp: {
    capable: true,
    title: "ELIO",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#087df0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterServiceWorker />
        <ElioBluetoothKeeper />
        {children}
      </body>
    </html>
  );
}
