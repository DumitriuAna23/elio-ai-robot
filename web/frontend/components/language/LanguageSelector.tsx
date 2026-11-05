"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";


type Language =
  | "ro"
  | "en";


interface LanguageOption {
  id: Language;

  title: string;

  ariaLabel: string;
}


const languages: LanguageOption[] = [

  {
    id: "ro",

    title: "Română",

    ariaLabel:
      "Selectează limba română",
  },

  {
    id: "en",

    title: "English",

    ariaLabel:
      "Select English language",
  },

];


export default function LanguageSelector() {

  const router =
    useRouter();


  const [
    selectedLanguage,
    setSelectedLanguage
  ] =
    useState<Language | null>(
      null
    );


  const [
    isNavigating,
    setIsNavigating
  ] =
    useState(false);


  function selectLanguage(
    language: Language
  ) {

    /*
     * Evităm apăsarea de mai multe ori
     * în timpul navigării.
     */

    if (isNavigating) {
      return;
    }


    setSelectedLanguage(
      language
    );


    setIsNavigating(
      true
    );


    /*
     * Salvăm alegerea.
     *
     * Mai târziu întreaga aplicație
     * va folosi această valoare.
     */

    localStorage.setItem(
      "elio-language",
      language
    );


    /*
     * Mic delay pentru animația
     * de selectare.
     */

    window.setTimeout(
      () => {

        router.push(
          "/home"
        );

      },
      220
    );
  }


  return (

    <section
      className="languageSelector"
      aria-label="Choose language"
    >

      <div className="languageOptions">


        {languages.map(
          (language) => {

            const selected =
              selectedLanguage ===
              language.id;


            return (

              <button
                key={
                  language.id
                }

                type="button"

                className={`
                  languageCircleButton
                  languageCircleButton-${language.id}

                  ${
                    selected
                      ? "languageCircleButtonSelected"
                      : ""
                  }
                `}

                onClick={
                  () =>
                    selectLanguage(
                      language.id
                    )
                }

                disabled={
                  isNavigating
                }

                aria-label={
                  language.ariaLabel
                }
              >


                {/* ==========================
                    STEAG ROTUND
                    ========================== */}

                <span
                  className={`
                    languageRoundFlag
                    languageRoundFlag-${language.id}
                  `}
                  aria-hidden="true"
                >

                  <span
                    className="roundFlagGraphic"
                  />

                </span>


                {/* ==========================
                    NUMELE LIMBII
                    ========================== */}

                <strong
                  className="languageCircleTitle"
                >

                  {
                    language.title
                  }

                </strong>


              </button>

            );

          }
        )}


      </div>


      <p className="languageHint">
        You can change the language later in Settings.
      </p>


    </section>

  );
}