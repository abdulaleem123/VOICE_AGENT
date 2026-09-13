import { NextResponse } from "next/server";
import { openai, ttsModel } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { ttsCost } from "@/lib/costs";
import { getVoice, VOICES } from "@/lib/voices";
import { clip, requireApi } from "@/lib/guard";
import { getActiveTenantId } from "@/lib/tenant";
import { speechSnippet, TTS_INSTRUCTIONS, ttsSpeed, ttsUsesInstructions } from "@/lib/tts";

const VOICE_IDS = new Set(VOICES.map((v) => v.id));

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const raw = clip(body.text, 4000);
  const voiceId = VOICE_IDS.has(String(body.voiceId)) ? String(body.voiceId) : "shimmer";
  if (!raw) return NextResponse.json({ error: "No text" }, { status: 400 });

  const text = speechSnippet(raw);
  const voice = getVoice(voiceId);
  const model = ttsModel();
  const speed = ttsSpeed();

  let audio;
  try {
    audio = await openai().audio.speech.create({
      model,
      voice: voice.id as "alloy",
      input: text,
      response_format: "mp3",
      speed,
      ...(ttsUsesInstructions(model) ? { instructions: TTS_INSTRUCTIONS } : {}),
    });
  } catch {
    audio = await openai().audio.speech.create({
      model: "tts-1",
      voice: voice.id as "alloy",
      input: text,
      response_format: "mp3",
      speed: Math.min(speed + 0.04, 1.25),
    });
  }

  const buf = Buffer.from(await audio.arrayBuffer());
  const tenantId = await getActiveTenantId();
  await prisma.usageLog.create({
    data: {
      tenantId,
      type: "tts",
      model,
      characters: text.length,
      costUsd: ttsCost(text.length),
    },
  });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buf.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
