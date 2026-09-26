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

const ACCENT = "#1e56cc";

const ANIM_STYLES = `
  @keyframes pageFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cardIn {
    0% { opacity: 0; transform: translateY(14px) scale(0.97); }
    70% { opacity: 1; }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .card-in { animation: cardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(10,22,40,0.08); }
  .btn-anim { transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease; }
  .btn-anim:hover { transform: translateY(-2px); }
  .btn-anim:active { transform: translateY(0px) scale(0.97); }
  .toggle-anim { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
`;

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
    <div className="min-h-screen bg-white text-black page-in">
      <style>{ANIM_STYLES}</style>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <header className="rise-in" style={{ animationDelay: "0ms" }}>
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
          {rules.map((r, i) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-[10px] p-5 shadow-sm card-in card-hover"
              style={{ animationDelay: `${60 + i * 60}ms` }}
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
                  className={`toggle-anim shrink-0 text-xs font-medium px-3 py-1 rounded-full border ${
                    r.enabled
                      ? "bg-[#e8f0fe] text-[#1e56cc] border-[#c7dbfa]"
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
        <section className="bg-white border border-gray-200 rounded-[10px] overflow-hidden shadow-sm rise-in" style={{ animationDelay: "180ms" }}>
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
            <h2 className="font-semibold text-navy-900">Handoff queue</h2>
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No handoffs yet.</p>
          ) : (
            <ul>
              {items.map((i, idx) => (
                <li
                  key={i.id}
                  className="px-5 py-4 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-4 row-in"
                  style={{ animationDelay: `${220 + idx * 40}ms` }}
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
                        className="btn-anim text-xs font-medium px-3 py-1.5 rounded-[8px] text-white"
                        style={{ backgroundColor: ACCENT }}
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