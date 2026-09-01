import { NextResponse } from "next/server";
import { requireApi } from "@/lib/guard";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  return NextResponse.json({ user: gate.session });
}
