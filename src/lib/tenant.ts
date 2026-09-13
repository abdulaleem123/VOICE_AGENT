import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const TENANT_COOKIE = "va_tenant";

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  tagline: string;
  description: string;
  active: boolean;
};

export async function listTenants() {
  return prisma.tenant.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      industry: true,
      tagline: true,
      description: true,
      active: true,
    },
  });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function getActiveTenantId(): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = jar.get(TENANT_COOKIE)?.value;
  if (fromCookie) {
    const t = await prisma.tenant.findFirst({ where: { id: fromCookie, active: true } });
    if (t) return t.id;
  }
  const setting = await prisma.setting.findUnique({ where: { key: "active_tenant_id" } });
  if (setting?.value) {
    const t = await prisma.tenant.findFirst({ where: { id: setting.value, active: true } });
    if (t) return t.id;
  }
  const first = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return first?.id || null;
}

export async function getActiveTenant() {
  const id = await getActiveTenantId();
  if (!id) return null;
  return prisma.tenant.findUnique({
    where: { id },
    include: { agent: true },
  });
}

export async function setActiveTenantId(tenantId: string) {
  const t = await prisma.tenant.findFirst({ where: { id: tenantId, active: true } });
  if (!t) return null;
  await prisma.setting.upsert({
    where: { key: "active_tenant_id" },
    update: { value: tenantId },
    create: { key: "active_tenant_id", value: tenantId },
  });
  return t;
}

export function tenantCookie(tenantId: string) {
  return {
    name: TENANT_COOKIE,
    value: tenantId,
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
