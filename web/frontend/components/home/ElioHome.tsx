"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Language = "ro" | "en";

type CardData = {
  title: string;
  description: string;
  href: string;
  type: "blue" | "orange";
  icon: string;
};

/* =========================================================
   ICONS
   ========================================================= */

function CardIcon({ type }: { type: string }) {
  if (type === "chat") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 13h44v31H31L19 53v-9h-9Z" />
        <circle cx="23" cy="29" r="3" />
        <circle cx="32" cy="29" r="3" />
        <circle cx="41" cy="29" r="3" />
      </svg>
    );
  }

  if (type === "learn") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M9 15h20v36H9Z" />
        <path d="M29 20h17v31H29Z" />
        <path d="M46 26h10v25H46Z" />
        <path d="M6 53h52" />
      </svg>
    );
  }

  if (type === "control") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M19 22h26c7 0 11 4 13 11l3 10c2 8-8 12-13 6l-7-8H23l-7 8C11 55 1 51 3 43l3-10c2-7 6-11 13-11Z" />
        <path d="M18 30v12" />
        <path d="M12 36h12" />
        <circle cx="45" cy="32" r="3" />
        <circle cx="51" cy="38" r="3" />
      </svg>
    );
  }

  if (type === "code") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="m23 17-15 15 15 15" />
        <path d="m41 17 15 15-15 15" />
        <path d="m38 10-12 44" />
      </svg>
    );
  }

  if (type === "emotion") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect
          x="10"
          y="15"
          width="44"
          height="38"
          rx="13"
        />

        <circle cx="24" cy="31" r="4" />
        <circle cx="40" cy="31" r="4" />

        <path d="M23 41c6 5 12 5 18 0" />
        <path d="M32 15V8" />

        <circle cx="32" cy="6" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M36 8c10 4 17 11 20 21L39 46 18 25C23 16 28 11 36 8Z" />
      <path d="m20 39-10 3 12-12" />
      <path d="m33 52-3 9 12-12" />
      <circle cx="39" cy="24" r="5" />
      <path d="M14 49c-4 1-7 4-8 9 5-1 8-4 9-8" />
    </svg>
  );
}

/* =========================================================
   HOME
   ========================================================= */

