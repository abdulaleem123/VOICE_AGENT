import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/settings";
import { hasOpenAIKey } from "@/lib/openai";
import { clip, requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const settings = await getSettings();
  return NextResponse.json({
    settings,
    openaiConfigured: hasOpenAIKey(),
    models: {
      chat: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      tts: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      stt: process.env.OPENAI_STT_MODEL || "whisper-1",
    },
  });
}

export async function PUT(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const allowed = ["company_name", "company_website", "timezone", "meeting_duration", "notify_email"];
  const patch: Record<string, string> = {};
  for (const key of allowed) {
    if (typeof body[key] === "string") patch[key] = clip(body[key], 200);
  }
  const settings = await setSettings(patch);
  return NextResponse.json({ settings });
}
