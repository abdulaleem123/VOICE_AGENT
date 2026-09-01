import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

const BYPASS_HEADERS = ["x-middleware-subrequest"];

export async function proxy(req: NextRequest) {
  for (const h of BYPASS_HEADERS) {
    if (req.headers.get(h)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { pathname } = req.nextUrl;
  const isAdminLogin = pathname === "/admin/login";
  const isUserLogin = pathname === "/login";
  const isPublic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/avatars") ||
    pathname === "/favicon.ico" ||
    pathname === "/api/auth/login";

  if (isPublic || isAdminLogin || isUserLogin) {
    return NextResponse.next();
  }

  const token = req.cookies.get("va_session")?.value;
  const session = token ? await readSession(token) : null;

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/auth/logout") return NextResponse.next();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (pathname.startsWith("/api/admin") && session.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (!session) {
    const dest = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(session.role === "super_admin" ? "/admin" : "/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
