import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";

const REASONS = new Set(["pricing", "nda", "demo", "discovery", "other"]);
const STATUSES = new Set(["scheduled", "completed", "cancelled"]);

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const items = await prisma.meeting.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { lead: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const when = new Date(String(body.scheduledAt || ""));
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "Invalid meeting time" }, { status: 400 });
  }
  const leadId = body.leadId ? safeId(body.leadId) : null;
  const meeting = await prisma.meeting.create({
    data: {
      leadId: leadId || null,
      title: clip(body.title, 120) || "Follow-up",
      reason: REASONS.has(String(body.reason)) ? String(body.reason) : "discovery",
      scheduledAt: when,
      durationMin: Math.min(Math.max(Number(body.durationMin || 30) || 30, 15), 180),
      notes: clip(body.notes, 2000) || null,
      status: "scheduled",
      meetLink: null,
    },
  });
  if (leadId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "meeting_booked" },
    });
  }
  return NextResponse.json(meeting);
}

export async function PATCH(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const id = safeId(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      status: STATUSES.has(String(body.status)) ? String(body.status) : undefined,
      notes: clip(body.notes, 2000) || undefined,
      scheduledAt: body.scheduledAt ? new Date(String(body.scheduledAt)) : undefined,
      title: clip(body.title, 120) || undefined,
    },
  });
  return NextResponse.json(meeting);
}
