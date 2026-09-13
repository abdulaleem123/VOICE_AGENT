import { NextResponse } from "next/server";
import { requireApi } from "@/lib/guard";
import { getActiveTenant, listTenants, setActiveTenantId, tenantCookie } from "@/lib/tenant";

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const [tenants, active] = await Promise.all([listTenants(), getActiveTenant()]);
  return NextResponse.json({
    tenants,
    activeTenantId: active?.id || null,
    activeTenant: active
      ? {
          id: active.id,
          slug: active.slug,
          name: active.name,
          industry: active.industry,
          tagline: active.tagline,
          description: active.description,
        }
      : null,
  });
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const tenantId = String(body.tenantId || "");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  const tenant = await setActiveTenantId(tenantId);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  const res = NextResponse.json({
    ok: true,
    activeTenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      industry: tenant.industry,
      tagline: tenant.tagline,
    },
  });
  const c = tenantCookie(tenant.id);
  res.cookies.set(c);
  return res;
}
