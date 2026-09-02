import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function authorized(req: Request) {
  const key = req.headers.get("x-desktop-key") || "";
  const expected = process.env.DESKTOP_WORKER_KEY || "desktop-dev-key";
  return key && key === expected;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agent = await prisma.agentConfig.findUnique({ where: { id: "default" } });
  const docs = await prisma.knowledgeDoc.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { filename: true, content: true },
  });
  const knowledge = docs
    .map((d) => `## ${d.filename}\n${d.content.slice(0, 3500)}`)
    .join("\n\n")
    .slice(0, 12000);

  return NextResponse.json({
    name: agent?.name || "Aria",
    voiceId: agent?.voiceId || "shimmer",
    tone: agent?.tone || "professional",
    description: agent?.description || "",
    greeting: agent?.greeting || "Hi — how can I help you today?",
    shortReplies: agent?.shortReplies ?? true,
    humanizedTone: agent?.humanizedTone ?? true,
    interruptionEnabled: agent?.interruptionEnabled ?? true,
    autoPauseEnabled: agent?.autoPauseEnabled ?? true,
    noiseCancelEnabled: agent?.noiseCancelEnabled ?? true,
    lowLatencyMode: agent?.lowLatencyMode ?? true,
    vadSilenceMs: agent?.vadSilenceMs ?? 300,
    knowledge,
  });
}
