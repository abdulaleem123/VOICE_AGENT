"use client";

import { useEffect, useState } from "react";
import { Activity, Database, MessageSquare, RefreshCw, Zap } from "lucide-react";

const NAVY   = "#0a1628";
const ACCENT = "#3cc7ff";

const ANIM_STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.85); }
    70% { opacity: 1; transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .pop-in { animation: popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(10,22,40,0.10); }
  .btn-anim { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-anim:hover { transform: translateY(-2px); }
  .btn-anim:active { transform: translateY(0px) scale(0.97); }
  .row-hover { transition: background-color 0.15s ease, transform 0.15s ease; }
  .row-hover:hover { background-color: #fafbfc; transform: translateX(2px); }
`;

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
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      <header className="rise-in" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, animationDelay: "0ms" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: ACCENT, margin: 0 }}>Status</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>Health</h1>
        </div>
        <button
          onClick={load}
          className="btn-anim"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "8px 18px", borderRadius: 8,
            border: `1.5px solid ${ACCENT}`,
            backgroundColor: "#ffffff",
            color: ACCENT,
            fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Recheck
        </button>
      </header>

      <div
        className="pop-in"
        style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "20px 24px", borderRadius: 10,
          backgroundColor: isHealthy ? "#e3fcef" : "#fce8f3",
          border: `1.5px solid ${isHealthy ? "#84e1bc" : "#f8b4d9"}`,
          animationDelay: "60ms",
        }}
      >
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

      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden", animationDelay: "120ms" }}>
        {rows.map(([name, state, detail], i) => {
          const ok = state === "OK";
          const { icon, bg, color } = ROW_ICONS[i];
          return (
            <div
              key={name}
              className="row-in row-hover"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < rows.length - 1 ? "1px solid #f0f3f8" : "none",
                animationDelay: `${160 + i * 45}ms`,
              }}
            >
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