import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveTenantId, getTenantBySlug } from "@/lib/tenant";

function authorized(req: Request) {
  const key = req.headers.get("x-desktop-key") || "";
  const expected = process.env.DESKTOP_WORKER_KEY || "desktop-dev-key";
  return key && key === expected;
}

async function resolveTenantId(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("tenant") || req.headers.get("x-tenant-slug") || "";
  if (slug) {
    const t = await getTenantBySlug(slug);
    if (t?.active) return t.id;
  }
  return getActiveTenantId();
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = await resolveTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  const agent = await prisma.agentConfig.findUnique({ where: { tenantId } });
  const docs = await prisma.knowledgeDoc.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { filename: true, content: true },
  });
  const knowledge = docs
    .map((d) => `## ${d.filename}\n${d.content.slice(0, 3500)}`)
    .join("\n\n")
    .slice(0, 12000);

  return NextResponse.json({
    name: agent?.name || "Aria",
    voiceId: agent?.voiceId || "shimmer",
    tone: agent?.tone || "professional",
    description: agent?.description || "",
    greeting: agent?.greeting || "Hi — how can I help you today?",
    shortReplies: agent?.shortReplies ?? true,
    humanizedTone: agent?.humanizedTone ?? true,
    interruptionEnabled: agent?.interruptionEnabled ?? true,
    autoPauseEnabled: agent?.autoPauseEnabled ?? true,
    noiseCancelEnabled: agent?.noiseCancelEnabled ?? true,
    lowLatencyMode: agent?.lowLatencyMode ?? true,
    vadSilenceMs: agent?.vadSilenceMs ?? 300,
    knowledge,
  });
}
