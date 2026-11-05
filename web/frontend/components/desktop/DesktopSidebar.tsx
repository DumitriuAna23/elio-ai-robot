"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Home",
    href: "/home",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3.5 10.8 12 4l8.5 6.8v8.7a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },

  {
    label: "Assistant",
    href: "/assistant",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 11.5a7.5 7.5 0 1 1-3.2-6.15" />
        <path d="M8.5 10h.01M15.5 10h.01" />
        <path d="M8.5 14.5c2 1.6 5 1.6 7 0" />
        <path d="M18 3v4M16 5h4" />
      </svg>
    ),
  },

  {
    label: "Learn",
    href: "/learn",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11v15H5.5A2.5 2.5 0 0 0 3 21.5Z" />
        <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13v15h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      </svg>
    ),
  },

  {
    label: "Robot Control",
    href: "/robot",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M8 8h8a5 5 0 0 1 4.7 3.3l1.1 3.2a3.2 3.2 0 0 1-5.4 3.2L14.8 16H9.2l-1.6 1.7a3.2 3.2 0 0 1-5.4-3.2l1.1-3.2A5 5 0 0 1 8 8Z" />
        <path d="M7 11v4M5 13h4" />
        <circle cx="16.5" cy="12" r=".8" />
        <circle cx="18.5" cy="14" r=".8" />
      </svg>
    ),
  },

  {
    label: "Emotions",
    href: "/emotions",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 10h.01M15.5 10h.01" />
        <path d="M8 14c1 1.7 2.3 2.5 4 2.5s3-.8 4-2.5" />
      </svg>
    ),
  },

  {
    label: "Code",
    href: "/code",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </svg>
    ),
  },

  {
    label: "Projects",
    href: "/projects",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 5.5h6l1.5 2H20v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
      </svg>
    ),
  },

  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.37.53.7 1 .9.34.14.7.2 1.1.2h.1v4h-.1a1.7 1.7 0 0 0-1.1.4c-.47.2-.8.53-1 .9Z" />
      </svg>
    ),
  },
];

export default function DesktopSidebar() {
  const pathname = usePathname();

  const activeIndex = navigation.findIndex((item) =>
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  );

  return (
    <aside className="desktopSidebar">

      {/* REAL LOGO */}

      <Link
        href="/home"
        className="desktopBrand"
        aria-label="Tales and Tech Hub"
      >
        <img
          src="/tales-tech-logo.png"
          alt="Tales & Tech Hub"
          draggable="false"
        />
      </Link>


      {/* ELIO LABEL */}

      <div className="sidebarElioCard">

        <strong>ELIO</strong>

        <span>
          AI Learning Companion
        </span>

      </div>


      {/* NAVIGATION */}

      <nav className="desktopNav">

        {activeIndex >= 0 && (
          <div
            className="desktopNavSlider"
            style={{
              transform: `translateY(${
                activeIndex * 62
              }px)`,
            }}
          />
        )}

        {navigation.map((item) => {

          const active =
            pathname === item.href ||
            pathname.startsWith(
              `${item.href}/`
            );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`desktopNavItem ${
                active ? "active" : ""
              }`}
            >

              <span className="desktopNavIcon">
                {item.icon}
              </span>

              <span className="desktopNavLabel">
                {item.label}
              </span>

            </Link>
          );
        })}

      </nav>


      {/* BOTTOM */}

      <div className="sidebarBottom">

        <div className="sidebarRobotMini">

          <div className="sidebarRobotIcon">
            <span />
            <span />
          </div>

          <div className="sidebarRobotText">
            <strong>ELIO</strong>
            <span>Ready to explore</span>
          </div>

          <i />

        </div>

      </div>

    </aside>
  );
}