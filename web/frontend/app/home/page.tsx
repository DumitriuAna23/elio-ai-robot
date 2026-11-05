import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import ElioHome from "@/components/home/ElioHome";
import MobileHome from "@/components/mobile/screens/MobileHome";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Home">
          <ElioHome />
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="home">
          <MobileHome />
        </MobileLayout>
      }
    />
  );
}
