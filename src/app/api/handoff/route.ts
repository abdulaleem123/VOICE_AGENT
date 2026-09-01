import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";

function triggerList(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return arr.map((s) => clip(s, 40)).filter(Boolean).slice(0, 20);
}

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const [items, rules] = await Promise.all([
    prisma.handoff.findMany({
      orderBy: { createdAt: "desc" },
      include: { lead: true, conversation: true },
    }),
    prisma.handoffRule.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return NextResponse.json({
    items,
    rules: rules.map((r) => ({ ...r, triggers: JSON.parse(r.triggers || "[]") })),
  });
}

export async function PATCH(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const id = safeId(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (body.kind === "rule") {
    const triggers = triggerList(body.triggers);
    const action = ["book_meeting", "transfer", "notify"].includes(body.action) ? body.action : undefined;
    const rule = await prisma.handoffRule.update({
      where: { id },
      data: {
        name: clip(body.name, 80) || undefined,
        triggers: triggers.length ? JSON.stringify(triggers) : undefined,
        action,
        transferTo: clip(body.transferTo, 80) || undefined,
        enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
        description: clip(body.description, 500) || undefined,
      },
    });
    return NextResponse.json({ ...rule, triggers: JSON.parse(rule.triggers) });
  }

  const status = ["pending", "accepted", "completed"].includes(body.status) ? body.status : undefined;
  const item = await prisma.handoff.update({
    where: { id },
    data: { status, transferTo: clip(body.transferTo, 80) || undefined },
  });
  return NextResponse.json(item);
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const triggers = triggerList(body.triggers);
  const action = ["book_meeting", "transfer", "notify"].includes(body.action) ? body.action : "book_meeting";
  const rule = await prisma.handoffRule.create({
    data: {
      name: clip(body.name, 80) || "Custom",
      triggers: JSON.stringify(triggers),
      action,
      transferTo: clip(body.transferTo, 80) || "Sales",
      enabled: body.enabled !== false,
      description: clip(body.description, 500),
      sortOrder: Math.min(Math.max(Number(body.sortOrder || 10) || 10, 0), 100),
    },
  });
  return NextResponse.json({ ...rule, triggers });
}
