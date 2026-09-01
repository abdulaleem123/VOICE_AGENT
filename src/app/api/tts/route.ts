import { NextResponse } from "next/server";
import { openai, ttsModel } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { ttsCost } from "@/lib/costs";
import { getVoice, VOICES } from "@/lib/voices";
import { clip, requireApi } from "@/lib/guard";

const VOICE_IDS = new Set(VOICES.map((v) => v.id));

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const text = clip(body.text, 4000);
  const voiceId = VOICE_IDS.has(String(body.voiceId)) ? String(body.voiceId) : "nova";
  if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

  const voice = getVoice(voiceId);
  let audio;
  try {
    audio = await openai().audio.speech.create({
      model: ttsModel(),
      voice: voice.id as "alloy",
      input: text,
      response_format: "mp3",
    });
  } catch {
    audio = await openai().audio.speech.create({
      model: "tts-1-hd",
      voice: (voice.gender === "male" ? "onyx" : "nova") as "nova",
      input: text,
      response_format: "mp3",
    });
  }

  const buf = Buffer.from(await audio.arrayBuffer());
  await prisma.usageLog.create({
    data: {
      type: "tts",
      model: ttsModel(),
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
