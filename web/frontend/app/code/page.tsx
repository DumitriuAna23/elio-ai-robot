import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import CodeEditor from "@/components/code/CodeEditor";
import MobileCode from "@/components/mobile/screens/MobileCode";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Code">
          <CodeEditor />
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="code">
          <MobileCode />
        </MobileLayout>
      }
    />
  );
}
