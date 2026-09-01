"use client";

import { useEffect, useState } from "react";

type Health = {
  status: string;
  checkedAt: string;
  latencyMs: number;
  checks: {
    database: { ok: boolean; latencyMs: number };
    openai: { ok: boolean; detail: string };
    knowledgeBase: { ok: boolean; docs: number };
    activeConversations: number;
    pendingHandoffs: number;
  };
};

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);

  async function load() {
    const res = await fetch("/api/admin/health");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <p className="text-[var(--muted)]">Checking systems…</p>;

  const rows = [
    ["Database", data.checks.database.ok ? "OK" : "Down", `${data.checks.database.latencyMs} ms`],
    ["OpenAI", data.checks.openai.ok ? "OK" : "Down", data.checks.openai.detail],
    ["Knowledge base", "OK", `${data.checks.knowledgeBase.docs} docs`],
    ["Active conversations", "OK", String(data.checks.activeConversations)],
    ["Pending handoffs", "OK", String(data.checks.pendingHandoffs)],
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5b942]">Status</p>
          <h1 className="text-3xl font-semibold mt-1">Health</h1>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-white/8">
          Recheck
        </button>
      </header>
      <div className="glass rounded-2xl p-6">
        <p className="text-4xl font-semibold capitalize">{data.status}</p>
        <p className="text-sm text-[var(--muted)] mt-2">
          Checked {new Date(data.checkedAt).toLocaleString()} · {data.latencyMs} ms
        </p>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        {rows.map(([name, state, detail]) => (
          <div key={name} className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-[var(--muted)]">{detail}</p>
            </div>
            <span className={state === "OK" ? "text-[#2ee6c8]" : "text-[#ff6b7a]"}>{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
