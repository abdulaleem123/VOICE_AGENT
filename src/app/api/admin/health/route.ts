import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOpenAIKey, openai } from "@/lib/openai";
import { requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req, { admin: true });
  if (!gate.ok) return gate.response;
  const started = Date.now();
  let db = false;
  let dbMs = 0;
  try {
    const t = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    db = true;
    dbMs = Date.now() - t;
  } catch {
    db = false;
  }

  let openaiOk = false;
  let openaiDetail = "API key missing";
  if (hasOpenAIKey()) {
    try {
      const list = await openai().models.list();
      openaiOk = true;
      openaiDetail = `${list.data.length} models reachable`;
    } catch {
      openaiDetail = "OpenAI unreachable";
    }
  }

  const [docs, convos, pendingHandoffs] = await Promise.all([
    prisma.knowledgeDoc.count(),
    prisma.conversation.count({ where: { status: "active" } }),
    prisma.handoff.count({ where: { status: "pending" } }),
  ]);

  const healthy = db && openaiOk;
  return NextResponse.json({
    status: healthy ? "healthy" : openaiOk ? "degraded" : "attention",
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    checks: {
      database: { ok: db, latencyMs: dbMs },
      openai: { ok: openaiOk, detail: openaiDetail },
      knowledgeBase: { ok: true, docs },
      activeConversations: convos,
      pendingHandoffs,
    },
  });
}
