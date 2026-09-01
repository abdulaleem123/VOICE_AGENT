"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { usdShort } from "@/lib/costs";
import Link from "next/link";

export default function AdminHome() {
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [usage, setUsage] = useState<{ total: number } | null>(null);
  const [calls, setCalls] = useState<{ inboundTotal: number; outboundTotal: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/health").then((r) => r.json()).then(setHealth);
    fetch("/api/admin/usage").then((r) => r.json()).then(setUsage);
    fetch("/api/admin/calls").then((r) => r.json()).then(setCalls);
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[#f5b942]">Control plane</p>
        <h1 className="text-3xl font-semibold mt-1">Super admin</h1>
        <p className="text-[var(--muted)] mt-2">Health, OpenAI spend, inbound totals, and outbound totals for this single tenant.</p>
      </header>
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Health" value={health?.status || "…"} />
        <StatCard label="Cost usage" value={usage ? usdShort(usage.total) : "…"} />
        <StatCard label="Inbound calls total" value={calls?.inboundTotal ?? "…"} />
        <StatCard label="Outbound calls total" value={calls?.outboundTotal ?? "…"} />
      </section>
      <section className="grid md:grid-cols-3 gap-4">
        <Link href="/admin/health" className="glass rounded-2xl p-5">Open health →</Link>
        <Link href="/admin/usage" className="glass rounded-2xl p-5">Open cost usage →</Link>
        <Link href="/admin/calls" className="glass rounded-2xl p-5">Open call totals →</Link>
      </section>
    </div>
  );
}
