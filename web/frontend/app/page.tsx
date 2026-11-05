"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ElioHome from "@/components/home/ElioHome";
import LanguageSelector from "@/components/language/LanguageSelector";

export default function LanguagePage() {
  const router = useRouter();

  const [isCheckingLanguage, setIsCheckingLanguage] =
    useState(true);

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("elio-language");

    /*
     * Dacă utilizatorul a ales deja limba,
     * nu mai afișăm selectorul.
     */
    if (
      savedLanguage === "ro" ||
      savedLanguage === "en"
    ) {
      router.replace("/home");
      return;
    }

    setIsCheckingLanguage(false);
  }, [router]);

  /*
   * Loading foarte scurt cât verificăm
   * limba salvată.
   */
  if (isCheckingLanguage) {
    return (
      <main className="languageLoading">
        <div className="languageLoadingDots">
          <span />
          <span />
          <span />
        </div>
      </main>
    );
  }

  return (
    <main className="languagePage">

      {/* ==================================================
          DESKTOP / LAPTOP / TABLET LANDSCAPE
          ================================================== */}

      <div className="languageDesktop">

        <div className="languageStage">

          {/* FUNDALUL PRINCIPAL */}
          <img
            className="languageArtwork"
            src="/language-bg.png"
            alt=""
            draggable="false"
          />

          {/* CONTROALE PESTE FUNDAL */}
          <div className="languageControls">

            <LanguageSelector />

          </div>

        </div>

      </div>


      {/* ==================================================
          MOBILE

          Momentan este separat.
          Îl facem final după desktop.
          ================================================== */}

      <div className="languageMobileFallback">

        <div className="mobileFallbackContent">

          <div className="mobileLanguageBrand">

            <strong>
              ELIO
            </strong>

            <span>
              AI Learning Companion
            </span>

          </div>

          <LanguageSelector />

        </div>

      </div>

    </main>
  );
}