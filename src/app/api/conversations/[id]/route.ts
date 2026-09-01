import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clip, requireApi, safeId } from "@/lib/guard";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const id = safeId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      lead: true,
      handoffs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const agent = await prisma.agentConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json({ conversation, voiceId: agent?.voiceId || "nova" });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const id = safeId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const status = ["active", "ended", "handed_off"].includes(body.status) ? body.status : undefined;
  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      status,
      summary: clip(body.summary, 2000) || undefined,
    },
  });
  if (status === "ended" && (conversation.channel === "inbound" || conversation.channel === "outbound")) {
    await prisma.callLog.updateMany({
      where: { direction: conversation.channel, status: "in_progress" },
      data: { status: "completed", duration: Math.min(Math.max(Number(body.duration || 0) || 0, 0), 86_400) },
    });
  }
  return NextResponse.json(conversation);
}
