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
      <div className="glass rounded-2xl p-3 mb-1">
        <p className="text-[10px] tracking-[0.16em] uppercase text-[var(--muted)] mb-2">Active tenant</p>
        <select
          className="w-full text-sm bg-transparent border border-white/10 rounded-lg px-2 py-1.5"
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
        {active ? <p className="text-[10px] text-[var(--muted)] mt-2 line-clamp-2">{active.tagline}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Multi-tenant</p>
        <h1 className="text-3xl font-semibold mt-1">Choose industry tenant</h1>
        <p className="text-[var(--muted)] mt-2 max-w-2xl">
          Select who you are selling to — hospital, restaurant, supermart, estate agency, or software house.
          Inbound and outbound calls, knowledge, and agent config switch with the tenant.
        </p>
      </header>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants.map((t) => {
          const selected = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              disabled={busy}
              onClick={() => select(t.id)}
              className={`text-left glass rounded-2xl p-5 border transition ${
                selected ? "border-[#2ee6c8] ring-2 ring-[#2ee6c8]/25" : "border-transparent hover:border-white/15"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/8 grid place-items-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs uppercase tracking-wider text-[var(--accent)] mt-1">{t.industry}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted)] mt-3">{t.tagline}</p>
              <p className="text-xs text-[var(--muted)] mt-2 line-clamp-3">{t.description}</p>
              {selected ? <p className="text-xs text-[#2ee6c8] mt-3">Running now</p> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
