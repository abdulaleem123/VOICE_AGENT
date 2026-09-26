"use client";

import { useEffect, useState } from "react";
import { usd, usdShort } from "@/lib/costs";
import { DollarSign, Cpu, Mic, Volume2, FileText } from "lucide-react";
import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale,
  LinearScale, Filler, Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

const NAVY   = "#0a1628";
const ACCENT = "#3cc7ff";
const GRID   = "rgba(10,22,40,0.07)";

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

type Usage = {
  total: number;
  byType: Record<string, { cost: number; count: number; tokens: number; characters: number }>;
  series: { date: string; cost: number }[];
  recent: { id: string; type: string; model: string; costUsd: number; createdAt: string }[];
};

const TYPE_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  chat:       { icon: <Cpu size={16} />,      bg: "#e8f0fe", color: "#1a56db" },
  embedding:  { icon: <FileText size={16} />, bg: "#e3fcef", color: "#057a55" },
  whisper:    { icon: <Mic size={16} />,      bg: "#edebfe", color: "#6c2bd9" },
  tts:        { icon: <Volume2 size={16} />,  bg: "#fdf6b2", color: "#8e4b10" },
  default:    { icon: <DollarSign size={16}/>,bg: "#f0f3f8", color: "#6b7fa0" },
};

export default function UsagePage() {
  const [data, setData] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p style={{ color: "#6b7fa0", fontFamily: "'Segoe UI', system-ui" }}>Loading cost usage…</p>;

  const chartData = {
    labels: data.series.map((s) => s.date),
    datasets: [{
      label: "Cost (USD)",
      data: data.series.map((s) => s.cost),
      borderColor: NAVY, backgroundColor: "rgba(10,22,40,0.07)",
      fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: NAVY, borderWidth: 2,
    }],
  };

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      <header className="rise-in" style={{ animationDelay: "0ms" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: ACCENT, margin: 0 }}>OpenAI</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Cost usage
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          Estimated spend from chat, embeddings, Whisper, and TTS on this tenant.
        </p>
      </header>

      <div className="rise-in card-hover" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px", animationDelay: "60ms" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#fdf6b2",
            color: "#8e4b10", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#6b7fa0" }}>Total tracked</p>
            <p style={{ margin: "2px 0 0", fontSize: "2rem", fontWeight: 800, color: NAVY, lineHeight: 1 }}>
              {usdShort(data.total)}
            </p>
          </div>
        </div>
        <div style={{ height: 200 }}>
          <Line data={chartData} options={{
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 900 },
            plugins: { legend: { display: false },
              tooltip: { mode: "index", intersect: false,
                callbacks: { label: (ctx: any) => ` $${ctx.parsed.y.toFixed(4)}` } } },
            scales: {
              x: { grid: { color: GRID }, ticks: { color: "#6b7fa0", font: { size: 11 } } },
              y: { grid: { color: GRID }, ticks: { color: "#6b7fa0", font: { size: 11 },
                callback: (v: any) => `$${v}` }, beginAtZero: true },
            },
          } as any} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14 }}>
        {Object.entries(data.byType).map(([type, v], i) => {
          const style = TYPE_ICONS[type] ?? TYPE_ICONS.default;
          return (
            <div
              key={type}
              className="pop-in card-hover"
              style={{
                backgroundColor: "#ffffff", borderRadius: 10,
                border: "1.5px solid #e2e8f0", padding: "16px 18px",
                animationDelay: `${100 + i * 50}ms`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: style.bg,
                  color: style.color, display: "grid", placeItems: "center" }}>
                  {style.icon}
                </div>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#6b7fa0" }}>{type}</p>
              </div>
              <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: NAVY }}>{usd(v.cost)}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#6b7fa0" }}>{v.count} calls</p>
            </div>
          );
        })}
      </div>

      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden", animationDelay: "200ms" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #e2e8f0", backgroundColor: "#f7f9fc" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: NAVY }}>Recent usage</p>
        </div>
        {data.recent.length === 0 ? (
          <p style={{ padding: "24px", color: "#6b7fa0", textAlign: "center", fontSize: "0.875rem" }}>
            No usage yet.
          </p>
        ) : data.recent.map((r, i) => {
          const style = TYPE_ICONS[r.type] ?? TYPE_ICONS.default;
          return (
            <div
              key={r.id}
              className="row-in row-hover"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 20px", fontSize: "0.875rem",
                borderBottom: i < data.recent.length - 1 ? "1px solid #f0f3f8" : "none",
                animationDelay: `${240 + i * 40}ms`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: style.bg,
                  color: style.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  {style.icon}
                </div>
                <span style={{ color: NAVY, fontWeight: 500, textTransform: "capitalize" }}>
                  {r.type} · {r.model}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>{usd(r.costUsd)}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6b7fa0" }}>
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}