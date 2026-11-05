"use client";
// Programs made with the phone block editor, saved in this browser.
// `workspace` = the full Blockly program (same editor as desktop); `blocks` = block types, for the count.
// Programs saved by the older phone editor have only `blocks` (ids like "move-forward").
export type SavedProgram = { id: string; name: string; blocks: string[]; updated: number; workspace?: object };
const KEY = "elio-mobile-programs";
const OPEN_KEY = "elio-mobile-open-program";

export function listPrograms(): SavedProgram[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(list: SavedProgram[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export function saveProgram(p: SavedProgram) {
  const list = listPrograms().filter((x) => x.id !== p.id);
  write([{ ...p, updated: Date.now() }, ...list]);
}

export function deleteProgram(id: string) {
  write(listPrograms().filter((x) => x.id !== id));
}

// Projects page → Code page hand-off.
export function requestOpen(id: string) {
  try { localStorage.setItem(OPEN_KEY, id); } catch {}
}
export function takeOpenRequest(): SavedProgram | null {
  try {
    const id = localStorage.getItem(OPEN_KEY);
    localStorage.removeItem(OPEN_KEY);
    return id ? listPrograms().find((p) => p.id === id) ?? null : null;
  } catch {
    return null;
  }
}

export const BLOCK_RO: Record<string, string> = {
  Motion: "Mișcare", Looks: "Aspect", Sound: "Sunet", Events: "Evenimente", Control: "Control",
  Sensing: "Senzori", Operators: "Operatori", Variables: "Variabile",
  "move forward": "mergi înainte", "move backward": "mergi înapoi", "turn left": "virează stânga",
  "turn right": "virează dreapta", "stop ELIO": "oprește ELIO", "set speed to [60] %": "setează viteza la [60] %",
  "show face [Happy]": "arată expresia [Fericit]", "show face [Love]": "arată expresia [Iubire]",
  "show face [Curious]": "arată expresia [Curios]", "show face [Surprised]": "arată expresia [Surprins]",
  "say [Hello!]": "spune [Salut!]", "play sound [Beep]": "redă sunetul [Bip]",
  "when green flag clicked": "când este apăsat steagul verde", "when ELIO connected": "când ELIO este conectat",
  "when obstacle detected": "când este detectat un obstacol", "wait [1] seconds": "așteaptă [1] secunde",
  "repeat [10]": "repetă [10]", forever: "la nesfârșit", "if <> then": "dacă <> atunci",
  "if <> then else": "dacă <> atunci altfel", "wait until <>": "așteaptă până când <>",
  "repeat until <>": "repetă până când <>", distance: "distanță", "obstacle detected?": "obstacol detectat?",
  "ELIO connected?": "ELIO conectat?", "< > and < >": "< > și < >", "< > or < >": "< > sau < >",
  "not < >": "nu < >", "set [my variable] to [0]": "setează [variabila mea] la [0]",
  "change [my variable] by [1]": "modifică [variabila mea] cu [1]", "my variable": "variabila mea",
};
