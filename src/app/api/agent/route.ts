import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi } from "@/lib/guard";
import { VOICES } from "@/lib/voices";

const TONES = new Set(["professional", "friendly", "warm", "executive", "consultative", "direct"]);
const VOICE_IDS = new Set(VOICES.map((v) => v.id));

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const agent = await prisma.agentConfig.findUnique({ where: { id: "default" } });
  if (!agent) return NextResponse.json({ error: "Not configured" }, { status: 404 });
  return NextResponse.json({
    ...agent,
    targetTitles: JSON.parse(agent.targetTitles || "[]"),
  });
}

export async function PUT(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const titles = (Array.isArray(body.targetTitles) ? body.targetTitles : String(body.targetTitles || "").split(","))
    .map((s: unknown) => clip(s, 40))
    .filter(Boolean)
    .slice(0, 20);

  const rounds = Math.min(3, Math.max(1, Number(body.qualificationRounds || 3) || 3));
  const voiceId = VOICE_IDS.has(String(body.voiceId)) ? String(body.voiceId) : "shimmer";
  const tone = TONES.has(String(body.tone)) ? String(body.tone) : "professional";

  const agent = await prisma.agentConfig.upsert({
    where: { id: "default" },
    update: {
      name: clip(body.name, 80) || "Aria",
      tone,
      description: clip(body.description, 2000),
      targetTitles: JSON.stringify(titles),
      qualificationRounds: rounds,
      collectName: body.collectName !== false,
      collectCompany: body.collectCompany !== false,
      collectEmail: body.collectEmail !== false,
      emailRequiredOnChat: Boolean(body.emailRequiredOnChat),
      voiceId,
      greeting: clip(body.greeting, 500),
    },
    create: {
      id: "default",
      name: clip(body.name, 80) || "Aria",
      tone,
      description: clip(body.description, 2000),
      targetTitles: JSON.stringify(titles),
      qualificationRounds: rounds,
      collectName: body.collectName !== false,
      collectCompany: body.collectCompany !== false,
      collectEmail: body.collectEmail !== false,
      emailRequiredOnChat: Boolean(body.emailRequiredOnChat),
      voiceId,
      greeting: clip(body.greeting, 500),
    },
  });

  return NextResponse.json({
    ...agent,
    targetTitles: JSON.parse(agent.targetTitles || "[]"),
  });
}
