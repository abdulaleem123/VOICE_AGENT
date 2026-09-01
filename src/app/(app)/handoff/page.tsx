"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  name: string;
  triggers: string[];
  action: string;
  transferTo: string | null;
  enabled: boolean;
  description: string;
};

type Item = {
  id: string;
  reason: string;
  details: string;
  status: string;
  transferTo: string | null;
  createdAt: string;
  lead?: { name?: string | null; company?: string | null } | null;
};

export default function HandoffPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch("/api/handoff");
    const data = await res.json();
    setRules(data.rules || []);
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(rule: Rule) {
    await fetch("/api/handoff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "rule", id: rule.id, enabled: !rule.enabled }),
    });
    load();
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/handoff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Routing</p>
        <h1 className="text-3xl font-semibold mt-1">Handoff</h1>
        <p className="text-[var(--muted)] mt-2">
          When the agent hits pricing, NDA, or a meeting request, it hands the thread to sales/legal and offers a booked conversation — or transfers live to a human.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        {rules.map((r) => (
          <div key={r.id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{r.name}</h2>
                <p className="text-sm text-[var(--muted)] mt-1">{r.description}</p>
              </div>
              <button onClick={() => toggle(r)} className={`text-xs px-3 py-1 rounded-full ${r.enabled ? "bg-[#2ee6c8]/20 text-[#2ee6c8]" : "bg-white/8 text-[var(--muted)]"}`}>
                {r.enabled ? "On" : "Off"}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              Triggers: {r.triggers.join(", ")} · Action: {r.action.replace("_", " ")}
              {r.transferTo ? ` · To ${r.transferTo}` : ""}
            </p>
          </div>
        ))}
      </section>

      <section className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/6 font-medium">Handoff queue</div>
        {items.map((i) => (
          <div key={i.id} className="px-4 py-3 border-b border-white/6 flex items-center justify-between gap-3">
            <div>
              <p className="capitalize">
                {i.reason} · {i.lead?.name || "Unknown"} {i.lead?.company ? `(${i.lead.company})` : ""}
              </p>
              <p className="text-sm text-[var(--muted)] mt-1">{i.details}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs capitalize text-[var(--muted)]">{i.status}</span>
              {i.status === "pending" ? (
                <button onClick={() => setStatus(i.id, "accepted")} className="text-xs px-3 py-1 rounded-lg bg-white/8">
                  Accept
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="p-4 text-[var(--muted)]">No handoffs yet.</p> : null}
      </section>
    </div>
  );
}
