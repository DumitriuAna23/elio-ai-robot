import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import MobileLearn from "@/components/mobile/screens/MobileLearn";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Learn & Discover">
          <section className="finalArea"><div className="simpleCards three"><article>🧠<b>Quiz</b><p>STEM and general knowledge.</p></article><article>🧩<b>Riddles</b><p>Fun challenges with ELIO.</p></article><article>🚀<b>Discover</b><p>Science and technology.</p></article></div></section>
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="learn">
          <MobileLearn />
        </MobileLayout>
      }
    />
  );
}
