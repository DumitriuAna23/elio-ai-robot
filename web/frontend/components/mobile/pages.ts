// Every page of the app, used by the mobile menu, the home tiles and the bottom bar.
export type PageKey = "home" | "robot" | "code" | "assistant" | "learn" | "emotions" | "projects" | "settings";

export const PAGES: Record<PageKey, { href: string; icon: string; ro: string; en: string; descRo: string; descEn: string }> = {
  home: { href: "/home", icon: "home", ro: "Acasă", en: "Home", descRo: "Prezentare ELIO", descEn: "ELIO overview" },
  robot: { href: "/robot", icon: "robot", ro: "Control", en: "Control", descRo: "Joystick, viteză și senzori", descEn: "Joystick, speed and sensors" },
  code: { href: "/code", icon: "code", ro: "Blocuri", en: "Blocks", descRo: "Programează-l pe ELIO", descEn: "Program ELIO" },
  assistant: { href: "/assistant", icon: "chat", ro: "Asistent", en: "Assistant", descRo: "Discută cu ELIO", descEn: "Chat with ELIO" },
  learn: { href: "/learn", icon: "learn", ro: "Învață", en: "Learn", descRo: "Activități educative", descEn: "Learning activities" },
  emotions: { href: "/emotions", icon: "smile", ro: "Emoții", en: "Emotions", descRo: "Expresiile robotului", descEn: "Robot expressions" },
  projects: { href: "/projects", icon: "folder", ro: "Proiecte", en: "Projects", descRo: "Programele tale salvate", descEn: "Your saved programs" },
  settings: { href: "/settings", icon: "settings", ro: "Setări", en: "Settings", descRo: "Limbă, Wi-Fi, instalare", descEn: "Language, Wi-Fi, install" },
};

export const MENU_GROUPS: { ro: string; en: string; items: PageKey[] }[] = [
  { ro: "ACASĂ", en: "HOME", items: ["home"] },
  { ro: "ROBOT", en: "ROBOT", items: ["robot", "code"] },
  { ro: "DESCOPERĂ", en: "EXPLORE", items: ["assistant", "learn", "emotions", "projects"] },
  { ro: "APLICAȚIE", en: "APP", items: ["settings"] },
];

export const BOTTOM_BAR: PageKey[] = ["home", "robot", "code", "assistant", "learn"];
