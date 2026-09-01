import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword, sessionCookie, signSession } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const LoginBody = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200),
  portal: z.enum(["user", "admin"]).optional(),
});

export async function POST(req: Request) {
  const limited = rateLimit(`login:${clientKey(req)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = LoginBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email, password, portal } = parsed.data;
  const user = await loginWithPassword(email.toLowerCase(), password, portal === "admin" ? "super_admin" : "user");
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession(user);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    redirect: user.role === "super_admin" ? "/admin" : "/dashboard",
  });
  const c = sessionCookie(token);
  res.cookies.set(c);
  return res;
}
