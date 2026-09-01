"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";

type Calls = {
  inboundTotal: number;
  outboundTotal: number;
  logs: {
    id: string;
    direction: string;
    status: string;
    duration: number;
    createdAt: string;
    notes: string | null;
  }[];
};

export default function CallsPage() {
  const [data, setData] = useState<Calls | null>(null);

  async function load() {
    const res = await fetch("/api/admin/calls");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function add(direction: "inbound" | "outbound") {
    await fetch("/api/admin/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, status: "completed", duration: 60 }),
    });
    load();
  }

  if (!data) return <p className="text-[var(--muted)]">Loading calls…</p>;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5b942]">Volume</p>
          <h1 className="text-3xl font-semibold mt-1">Inbound & outbound</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => add("inbound")} className="px-4 py-2 rounded-xl bg-white/8">
            Log inbound
          </button>
          <button onClick={() => add("outbound")} className="px-4 py-2 rounded-xl bg-white/8">
            Log outbound
          </button>
        </div>
      </header>
      <section className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Inbound calls total" value={data.inboundTotal} />
        <StatCard label="Outbound calls total" value={data.outboundTotal} />
      </section>
      <div className="glass rounded-2xl overflow-hidden">
        {data.logs.map((l) => (
          <div key={l.id} className="px-4 py-3 border-b border-white/6 flex justify-between text-sm">
            <span className="capitalize">
              {l.direction} · {l.status} · {l.duration}s
            </span>
            <span className="text-[var(--muted)]">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {data.logs.length === 0 ? <p className="p-4 text-[var(--muted)]">Start inbound or outbound from Conversation to populate this.</p> : null}
      </div>
    </div>
  );
}
