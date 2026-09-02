import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;

  const [logs, inbound, outbound, answered, missed, failed] = await Promise.all([
    prisma.callLog.findMany({ orderBy: { createdAt: "desc" }, take: 80, include: { lead: true } }),
    prisma.callLog.count({ where: { direction: "inbound" } }),
    prisma.callLog.count({ where: { direction: "outbound" } }),
    prisma.callLog.count({ where: { outcome: "answered" } }),
    prisma.callLog.count({ where: { outcome: { in: ["missed", "no_answer"] } } }),
    prisma.callLog.count({ where: { outcome: "failed" } }),
  ]);

  const totalDialed = answered + missed + failed;
  return NextResponse.json({
    logs,
    inbound,
    outbound,
    answered,
    missed,
    failed,
    pickupRate: totalDialed ? Math.round((answered / totalDialed) * 100) : 0,
  });
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const direction = body.direction === "outbound" ? "outbound" : "inbound";
  const outcome = ["answered", "missed", "no_answer", "failed", "unknown"].includes(body.outcome)
    ? body.outcome
    : "unknown";
  const status = ["ringing", "in_progress", "completed", "ended", "failed"].includes(body.status)
    ? body.status
    : outcome === "answered"
      ? "completed"
      : "ended";

  const log = await prisma.callLog.create({
    data: {
      direction,
      status,
      outcome,
      duration: Math.min(Math.max(Number(body.duration || 0) || 0, 0), 86_400),
      phoneNumber: clip(body.phoneNumber, 40) || null,
      contactName: clip(body.contactName, 80) || null,
      notes: clip(body.notes, 500) || null,
      leadId: body.leadId ? safeId(body.leadId) || null : null,
      tokensIn: Math.max(0, Number(body.tokensIn || 0) || 0),
      tokensOut: Math.max(0, Number(body.tokensOut || 0) || 0),
      startedAt: new Date(),
      endedAt: status === "completed" || status === "ended" || status === "failed" ? new Date() : null,
    },
  });
  return NextResponse.json(log);
}

export async function PATCH(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const id = safeId(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const log = await prisma.callLog.update({
    where: { id },
    data: {
      status: typeof body.status === "string" ? body.status : undefined,
      outcome: typeof body.outcome === "string" ? body.outcome : undefined,
      duration: body.duration != null ? Number(body.duration) : undefined,
      notes: clip(body.notes, 500) || undefined,
    },
  });
  return NextResponse.json(log);
}
