import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveTenantId, getTenantBySlug } from "@/lib/tenant";

function authorized(req: Request) {
  const key = req.headers.get("x-desktop-key") || "";
  const expected = process.env.DESKTOP_WORKER_KEY || "desktop-dev-key";
  return key && key === expected;
}

async function resolveTenantId(body: Record<string, unknown>) {
  if (typeof body.tenantId === "string" && body.tenantId) {
    const t = await prisma.tenant.findFirst({ where: { id: body.tenantId, active: true } });
    if (t) return t.id;
  }
  if (typeof body.tenantSlug === "string" && body.tenantSlug) {
    const t = await getTenantBySlug(body.tenantSlug);
    if (t?.active) return t.id;
  }
  return getActiveTenantId();
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const tenantId = await resolveTenantId(body);
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  const type = String(body.type || "");
  const direction = body.direction === "outbound" ? "outbound" : "inbound";
  const callLogId = typeof body.callLogId === "string" ? body.callLogId : null;

  if (type === "call_queued" || type === "session_start") {
    if (callLogId) {
      const existing = await prisma.callLog.findFirst({ where: { id: callLogId, tenantId } });
      if (existing) return NextResponse.json({ ok: true, callLogId });
    }
    const created = await prisma.callLog.create({
      data: {
        tenantId,
        direction,
        status: "ringing",
        outcome: "unknown",
        phoneNumber: body.phoneNumber || null,
        contactName: body.contactName || null,
        roomName: body.roomName || null,
        notes: body.notes || null,
        startedAt: new Date(),
      },
    });
    if (body.mode === "desktop" || type === "session_start") {
      await prisma.voiceSession.create({
        data: {
          tenantId,
          mode: "desktop",
          status: "active",
          roomName: body.roomName || null,
          interruption: true,
          noiseCancel: true,
          autoPause: true,
          lowLatency: true,
        },
      });
    }
    return NextResponse.json({ ok: true, callLogId: created.id });
  }

  if (!callLogId && !["call_answered", "call_missed", "call_failed", "call_ended"].includes(type)) {
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = {};
  if (type === "call_answered") {
    patch.status = "in_progress";
    patch.outcome = "answered";
    patch.startedAt = new Date();
  } else if (type === "call_missed") {
    patch.status = "ended";
    patch.outcome = "missed";
    patch.endedAt = new Date();
    patch.notes = body.notes || undefined;
  } else if (type === "call_failed") {
    patch.status = "failed";
    patch.outcome = "failed";
    patch.endedAt = new Date();
    patch.notes = body.notes || undefined;
  } else if (type === "call_ended") {
    patch.status = "completed";
    patch.outcome = "answered";
    patch.duration = Math.max(0, Number(body.duration || 0));
    patch.endedAt = new Date();
    patch.tokensIn = Number(body.tokensIn || 0);
    patch.tokensOut = Number(body.tokensOut || 0);
  }

  if (callLogId && Object.keys(patch).length) {
    const existing = await prisma.callLog.findFirst({ where: { id: callLogId, tenantId } });
    if (existing) {
      await prisma.callLog.update({ where: { id: callLogId }, data: patch });
    } else {
      await prisma.callLog.create({
        data: {
          id: callLogId,
          tenantId,
          direction,
          status: String(patch.status || "ended"),
          outcome: String(patch.outcome || "unknown"),
          duration: Number(patch.duration || 0),
          phoneNumber: body.phoneNumber || null,
          contactName: body.contactName || null,
          roomName: body.roomName || null,
        },
      });
    }
  } else if (!callLogId && (type === "call_answered" || type === "call_missed")) {
    await prisma.callLog.create({
      data: {
        tenantId,
        direction,
        status: type === "call_answered" ? "in_progress" : "ended",
        outcome: type === "call_answered" ? "answered" : "missed",
        phoneNumber: body.phoneNumber || null,
        contactName: body.contactName || null,
        roomName: body.roomName || null,
        startedAt: new Date(),
        endedAt: type === "call_missed" ? new Date() : null,
      },
    });
  }

  if (type === "call_ended" && body.roomName) {
    await prisma.voiceSession.updateMany({
      where: { tenantId, roomName: String(body.roomName), status: "active" },
      data: { status: "ended", endedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
