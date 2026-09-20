"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  tagline: string;
  description: string;
};

/* Different color per card index */
const ICON_COLORS = [
  { bg: "#e8f0fe", color: "#1a56db" },
  { bg: "#fce8f3", color: "#bf125d" },
  { bg: "#e3fcef", color: "#057a55" },
  { bg: "#fdf6b2", color: "#8e4b10" },
  { bg: "#edebfe", color: "#6c2bd9" },
  { bg: "#feecdc", color: "#b43403" },
];

export function TenantSwitcher({ compact = false }: { compact?: boolean }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/tenants");
    if (!res.ok) return;
    const data = await res.json();
    setTenants(data.tenants || []);
    setActiveId(data.activeTenantId || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function select(tenantId: string) {
    if (tenantId === activeId || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!res.ok) return;
      setActiveId(tenantId);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  const active = tenants.find((t) => t.id === activeId);

  if (compact) {
    return (
      <div
        className="bg-white p-3 mb-1 border border-gray-200"
        style={{ borderRadius: 10 }}
      >
        <p className="text-[10px] tracking-[0.16em] uppercase text-gray-500 mb-2">
          Active tenant
        </p>
        <select
          className="w-full text-sm !bg-white !text-gray-900 border border-gray-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400"
          style={{ borderRadius: 8 }}
          value={activeId}
          disabled={busy || tenants.length === 0}
          onChange={(e) => select(e.target.value)}
        >
          {tenants.length === 0 ? <option value="">Loading…</option> : null}
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {active && (
          <p className="text-[10px] text-gray-500 mt-2 line-clamp-2">
            {active.tagline}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Multi-tenant
        </p>
        <h1 className="text-3xl font-semibold mt-1 text-slate-900">
          Choose industry tenant
        </h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Select who you are selling to  hospital, restaurant, supermart, estate
          agency, or software house. Inbound and outbound calls, knowledge, and
          agent config switch with the tenant.
        </p>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants.map((t, i) => {
          const selected = t.id === activeId;
          const iconStyle = ICON_COLORS[i % ICON_COLORS.length];
          return (
            <button
              key={t.id}
              type="button"
              disabled={busy}
              onClick={() => select(t.id)}
              className={`text-left bg-white p-5 border transition shadow-sm ${
                selected
                  ? "border-slate-900 ring-2 ring-slate-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ borderRadius: 10 }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 grid place-items-center shrink-0"
                  style={{
                    backgroundColor: iconStyle.bg,
                    borderRadius: 8,
                  }}
                >
                  <Building2 size={18} color={iconStyle.color} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs uppercase tracking-wider text-[var(--accent)] mt-1">
                    {t.industry}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">{t.tagline}</p>
              <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                {t.description}
              </p>
              {selected && (
                <p className="text-xs mt-3 font-medium text-[var(--accent)]">
                  Running now
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}