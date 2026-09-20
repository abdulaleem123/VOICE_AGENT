"use client";

import { useEffect, useState } from "react";
import { Activity, Database, MessageSquare, RefreshCw, Zap } from "lucide-react";

const NAVY   = "#0a1628";
const ACCENT = "#3cc7ff";

type Health = {
  status: string; checkedAt: string; latencyMs: number;
  checks: {
    database:           { ok: boolean; latencyMs: number };
    openai:             { ok: boolean; detail: string };
    knowledgeBase:      { ok: boolean; docs: number };
    activeConversations: number;
    pendingHandoffs:    number;
  };
};

const ROW_ICONS = [
  { icon: <Database size={16} />,      bg: "#e8f0fe", color: "#1a56db" },
  { icon: <Zap size={16} />,           bg: "#fdf6b2", color: "#8e4b10" },
  { icon: <Activity size={16} />,      bg: "#edebfe", color: "#6c2bd9" },
  { icon: <MessageSquare size={16} />, bg: "#e3fcef", color: "#057a55" },
  { icon: <Activity size={16} />,      bg: "#fce8f3", color: "#bf125d" },
];

export default function HealthPage() {
  const [data, setData] = useState<Health | null>(null);

  async function load() {
    const res = await fetch("/api/admin/health");
    setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  if (!data) return <p style={{ color: "#6b7fa0", fontFamily: "'Segoe UI', system-ui" }}>Checking systems…</p>;

  const rows = [
    ["Database",             data.checks.database.ok  ? "OK" : "Down", `${data.checks.database.latencyMs} ms`],
    ["OpenAI",               data.checks.openai.ok    ? "OK" : "Down", data.checks.openai.detail],
    ["Knowledge base",       "OK", `${data.checks.knowledgeBase.docs} docs`],
    ["Active conversations", "OK", String(data.checks.activeConversations)],
    ["Pending handoffs",     "OK", String(data.checks.pendingHandoffs)],
  ];

  const isHealthy = data.status === "ok" || data.status === "healthy";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: ACCENT, margin: 0 }}>Status</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>Health</h1>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 18px", borderRadius: 8, border: `2px solid ${NAVY}`,
          backgroundColor: "#ffffff", color: NAVY,
          fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
          boxShadow: "3px 3px 0px #000000",
        }}>
          <RefreshCw size={14} /> Recheck
        </button>
      </header>

      {/* Status banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "20px 24px", borderRadius: 10,
        backgroundColor: isHealthy ? "#e3fcef" : "#fce8f3",
        border: `1.5px solid ${isHealthy ? "#84e1bc" : "#f8b4d9"}`,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center",
          backgroundColor: isHealthy ? "#057a55" : "#bf125d", color: "#ffffff", flexShrink: 0 }}>
          <Activity size={22} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, textTransform: "capitalize",
            color: isHealthy ? "#057a55" : "#bf125d" }}>{data.status}</p>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#6b7fa0" }}>
            Checked {new Date(data.checkedAt).toLocaleString()} · {data.latencyMs} ms
          </p>
        </div>
      </div>

      {/* Checks list */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
        {rows.map(([name, state, detail], i) => {
          const ok = state === "OK";
          const { icon, bg, color } = ROW_ICONS[i];
          return (
            <div key={name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: i < rows.length - 1 ? "1px solid #f0f3f8" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  backgroundColor: bg, color, display: "grid", placeItems: "center" }}>
                  {icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: NAVY }}>{name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#6b7fa0" }}>{detail}</p>
                </div>
              </div>
              <span style={{
                padding: "4px 12px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
                backgroundColor: ok ? "#e3fcef" : "#fce8f3",
                color: ok ? "#057a55" : "#bf125d",
              }}>
                {state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}