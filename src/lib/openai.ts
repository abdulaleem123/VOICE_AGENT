import OpenAI from "openai";

let client: OpenAI | null = null;

export function openai() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("your-openai-api-key")) {
    throw new Error("Set OPENAI_API_KEY in your .env file");
  }
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export function chatModel() {
  return process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
}

export function ttsModel() {
  return process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
}

export function sttModel() {
  return process.env.OPENAI_STT_MODEL || "whisper-1";
}

export function embedModel() {
  return process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
}

export function hasOpenAIKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && !key.includes("your-openai-api-key") && key.startsWith("sk-"));
}
