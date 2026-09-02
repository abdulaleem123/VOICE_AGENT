import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/settings";
import { requireApi, clip } from "@/lib/guard";

const KEYS = [
  "livekit_url",
  "livekit_api_key",
  "livekit_api_secret",
  "outbound_trunk_id",
  "inbound_trunk_id",
  "telnyx_phone_number",
  "agent_worker_name",
  "desktop_worker_key",
  "dispatch_api_url",
] as const;

function mask(value: string) {
  if (!value || value.length < 8) return value ? "••••" : "";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const settings = await getSettings();
  const integrations: Record<string, string> = {};
  for (const key of KEYS) {
    const raw = settings[key] || process.env[key.toUpperCase()] || "";
    integrations[key] = key.includes("secret") || key.includes("key") ? mask(raw) : raw;
  }
  return NextResponse.json({
    integrations,
    envConfigured: {
      livekit: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-openai")),
      outboundTrunk: Boolean(process.env.OUTBOUND_TRUNK_ID),
    },
    dispatchApiUrl: process.env.DISPATCH_API_URL || settings.dispatch_api_url || "http://localhost:8000",
  });
}

export async function PUT(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  for (const key of KEYS) {
    if (typeof body[key] === "string" && !body[key].includes("…")) {
      patch[key] = clip(body[key], 300);
    }
  }
  const settings = await setSettings(patch);
  return NextResponse.json({ ok: true, settings });
}
