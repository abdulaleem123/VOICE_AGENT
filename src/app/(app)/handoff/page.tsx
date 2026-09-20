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
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <header>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
            Routing
          </p>
          <h1 className="text-3xl font-semibold text-navy-900 mt-1">Handoff</h1>
          <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
            When the agent hits pricing, NDA, or a meeting request, it hands the
            thread to sales/legal and offers a booked conversation  or transfers
            live to a human.
          </p>
        </header>

        {/* Rules Grid */}
        <section className="grid md:grid-cols-2 gap-4">
          {rules.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-[10px] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-navy-900">{r.name}</h2>
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <button
                  onClick={() => toggle(r)}
                  className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                    r.enabled
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {r.enabled ? "On" : "Off"}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Triggers: {r.triggers.join(", ")} · Action:{" "}
                {r.action.replace("_", " ")}
                {r.transferTo ? ` · To ${r.transferTo}` : ""}
              </p>
            </div>
          ))}
        </section>

        {/* Handoff Queue */}
        <section className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
            <h2 className="font-semibold text-navy-900">Handoff queue</h2>
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No handoffs yet.</p>
          ) : (
            <ul>
              {items.map((i) => (
                <li
                  key={i.id}
                  className="px-5 py-4 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-navy-900 capitalize">
                      {i.reason} · {i.lead?.name || "Unknown"}
                      {i.lead?.company ? (
                        <span className="text-gray-500 font-normal">
                          {" "}
                          ({i.lead.company})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{i.details}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs capitalize text-gray-500">
                      {i.status}
                    </span>
                    {i.status === "pending" && (
                      <button
                        onClick={() => setStatus(i.id, "accepted")}
                        className="text-xs font-medium px-3 py-1.5 rounded-[8px] bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}