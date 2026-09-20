"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const NAVY  = "#0a1628";
const ACCENT = "#3cc7ff";

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

function StatCard({ label, value, icon, iconBg, iconColor }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; iconColor: string;
}) {
  const animated = useAnimatedValue(value);
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: 10,
      border: "1.5px solid #e2e8f0", padding: "20px 24px",
      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end",
        justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: ACCENT, margin: 0 }}>Volume</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
            Inbound & outbound
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Log inbound",  dir: "inbound"  as const, icon: <PhoneIncoming size={14} /> },
            { label: "Log outbound", dir: "outbound" as const, icon: <PhoneOutgoing size={14} /> },
          ].map(({ label, dir, icon }) => (
            <button key={dir} onClick={() => add(dir)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 8, border: `2px solid ${NAVY}`,
              backgroundColor: dir === "inbound" ? NAVY : "#ffffff",
              color: dir === "inbound" ? "#ffffff" : NAVY,
              fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
              boxShadow: "3px 3px 0px #000000",
            }}>{icon}{label}</button>
          ))}
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StatCard label="Inbound total"  value={data.inboundTotal}
          icon={<PhoneIncoming size={18} />} iconBg="#e8f0fe" iconColor="#1a56db" />
        <StatCard label="Outbound total" value={data.outboundTotal}
          icon={<PhoneOutgoing size={18} />} iconBg="#edebfe" iconColor="#6c2bd9" />
      </section>

      {/* Bar chart */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "20px 24px" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Call volume  last 7 days
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

      {/* Log list */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
        {data.logs.length === 0 ? (
          <p style={{ padding: "24px", color: "#6b7fa0", textAlign: "center", fontSize: "0.875rem" }}>
            Start inbound or outbound from Conversation to populate this.
          </p>
        ) : data.logs.map((l, i) => (
          <div key={l.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 18px", fontSize: "0.875rem",
            borderBottom: i < data.logs.length - 1 ? "1px solid #f0f3f8" : "none",
          }}>
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