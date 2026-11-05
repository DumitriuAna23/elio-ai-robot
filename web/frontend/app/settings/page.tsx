"use client";
import { useRouter } from "next/navigation";
import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import MobileSettings from "@/components/mobile/screens/MobileSettings";

export default function Page() {
  const r = useRouter();
  function reset() {
    localStorage.removeItem("elio-language");
    r.push("/");
  }
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Settings">
          <section className="finalArea twoCol"><div className="placeholderCard"><h2>🌐 Language</h2><p>Română / English</p><button className="primaryButton" onClick={reset}>Change language</button></div><div className="placeholderCard"><h2>🔵 Bluetooth</h2><p>ELIO connection settings.</p></div></section>
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="settings">
          <MobileSettings />
        </MobileLayout>
      }
    />
  );
}
