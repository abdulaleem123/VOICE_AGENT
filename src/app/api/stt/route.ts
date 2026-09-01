import { NextResponse } from "next/server";
import { openai, sttModel } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { sttCost } from "@/lib/costs";
import { requireApi } from "@/lib/guard";

const MAX_AUDIO = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No audio" }, { status: 400 });
  }
  if (file.size > MAX_AUDIO) {
    return NextResponse.json({ error: "Audio is too large" }, { status: 400 });
  }

  const transcript = await openai().audio.transcriptions.create({
    file,
    model: sttModel(),
  });

  await prisma.usageLog.create({
    data: {
      type: "stt",
      model: sttModel(),
      characters: transcript.text.length,
      costUsd: sttCost(Math.min(Number(form.get("duration") || 8) || 8, 300)),
    },
  });

  return NextResponse.json({ text: String(transcript.text || "").slice(0, 4000) });
}
