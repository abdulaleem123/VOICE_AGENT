"use client";

import { useEffect, useState } from "react";
import { PhoneIncoming, PhoneOutgoing } from "lucide-react";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const NAVY  = "#0a1628";
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

type Calls = {
  inboundTotal: number; outboundTotal: number;
  logs: { id: string; direction: string; status: string; duration: number; createdAt: string; notes: string | null }[];
};

function useAnimatedValue(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return value;
}

function StatCard({ label, value, icon, iconBg, iconColor, delay = 0 }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; iconColor: string; delay?: number;
}) {
  const animated = useAnimatedValue(value);
  return (
    <div
      className="pop-in card-hover"
      style={{
        backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        animationDelay: `${delay}ms`,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: "#6b7fa0" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color: NAVY, lineHeight: 1 }}>
          {animated}
        </p>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: iconBg,
        color: iconColor, display: "grid", placeItems: "center" }}>
        {icon}
      </div>
    </div>
  );
}

export default function AdminCallsPage() {
  const [data, setData] = useState<Calls | null>(null);

  async function load() {
    const res = await fetch("/api/admin/calls");
    setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function add(direction: "inbound" | "outbound") {
    await fetch("/api/admin/calls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction, status: "completed", duration: 60 }),
    });
    load();
  }

  if (!data) return <p style={{ color: "#6b7fa0", fontFamily: "'Segoe UI', system-ui" }}>Loading calls…</p>;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  const barData = {
    labels: last7,
    datasets: [
      { label: "Inbound",  data: [0,0,0,0,0,0, data.inboundTotal],
        backgroundColor: NAVY, borderRadius: 5, borderSkipped: false },
      { label: "Outbound", data: [0,0,0,0,0,0, data.outboundTotal],
        backgroundColor: "#e2e8f0", borderRadius: 5, borderSkipped: false },
    ],
  };

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      <header className="rise-in" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end",
        justifyContent: "space-between", gap: 16, animationDelay: "0ms" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: ACCENT, margin: 0 }}>Volume</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
            Inbound & outbound
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Log inbound",  dir: "inbound"  as const, icon: <PhoneIncoming size={14} />, filled: true },
            { label: "Log outbound", dir: "outbound" as const, icon: <PhoneOutgoing size={14} />, filled: false },
          ].map(({ label, dir, icon, filled }) => (
            <button
              key={dir}
              onClick={() => add(dir)}
              className="btn-anim"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8,
                border: `1.5px solid ${ACCENT}`,
                backgroundColor: filled ? ACCENT : "#ffffff",
                color: filled ? "#ffffff" : ACCENT,
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StatCard label="Inbound total"  value={data.inboundTotal}
          icon={<PhoneIncoming size={18} />} iconBg="#e8f0fe" iconColor="#1a56db" delay={40} />
        <StatCard label="Outbound total" value={data.outboundTotal}
          icon={<PhoneOutgoing size={18} />} iconBg="#edebfe" iconColor="#6c2bd9" delay={90} />
      </section>

      <div className="rise-in card-hover" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "20px 24px", animationDelay: "140ms" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Call volume · last 7 days
        </p>
        <div style={{ height: 200 }}>
          <Bar data={barData} options={{
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 900 },
            plugins: { legend: { position: "top", align: "end",
              labels: { color: "#6b7fa0", font: { size: 11 }, boxWidth: 10, padding: 14 } },
              tooltip: { mode: "index", intersect: false } },
            scales: {
              x: { grid: { color: "transparent" }, ticks: { color: "#6b7fa0", font: { size: 11 } } },
              y: { grid: { color: "rgba(10,22,40,0.07)" }, ticks: { color: "#6b7fa0", font: { size: 11 } }, beginAtZero: true },
            },
          }} />
        </div>
      </div>

      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden", animationDelay: "200ms" }}>
        {data.logs.length === 0 ? (
          <p style={{ padding: "24px", color: "#6b7fa0", textAlign: "center", fontSize: "0.875rem" }}>
            Start inbound or outbound from Conversation to populate this.
          </p>
        ) : data.logs.map((l, i) => (
          <div
            key={l.id}
            className="row-in row-hover"
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 18px", fontSize: "0.875rem",
              borderBottom: i < data.logs.length - 1 ? "1px solid #f0f3f8" : "none",
              animationDelay: `${240 + i * 40}ms`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, display: "grid", placeItems: "center",
                backgroundColor: l.direction === "inbound" ? "#e8f0fe" : "#edebfe",
                color: l.direction === "inbound" ? "#1a56db" : "#6c2bd9" }}>
                {l.direction === "inbound" ? <PhoneIncoming size={14} /> : <PhoneOutgoing size={14} />}
              </div>
              <span style={{ color: NAVY, fontWeight: 500, textTransform: "capitalize" }}>
                {l.direction} · {l.status} · {l.duration}s
              </span>
            </div>
            <span style={{ color: "#6b7fa0", fontSize: "0.78rem" }}>
              {new Date(l.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}