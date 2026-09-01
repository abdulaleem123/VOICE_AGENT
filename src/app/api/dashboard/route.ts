import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  const [conversations, leads, meetings, handoffs, inbound, outbound, usage, recent] = await Promise.all([
    prisma.conversation.count(),
    prisma.lead.count(),
    prisma.meeting.count({ where: { status: "scheduled", scheduledAt: { gte: new Date() } } }),
    prisma.handoff.count({ where: { status: "pending" } }),
    prisma.callLog.count({ where: { direction: "inbound" } }),
    prisma.callLog.count({ where: { direction: "outbound" } }),
    prisma.usageLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true, tokensIn: true, tokensOut: true },
    }),
    prisma.conversation.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { lead: true },
    }),
  ]);

  return NextResponse.json({
    conversations,
    leads,
    meetings,
    handoffs,
    inbound,
    outbound,
    costUsd: usage._sum.costUsd || 0,
    tokens: (usage._sum.tokensIn || 0) + (usage._sum.tokensOut || 0),
    recent,
  });
}
