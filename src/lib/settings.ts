import { prisma } from "./prisma";

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export async function setSettings(patch: Record<string, string>) {
  for (const [key, value] of Object.entries(patch)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  return getSettings();
}
