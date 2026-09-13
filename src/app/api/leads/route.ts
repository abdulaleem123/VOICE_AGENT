import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";
import { getActiveTenantId } from "@/lib/tenant";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const tenantId = await getActiveTenantId();
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const items = await prisma.lead.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { conversations: true, meetings: true, handoffs: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const tenantId = await getActiveTenantId();
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const id = safeId(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const status = ["new", "qualified", "handed_off", "meeting_booked"].includes(body.status) ? body.status : undefined;
  const item = await prisma.lead.update({
    where: { id },
    data: {
      name: clip(body.name, 120) || undefined,
      email: clip(body.email, 120) || undefined,
      company: clip(body.company, 160) || undefined,
      title: clip(body.title, 80) || undefined,
      persona: clip(body.persona, 80) || undefined,
      phone: clip(body.phone, 40) || undefined,
      status,
      notes: clip(body.notes, 2000) || undefined,
    },
  });
  return NextResponse.json(item);
}
