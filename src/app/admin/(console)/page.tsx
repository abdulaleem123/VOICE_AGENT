"use client";

import { useEffect, useState } from "react";
import { usdShort } from "@/lib/costs";
import Link from "next/link";
import { Activity, DollarSign, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement,
  PointElement, CategoryScale, LinearScale, Filler, Tooltip,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip);

const NAVY = "#0a1628";
const ACCENT = "#3cc7ff";
const GRID = "rgba(10,22,40,0.07)";

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

function MetricCard({ label, value, icon, iconBg, iconColor, chart }: {
  label: string; value: string | number;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  chart?: React.ReactNode;
}) {
  const num = typeof value === "number" ? value : null;
  const animated = useAnimatedValue(num ?? 0);
  return (
    <div style={{
      backgroundColor: "#ffffff", borderRadius: 10,
      border: "1.5px solid #e2e8f0", padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 12,
      height: "100%", boxSizing: "border-box",   // ← fills stretched cell
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#6b7fa0" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800, color: NAVY, lineHeight: 1 }}>
            {num !== null ? animated : value}
          </p>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: iconBg,
          color: iconColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      {/* Always render chart area  empty div keeps height consistent */}
      <div style={{ height: 72, marginTop: "auto" }}>
        {chart ?? null}
      </div>
    </div>
  );
}

function NavCard({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: 10, border: "1.5px solid #e2e8f0",
        padding: "20px", transition: "border-color 0.15s, box-shadow 0.15s", cursor: "pointer" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = NAVY;
          (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 3px 0px #000000";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: NAVY }}>{title}</p>
        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b7fa0" }}>{sub}</p>
        <p style={{ margin: "12px 0 0", fontSize: "0.82rem", fontWeight: 700, color: ACCENT }}>
          Open →
        </p>
      </div>
    </Link>
  );
}

export default function AdminHome() {
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [usage,  setUsage]  = useState<{ total: number }  | null>(null);
  const [calls,  setCalls]  = useState<{ inboundTotal: number; outboundTotal: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/health").then((r) => r.json()).then(setHealth);
    fetch("/api/admin/usage").then((r) => r.json()).then(setUsage);
    fetch("/api/admin/calls").then((r) => r.json()).then(setCalls);
  }, []);

  const inboundChart = (
    <Doughnut data={{
      labels: ["Inbound", "Outbound"],
      datasets: [{ data: [calls?.inboundTotal || 1, calls?.outboundTotal || 1],
        backgroundColor: [NAVY, "#e2e8f0"], borderWidth: 0 }],
    }} options={{ responsive: true, maintainAspectRatio: false, cutout: "68%",
      animation: { duration: 900 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
  );

  const outboundChart = (
    <Bar data={{
      labels: ["Out", "In"],
      datasets: [{ data: [calls?.outboundTotal || 0, calls?.inboundTotal || 0],
        backgroundColor: [NAVY, "#e2e8f0"], borderRadius: 4, borderSkipped: false }],
    }} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false, beginAtZero: true }, y: { display: false } } }} />
  );

  const costChart = (
    <Line data={{
      labels: ["", "", "", "", "", "", ""],
      datasets: [{ data: [0, 0.2, 0.5, 0.8, 1.2, 1.8, usage?.total || 2],
        borderColor: NAVY, backgroundColor: "rgba(10,22,40,0.06)",
        fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }],
    }} options={{ responsive: true, maintainAspectRatio: false,
      animation: { duration: 900 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false, beginAtZero: true } } }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      <header>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: ACCENT, margin: 0 }}>Control plane</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Super admin
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          Health, OpenAI spend, inbound totals, and outbound totals for this single tenant.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, minWidth: 0, alignItems: "stretch" }}>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Health" value={health?.status || "…"}
            icon={<Activity size={18} />} iconBg="#e3fcef" iconColor="#057a55" />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Cost usage" value={usage ? usdShort(usage.total) : "…"}
            icon={<DollarSign size={18} />} iconBg="#fdf6b2" iconColor="#8e4b10"
            chart={costChart} />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Inbound total" value={calls?.inboundTotal ?? 0}
            icon={<PhoneIncoming size={18} />} iconBg="#e8f0fe" iconColor="#1a56db"
            chart={inboundChart} />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Outbound total" value={calls?.outboundTotal ?? 0}
            icon={<PhoneOutgoing size={18} />} iconBg="#edebfe" iconColor="#6c2bd9"
            chart={outboundChart} />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <NavCard href="/admin/health"  title="System health"  sub="Database, OpenAI, knowledge base status" />
        <NavCard href="/admin/usage"   title="Cost usage"     sub="Estimated OpenAI spend by model and type" />
        <NavCard href="/admin/calls"   title="Call totals"    sub="Inbound and outbound volume over time" />
      </section>
    </div>
  );
}