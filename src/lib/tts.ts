export const TTS_INSTRUCTIONS =
  "Speak with warm, upbeat energy and natural enthusiasm. Sound friendly, confident, and human  like an engaging conversation, never flat or monotone. Use light vocal variety and a pleasant pace.";

export function ttsSpeed() {
  const n = Number(process.env.OPENAI_TTS_SPEED || "1.08");
  return Number.isFinite(n) ? Math.min(Math.max(n, 0.85), 1.35) : 1.08;
}

export function ttsUsesInstructions(model: string) {
  return model.includes("gpt-4o");
}

/** Shorter spoken lines feel faster and more natural in voice mode. */
export function speechSnippet(text: string, max = 520) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (last > max * 0.45) return cut.slice(0, last + 1).trim();
  return `${cut.trim()}…`;
}
