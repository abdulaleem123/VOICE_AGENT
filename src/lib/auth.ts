import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "super_admin";
};

const COOKIE = "va_session";
const ISS = "voice-agent";
const AUD = "voice-agent";
let dummyHash = "";
function timingSafeDummy() {
  if (!dummyHash) dummyHash = bcrypt.hashSync("__unused__", 10);
  return dummyHash;
}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISS)
    .setAudience(AUD)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function readSession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISS, audience: AUD });
    const role = payload.role === "super_admin" ? "super_admin" : payload.role === "user" ? "user" : null;
    if (!payload.sub || !payload.email || !role) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name || ""),
      role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readSession(token);
}

export async function requireSession(role?: "user" | "super_admin") {
  const session = await getSession();
  if (!session) return { session: null as SessionUser | null, error: "Unauthorized" as const, status: 401 as const };
  if (role === "super_admin" && session.role !== "super_admin") {
    return { session: null, error: "Forbidden" as const, status: 403 as const };
  }
  return { session, error: null, status: 200 as const };
}

export async function loginWithPassword(email: string, password: string, expectedRole?: "user" | "super_admin") {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const hash = user?.password || timingSafeDummy();
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) return null;
  if (expectedRole && user.role !== expectedRole) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
  };
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

export { COOKIE };
