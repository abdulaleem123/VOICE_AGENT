import { NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/agent";
import { clip, requireApi, safeId } from "@/lib/guard";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const id = safeId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const text = clip(body.text, 4000);
  if (!text) return NextResponse.json({ error: "Message is empty" }, { status: 400 });

  try {
    const result = await runAgentTurn({ conversationId: id, userText: text });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Agent failed. Check OPENAI_API_KEY." }, { status: 500 });
  }
}
