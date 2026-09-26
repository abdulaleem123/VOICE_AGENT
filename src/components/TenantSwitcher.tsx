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

const ACCENT = "#1e56cc";

/* Different color per card index */
const ICON_COLORS = [
  { bg: "#e8f0fe", color: "#1a56db" },
  { bg: "#fce8f3", color: "#bf125d" },
  { bg: "#e3fcef", color: "#057a55" },
  { bg: "#fdf6b2", color: "#8e4b10" },
  { bg: "#edebfe", color: "#6c2bd9" },
  { bg: "#feecdc", color: "#b43403" },
];

const ANIM_STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cardIn {
    0% { opacity: 0; transform: translateY(14px) scale(0.96); }
    70% { opacity: 1; }
    100% { transform: translateY(0) scale(1); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .card-in { animation: cardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .tenant-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
  .tenant-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(10,22,40,0.10); }
  .tenant-card:active { transform: translateY(-1px) scale(0.99); }
`;

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
        className="bg-white p-3 mb-1 border border-gray-200 rise-in"
        style={{ borderRadius: 10 }}
      >
        <style>{ANIM_STYLES}</style>
        <p className="text-[10px] tracking-[0.16em] uppercase text-gray-500 mb-2">
          Active tenant
        </p>
        <select
          className="w-full text-sm !bg-white !text-gray-900 border border-gray-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e56cc]/40"
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
    <div className="page-in space-y-6">
      <style>{ANIM_STYLES}</style>

      <header className="rise-in" style={{ animationDelay: "0ms" }}>
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
              className="text-left bg-white p-5 border shadow-sm card-in tenant-card"
              style={{
                borderRadius: 10,
                animationDelay: `${60 + i * 60}ms`,
                borderColor: selected ? ACCENT : "#e5e7eb",
                boxShadow: selected ? `0 0 0 2px rgba(30,86,204,0.18)` : undefined,
              }}
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