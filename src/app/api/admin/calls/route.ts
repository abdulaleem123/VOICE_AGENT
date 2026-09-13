import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";
import { getActiveTenantId } from "@/lib/tenant";

export async function GET(req: Request) {
  const gate = await requireApi(req, { admin: true });
  if (!gate.ok) return gate.response;
  const [inbound, outbound, logs, byStatus] = await Promise.all([
    prisma.callLog.count({ where: { direction: "inbound" } }),
    prisma.callLog.count({ where: { direction: "outbound" } }),
    prisma.callLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { tenant: { select: { slug: true, name: true } } },
    }),
    prisma.callLog.groupBy({
      by: ["direction", "status"],
      _count: { _all: true },
      _sum: { duration: true },
    }),
  ]);

  return NextResponse.json({
    inboundTotal: inbound,
    outboundTotal: outbound,
    logs,
    byStatus,
  });
}

export async function POST(req: Request) {
  const gate = await requireApi(req, { admin: true });
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const tenantId =
    (typeof body.tenantId === "string" && body.tenantId) || (await getActiveTenantId());
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });

  const direction = body.direction === "outbound" ? "outbound" : "inbound";
  const status = ["completed", "in_progress", "failed"].includes(body.status) ? body.status : "completed";
  const log = await prisma.callLog.create({
    data: {
      tenantId,
      direction,
      status,
      duration: Math.min(Math.max(Number(body.duration || 0) || 0, 0), 86_400),
      notes: clip(body.notes, 500) || null,
      leadId: body.leadId ? safeId(body.leadId) || null : null,
    },
  });
  return NextResponse.json(log);
}
