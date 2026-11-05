"use client";

export default function DesktopHeader({
  title,
}: {
  title: string;
}) {
  return (
    <header className="desktopHeader">

      <div className="desktopHeaderTitle">

        <span>
          ELIO
        </span>

        <h1>
          {title}
        </h1>

      </div>


      <div className="desktopHeaderActions">

        <div className="desktopRobotStatus">

          <span className="statusDot" />

          <span>
            Robot offline
          </span>

        </div>


        <button
          type="button"
          className="desktopHeaderButton"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>


        <button
          type="button"
          className="desktopHeaderButton"
          aria-label="Profile"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c.8-4.2 3.5-6.3 8-6.3s7.2 2.1 8 6.3" />
          </svg>
        </button>

      </div>

    </header>
  );
}