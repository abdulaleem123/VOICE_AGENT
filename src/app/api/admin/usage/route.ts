import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req, { admin: true });
  if (!gate.ok) return gate.response;
  const logs = await prisma.usageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  const byType: Record<string, { cost: number; count: number; tokens: number; characters: number }> = {};
  const byDay: Record<string, number> = {};
  let total = 0;

  for (const log of logs) {
    total += log.costUsd;
    const t = byType[log.type] || { cost: 0, count: 0, tokens: 0, characters: 0 };
    t.cost += log.costUsd;
    t.count += 1;
    t.tokens += log.tokensIn + log.tokensOut;
    t.characters += log.characters;
    byType[log.type] = t;

    const day = log.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + log.costUsd;
  }

  const series = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(6)) }));

  return NextResponse.json({
    total,
    byType,
    series,
    recent: logs.slice(0, 25),
  });
}
