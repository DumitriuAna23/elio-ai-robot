"use client";
// Teacher instructions for each assistant topic, saved on this device and sent
// with every question. The backend adds them after its safety rules.
export type TopicId = "general" | "blocks" | "robotics";
const KEY = "elio-assistant-prompts";
export const PROMPT_MAX = 1500;

export function getPrompts(): Record<TopicId, string> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { general: v.general ?? "", blocks: v.blocks ?? "", robotics: v.robotics ?? "" };
  } catch {
    return { general: "", blocks: "", robotics: "" };
  }
}
export function getPrompt(topic: string): string {
  const all = getPrompts() as Record<string, string>;
  return (all[topic] ?? "").slice(0, PROMPT_MAX);
}
export function savePrompts(p: Record<TopicId, string>) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}