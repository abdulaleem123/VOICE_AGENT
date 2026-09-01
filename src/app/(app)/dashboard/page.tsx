"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";
import { usdShort } from "@/lib/costs";

type Dash = {
  conversations: number;
  leads: number;
  meetings: number;
  handoffs: number;
  inbound: number;
  outbound: number;
  costUsd: number;
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
      </header>
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Inbound calls" value={data.inbound} hint="Logged inbound volume" />
        <StatCard label="Outbound calls" value={data.outbound} hint="Logged outbound volume" />
        <StatCard label="Leads" value={data.leads} />
        <StatCard label="Est. cost (30d)" value={usdShort(data.costUsd)} />
      </section>
      <section className="grid lg:grid-cols-3 gap-4">
        <StatCard label="Conversations" value={data.conversations} />
        <StatCard label="Pending handoffs" value={data.handoffs} />
        <StatCard label="Upcoming meetings" value={data.meetings} />
      </section>
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Recent conversations</h2>
          <Link href="/conversations" className="text-sm text-[var(--accent)]">
            Open all
          </Link>
        </div>
        <div className="space-y-2">
          {data.recent.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">No conversations yet.</p>
          ) : (
            data.recent.map((c) => (
              <Link key={c.id} href={`/conversations/${c.id}`} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <p>{c.lead?.name || "Unknown visitor"} {c.lead?.company ? `· ${c.lead.company}` : ""}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">{c.channel} · {c.status}</p>
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
