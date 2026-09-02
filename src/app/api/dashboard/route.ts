import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const [
    conversations,
    leads,
    meetings,
    handoffs,
    inbound,
    outbound,
    answered,
    missed,
    usage,
    recent,
    sessions,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.lead.count(),
    prisma.meeting.count({ where: { status: "scheduled", scheduledAt: { gte: new Date() } } }),
    prisma.handoff.count({ where: { status: "pending" } }),
    prisma.callLog.count({ where: { direction: "inbound" } }),
    prisma.callLog.count({ where: { direction: "outbound" } }),
    prisma.callLog.count({ where: { outcome: "answered" } }),
    prisma.callLog.count({ where: { outcome: { in: ["missed", "no_answer"] } } }),
    prisma.usageLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
    }),
    prisma.conversation.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { lead: true },
    }),
    prisma.voiceSession.count({ where: { status: "active" } }),
  ]);

  const dialed = answered + missed;
  return NextResponse.json({
    conversations,
    leads,
    meetings,
    handoffs,
    inbound,
    outbound,
    answered,
    missed,
    pickupRate: dialed ? Math.round((answered / dialed) * 100) : 0,
    activeSessions: sessions,
    costUsd: usage._sum.costUsd || 0,
    tokensIn: usage._sum.tokensIn || 0,
    tokensOut: usage._sum.tokensOut || 0,
    tokens: (usage._sum.tokensIn || 0) + (usage._sum.tokensOut || 0),
    recent,
  });
}
