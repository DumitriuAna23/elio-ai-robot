import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import MobileProjects from "@/components/mobile/screens/MobileProjects";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Projects">
          <section className="finalArea"><div className="placeholderCard"><h1>📁 My Projects</h1><p>Saved visual-programming projects will appear here.</p><button className="primaryButton">New project</button></div></section>
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="projects">
          <MobileProjects />
        </MobileLayout>
      }
    />
  );
}
