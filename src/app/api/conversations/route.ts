import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi } from "@/lib/guard";
import { getActiveTenantId } from "@/lib/tenant";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const tenantId = await getActiveTenantId();
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const items = await prisma.conversation.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      lead: true,
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const tenantId = await getActiveTenantId();
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const channel = ["chat", "inbound", "outbound"].includes(body.channel) ? body.channel : "chat";

  const agent = await prisma.agentConfig.findUnique({ where: { tenantId } });
  const conversation = await prisma.conversation.create({
    data: {
      tenantId,
      channel,
      status: "active",
      messages: {
        create: {
          role: "assistant",
          content: agent?.greeting || "Hi  thanks for connecting. Who am I speaking with today?",
        },
      },
    },
    include: { messages: true, lead: true },
  });

  if (channel === "inbound" || channel === "outbound") {
    await prisma.callLog.create({
      data: {
        tenantId,
        direction: channel,
        status: "in_progress",
        duration: 0,
      },
    });
  }

  return NextResponse.json(conversation);
}
