"use client";

import DesktopSidebar from "./DesktopSidebar";
import DesktopHeader from "./DesktopHeader";

export default function DesktopLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="desktopShell">

      <DesktopSidebar />

      <main className="desktopMain">

        <DesktopHeader title={title} />

        <div className="desktopPageTransition">
          {children}
        </div>

      </main>

    </div>
  );
}