export default function ElioHome() {
  const [language, setLanguage] =
    useState<Language | null>(null);

  /* =======================================================
     LOAD LANGUAGE
     ======================================================= */

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("elio-language");

    if (
      savedLanguage === "ro" ||
      savedLanguage === "en"
    ) {
      setLanguage(savedLanguage);
    } else {
      setLanguage("en");
    }
  }, []);

  /* Prevent English flashing before language loads */

  if (!language) {
    return (
      <div className="elioHome">
        <div style={{ minHeight: "400px" }} />
      </div>
    );
  }

  /* =======================================================
     TRANSLATIONS
     ======================================================= */

  const t =
    language === "ro"
      ? {
          greeting: "Salut,",
          explorer: "Exploratorule!",

          titleLine1: "Ce vrei să",
          titleLine2: "descoperim astăzi?",

          descriptionLine1:
            "Învață, joacă-te, programează și creează",
          descriptionLine2:
            "împreună cu ELIO.",

          talkTitle:
            "Vorbește cu ELIO",
          talkDescription:
            "Întreabă-mă orice! Sunt aici să te ajut.",

          learnTitle:
            "Învață cu ELIO",
          learnDescription:
            "Povești, quiz-uri și descoperiri.",

          controlTitle:
            "Controlează ELIO",
          controlDescription:
            "Condu, explorează și distrează-te!",

          codeTitle:
            "Programează ELIO",
          codeDescription:
            "Construiește propriile programe pentru robot.",

          emotionsTitle:
            "Emoții",
          emotionsDescription:
            "Fă-l pe ELIO să zâmbească și să reacționeze.",

          projectsTitle:
            "Proiectele mele",
          projectsDescription:
            "Continuă creațiile tale.",

          ideaTitle:
            "Ideea zilei de la ELIO",

          ideaQuestion:
            "Poți să mă faci să merg într-un pătrat?",

          tryButton:
            "Hai să încercăm!",
        }
      : {
          greeting: "Hi,",
          explorer: "Explorer!",

          titleLine1:
            "What should we",
          titleLine2:
            "discover today?",

          descriptionLine1:
            "Learn, play, code and create",
          descriptionLine2:
            "together with ELIO.",

          talkTitle:
            "Talk to ELIO",
          talkDescription:
            "Ask me anything! I'm here to help.",

          learnTitle:
            "Learn with ELIO",
          learnDescription:
            "Stories, quizzes & discoveries.",

          controlTitle:
            "Control ELIO",
          controlDescription:
            "Drive, explore and have fun!",

          codeTitle:
            "Code ELIO",
          codeDescription:
            "Build your own robot programs.",

          emotionsTitle:
            "Emotions",
          emotionsDescription:
            "Make ELIO smile & react.",

          projectsTitle:
            "My Projects",
          projectsDescription:
            "Continue your creations.",

          ideaTitle:
            "ELIO's idea of the day",

          ideaQuestion:
            "Can you make me drive in a square?",

          tryButton:
            "Let's try!",
        };

  /* =======================================================
     ACTIONS
     ======================================================= */

  const cards: CardData[] = [
    {
      title: t.talkTitle,
      description: t.talkDescription,
      href: "/assistant",
      type: "blue",
      icon: "chat",
    },

    {
      title: t.learnTitle,
      description: t.learnDescription,
      href: "/learn",
      type: "orange",
      icon: "learn",
    },

    {
      title: t.controlTitle,
      description: t.controlDescription,
      href: "/robot",
      type: "blue",
      icon: "control",
    },

    {
      title: t.codeTitle,
      description: t.codeDescription,
      href: "/code",
      type: "orange",
      icon: "code",
    },

    {
      title: t.emotionsTitle,
      description: t.emotionsDescription,
      href: "/emotions",
      type: "blue",
      icon: "emotion",
    },

    {
      title: t.projectsTitle,
      description: t.projectsDescription,
      href: "/projects",
      type: "orange",
      icon: "projects",
    },
  ];

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="elioHome">

      {/* ===================================================
          HERO
          =================================================== */}

      <section className="homeHero">

        <div
          className="heroCloud heroCloudOne"
          aria-hidden="true"
        />

        <div
          className="heroCloud heroCloudTwo"
          aria-hidden="true"
        />

        <span
          className="heroSpark heroSparkOne"
          aria-hidden="true"
        >
          ✦
        </span>

        <span
          className="heroSpark heroSparkTwo"
          aria-hidden="true"
        >
          ✦
        </span>


        {/* TEXT */}

        <div className="heroCopy">

          <div className="heroGreeting">

            <span>
              {t.greeting}
            </span>

            <strong>
              {t.explorer}
            </strong>

            <span
              className="heroWave"
              aria-hidden="true"
            >
              👋
            </span>

          </div>


          <h2>
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h2>


          <p>
            {t.descriptionLine1}
            <br />
            {t.descriptionLine2}
          </p>

        </div>


        {/* =================================================
            REAL ELIO
            ================================================= */}

        <div className="homeRealElio">

          <div
            className="homeRealElioGlow"
            aria-hidden="true"
          />

          <img
            src="/elio-robot-transparent.png"
            alt="ELIO"
            draggable="false"
          />

        </div>


        {/* =================================================
            BOOKS
            ================================================= */}

        <div
          className="homeBooks"
          aria-hidden="true"
        >
          <span
            className="homeBook homeBookBlue"
          />

          <span
            className="homeBook homeBookDarkBlue"
          />

          <span
            className="homeBook homeBookOrange"
          />
        </div>


        {/* =================================================
            BULB
            ================================================= */}

        <div
          className="homeBulb"
          aria-hidden="true"
        >
          <svg viewBox="0 0 64 64">
            <path d="M32 8c-12 0-21 9-21 21 0 8 4 13 10 18 2 2 3 4 3 7h16c0-3 1-5 3-7 6-5 10-10 10-18C53 17 44 8 32 8Z" />
            <path d="M25 58h14" />
          </svg>
        </div>

      </section>


      {/* ===================================================
    FEATURE CARDS
    =================================================== */}

<section className="homeFeatureGrid">
  {cards.map((card) => (
    <Link
      href={card.href}
      key={card.href}
      className={`featureCard featureCard-${card.type}`}
    >
      <div className="featureCardIcon">
        <CardIcon type={card.icon} />
      </div>

      <div className="featureCardCopy">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>

      <div
        className="featureCardArrow"
        aria-hidden="true"
      >
        →
      </div>
    </Link>
  ))}
</section>


   {/* ===================================================
    IDEA OF THE DAY
    =================================================== */}

<section className="homeIdea">

  <div
    className="homeIdeaIcon"
    aria-hidden="true"
  >
    <svg viewBox="0 0 64 64">
      <path d="M32 7c-12 0-21 9-21 21 0 8 4 13 10 18 2 2 3 4 3 7h16c0-3 1-5 3-7 6-5 10-10 10-18C53 16 44 7 32 7Z" />
      <path d="M25 58h14" />
    </svg>
  </div>

  <div className="homeIdeaCopy">
    <h3>{t.ideaTitle}</h3>

    <div className="homeIdeaQuestion">
      {t.ideaQuestion}
    </div>
  </div>

  <Link
    href="/code"
    className="homeIdeaButton"
  >
    {t.tryButton}

    <span aria-hidden="true">
      →
    </span>
  </Link>

</section>

    </div>
  );
}