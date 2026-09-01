import { NextResponse } from "next/server";
import { requireSession, type SessionUser } from "@/lib/auth";

export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  const referer = req.headers.get("referer");
  if (referer && host) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

export async function requireApi(
  req: Request,
  opts?: { admin?: boolean },
): Promise<{ ok: true; session: SessionUser } | { ok: false; response: NextResponse }> {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !isSameOrigin(req)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const { session, error, status } = await requireSession(opts?.admin ? "super_admin" : undefined);
  if (!session) {
    return { ok: false, response: NextResponse.json({ error }, { status }) };
  }
  return { ok: true, session };
}

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function safeId(value: unknown) {
  const s = String(value || "");
  return /^[a-z0-9_-]{8,64}$/i.test(s) ? s : "";
}

export function clip(value: unknown, max = 400) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
