import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import RobotControlPanel from "@/components/robot/RobotControlPanel";
import MobileRobot from "@/components/mobile/screens/MobileRobot";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Robot Control">
          <RobotControlPanel />
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="robot">
          <MobileRobot />
        </MobileLayout>
      }
    />
  );
}
