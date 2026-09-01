import { NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/agent";
import { clip, requireApi, safeId } from "@/lib/guard";

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;

  const body = await req.json().catch(() => ({}));
  const id = safeId(body.conversationId);
  if (!id) return NextResponse.json({ error: "Invalid conversation" }, { status: 400 });

  const text = clip(body.text, 4000);
  if (!text) return NextResponse.json({ error: "Message is empty" }, { status: 400 });

  try {
    const result = await runAgentTurn({ conversationId: id, userText: text });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Agent failed. Check OPENAI_API_KEY." }, { status: 500 });
  }
}
