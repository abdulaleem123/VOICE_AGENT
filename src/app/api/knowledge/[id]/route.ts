import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApi, safeId } from "@/lib/guard";
import { getActiveTenantId } from "@/lib/tenant";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const tenantId = await getActiveTenantId();
  if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  const { id } = await ctx.params;
  const docId = safeId(id);
  if (!docId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const doc = await prisma.knowledgeDoc.findFirst({ where: { id: docId, tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.knowledgeDoc.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
