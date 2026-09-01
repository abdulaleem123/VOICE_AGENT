import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi, safeId } from "@/lib/guard";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const docId = safeId(id);
  if (!docId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.knowledgeDoc.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
