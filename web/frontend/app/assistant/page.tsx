import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import MobileAssistant from "@/components/mobile/screens/MobileAssistant";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="AI Assistant">
          <section className="finalArea"><div className="placeholderCard"><div className="bigIcon">💬</div><h1>AI Assistant</h1><p>Desktop chat interface placeholder. Listening, Thinking and Talking states will be connected here.</p><div className="fakeInput">Ask ELIO something... <button>Send</button></div></div></section>
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="assistant">
          <MobileAssistant />
        </MobileLayout>
      }
    />
  );
}
