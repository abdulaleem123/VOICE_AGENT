"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { usdShort } from "@/lib/costs";
import Link from "next/link";

type Dash = {
  conversations: number;
  leads: number;
  meetings: number;
  handoffs: number;
  inbound: number;
  outbound: number;
  answered: number;
  missed: number;
  pickupRate: number;
  activeSessions: number;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  recent: {
    id: string;
    channel: string;
    status: string;
    updatedAt: string;
    lead?: { name?: string | null; company?: string | null } | null;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-[var(--muted)]">Loading overview…</p>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Workspace</p>
        <h1 className="text-3xl font-semibold mt-1">Overview</h1>
        <p className="text-[var(--muted)] mt-2">Sessions, pickup rates, and SaaS token consumption.</p>
      </header>
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Inbound calls" value={data.inbound} />
        <StatCard label="Outbound calls" value={data.outbound} />
        <StatCard label="Picked up" value={data.answered} hint={`${data.pickupRate}% pickup rate`} />
        <StatCard label="Not picked up" value={data.missed} />
      </section>
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Input tokens (30d)" value={data.tokensIn.toLocaleString()} />
        <StatCard label="Output tokens (30d)" value={data.tokensOut.toLocaleString()} />
        <StatCard label="Est. cost (30d)" value={usdShort(data.costUsd)} />
        <StatCard label="Active desktop sessions" value={data.activeSessions} />
      </section>
      <section className="grid lg:grid-cols-3 gap-4">
        <StatCard label="Conversations" value={data.conversations} />
        <StatCard label="Leads" value={data.leads} />
        <StatCard label="Pending handoffs" value={data.handoffs} />
      </section>
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Recent conversations</h2>
          <div className="flex gap-3 text-sm text-[var(--accent)]">
            <Link href="/calls">Calls</Link>
            <Link href="/conversations">Open all</Link>
          </div>
        </div>
        <div className="space-y-2">
          {data.recent.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">No conversations yet.</p>
          ) : (
            data.recent.map((c) => (
              <Link key={c.id} href={`/conversations/${c.id}`} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <p>
                    {c.lead?.name || "Unknown visitor"} {c.lead?.company ? `· ${c.lead.company}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted)] capitalize">
                    {c.channel} · {c.status}
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)]">{new Date(c.updatedAt).toLocaleString()}</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
