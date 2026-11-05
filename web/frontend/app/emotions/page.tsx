import DesktopLayout from "@/components/desktop/DesktopLayout";
import MobileLayout from "@/components/mobile/MobileLayout";
import Responsive from "@/components/responsive/Responsive";
import MobileEmotions from "@/components/mobile/screens/MobileEmotions";

// Laptop/desktop (wider than 850px) gets the desktop version, phones get the mobile one.
export default function Page() {
  return (
    <Responsive
      desktop={
        <DesktopLayout title="Emotions">
          <section className="finalArea"><div className="placeholderCard"><h1>😊 Rest Face</h1><p>Select ELIO's default expression.</p><div className="emotionGrid"><button>😊 HAPPY</button><button>😍 LOVE</button><button>😎 COOL</button><button>🤔 CURIOUS</button><button>😢 SAD</button><button>😮 SURPRISED</button></div></div></section>
        </DesktopLayout>
      }
      mobile={
        <MobileLayout page="emotions">
          <MobileEmotions />
        </MobileLayout>
      }
    />
  );
}
