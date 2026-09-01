"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usd, usdShort } from "@/lib/costs";

type Usage = {
  total: number;
  byType: Record<string, { cost: number; count: number; tokens: number; characters: number }>;
  series: { date: string; cost: number }[];
  recent: { id: string; type: string; model: string; costUsd: number; createdAt: string }[];
};

export default function UsagePage() {
  const [data, setData] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-[var(--muted)]">Loading cost usage…</p>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[#f5b942]">OpenAI</p>
        <h1 className="text-3xl font-semibold mt-1">Cost usage</h1>
        <p className="text-[var(--muted)] mt-2">Estimated spend from chat, embeddings, Whisper, and TTS on this tenant.</p>
      </header>
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-[var(--muted)]">Total tracked</p>
        <p className="text-4xl font-semibold mt-1">{usdShort(data.total)}</p>
        <div className="h-56 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series}>
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5b942" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f5b942" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#8b9bb4" fontSize={11} />
              <YAxis stroke="#8b9bb4" fontSize={11} />
              <Tooltip contentStyle={{ background: "#101828", border: "1px solid #233" }} />
              <Area type="monotone" dataKey="cost" stroke="#f5b942" fill="url(#c)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(data.byType).map(([type, v]) => (
          <div key={type} className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">{type}</p>
            <p className="text-xl font-semibold mt-2">{usd(v.cost)}</p>
            <p className="text-xs text-[var(--muted)] mt-1">{v.count} calls</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        {data.recent.map((r) => (
          <div key={r.id} className="px-4 py-3 border-b border-white/6 flex justify-between text-sm">
            <span className="capitalize">
              {r.type} · {r.model}
            </span>
            <span>
              {usd(r.costUsd)} · {new Date(r.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {data.recent.length === 0 ? <p className="p-4 text-[var(--muted)]">No usage yet.</p> : null}
      </div>
    </div>
  );
}
