"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneIncoming, PhoneOff, PhoneMissed } from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Filler,
  Tooltip,
} from "chart.js";
import { Doughnut, Bar, Line, PolarArea } from "react-chartjs-2";

ChartJS.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, RadialLinearScale, Filler, Tooltip
);

const NAVY  = "#0a1628";
const ACCENT = "#1e56cc";
const SLATE = "#94a3b8";
const GRID  = "rgba(10,22,40,0.07)";

const ANIM_STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.85); }
    70% { opacity: 1; transform: scale(1.03); }
    100% { transform: scale(1); }
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
`;

type CallRow = {
  id: string; direction: string; status: string; outcome: string;
  duration: number; phoneNumber: string | null; contactName: string | null;
  tokensIn: number; tokensOut: number; createdAt: string;
};
type CallsData = {
  logs: CallRow[]; inbound: number; outbound: number;
  answered: number; missed: number; failed: number; pickupRate: number;
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", backgroundColor: "#f7f9fc",
  color: NAVY, fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", fontWeight: 700,
  color: "#6b7fa0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6,
};

/* ── Animated counter hook ── */
function useAnimatedValue(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ── Metric card with chart ── */
function MetricCard({
  label, value, icon, chart, iconBg, iconColor, delay,
}: {
  label: string; value: number; icon: React.ReactNode;
  chart: React.ReactNode; iconBg: string; iconColor: string; delay: number;
}) {
  const animated = useAnimatedValue(value);
  return (
    <div
      className="pop-in card-hover"
      style={{
        backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 12,
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#6b7fa0" }}>{label}</p>
          <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800, color: NAVY,
            lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{animated}</p>
        </div>
        {/* ── Colored icon box ── */}
        <div style={{ width: 38, height: 38, borderRadius: 8,
          backgroundColor: iconBg, color: iconColor,
          display: "grid", placeItems: "center" }}>
          {icon}
        </div>
      </div>
      <div style={{ height: 80 }}>{chart}</div>
    </div>
  );
}

const OUTCOME_COLORS: Record<string, { bg: string; color: string }> = {
  answered: { bg: "#e3fcef", color: "#057a55" },
  missed:   { bg: "#fce8f3", color: "#bf125d" },
  no_answer:{ bg: "#fdf6b2", color: "#8e4b10" },
  failed:   { bg: "#f0f3f8", color: "#6b7fa0" },
};

export default function CallsPage() {
  const [data, setData]           = useState<CallsData | null>(null);
  const [phone, setPhone]         = useState("");
  const [name, setName]           = useState("");
  const [direction, setDirection] = useState<"inbound"|"outbound">("outbound");
  const [outcome, setOutcome]     = useState("answered");
  const [msg, setMsg]             = useState("");
  const [busy, setBusy]           = useState(false);

  async function load() {
    const res = await fetch("/api/calls");
    setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function logCall(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const res = await fetch("/api/calls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction, outcome,
        status: outcome === "answered" ? "completed" : "ended",
        phoneNumber: phone, contactName: name,
        duration: outcome === "answered" ? 90 : 0,
      }),
    });
    setBusy(false);
    setMsg(res.ok ? "Call logged" : "Failed to log call");
    setPhone(""); setName(""); load();
  }

  async function queueOutbound() {
    setBusy(true); setMsg("");
    const dispatchUrl = (await fetch("/api/integrations").then((r) => r.json())).dispatchApiUrl || "http://localhost:8000";
    try {
      const res = await fetch(`${dispatchUrl}/call/outbound`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: { phone_number: phone, contact_name: name || "Contact", company_name: "" } }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? d.message || "Outbound queued" : d.detail || "Dispatch API not reachable");
    } catch { setMsg("Dispatch API offline. Run: cd desktop && python api.py"); }
    setBusy(false); load();
  }

  if (!data) return <p style={{ color: "#6b7fa0", fontFamily: "'Segoe UI', system-ui" }}>Loading calls…</p>;

  /* ── Chart data (animate from 0 handled by useAnimatedValue for counter;
        Chart.js animation config handles bar/line growth) ── */

  /* 1. Inbound  Doughnut */
  const inboundChart = (
    <Doughnut
      data={{
        labels: ["Inbound", "Other"],
        datasets: [{ data: [data.inbound || 1, Math.max(1, data.outbound)],
          backgroundColor: [ACCENT, "#e2e8f0"], borderWidth: 0, hoverOffset: 3 }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false, cutout: "68%",
        animation: { animateRotate: true, duration: 900 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      }}
    />
  );

  /* 2. Outbound  Horizontal bar */
  const outboundChart = (
    <Bar
      data={{
        labels: ["Out", "In"],
        datasets: [{ data: [data.outbound, data.inbound],
          backgroundColor: [ACCENT, "#e2e8f0"], borderRadius: 4, borderSkipped: false }],
      }}
      options={{
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, beginAtZero: true },
          y: { display: false },
        },
      }}
    />
  );

  /* 3. Picked up  Line sparkline */
  const pickedUpChart = (
    <Line
      data={{
        labels: ["", "", "", "", "", "", ""],
        datasets: [{
          data: [0, Math.round(data.answered * 0.3), Math.round(data.answered * 0.5),
                 Math.round(data.answered * 0.6), Math.round(data.answered * 0.75),
                 Math.round(data.answered * 0.9), data.answered],
          borderColor: ACCENT, backgroundColor: "rgba(30,86,204,0.10)",
          fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
      }}
    />
  );

  /* 4. Missed  Polar area */
  const missedChart = (
    <PolarArea
      data={{
        labels: ["Missed", "Failed", "Answered"],
        datasets: [{
          data: [data.missed || 1, data.failed || 1, data.answered || 1],
          backgroundColor: ["rgba(30,86,204,0.75)", "rgba(30,86,204,0.35)", "#e2e8f0"],
          borderWidth: 0,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { r: { display: false } },
      }}
    />
  );

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      {/* Header */}
      <header className="rise-in" style={{ animationDelay: "0ms" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: ACCENT, margin: 0 }}>Telephony</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Inbound & outbound
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          Pickup vs miss metrics, desktop LiveKit sessions, and SaaS call logging.
        </p>
      </header>

      {/* ── 4 metric cards with charts ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Inbound" value={data.inbound}
            icon={<PhoneIncoming size={18} />}
            iconBg="#e8f0fe" iconColor="#1a56db"
            chart={inboundChart} delay={60} />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Outbound" value={data.outbound}
            icon={<Phone size={18} />}
            iconBg="#e3fcef" iconColor="#057a55"
            chart={outboundChart} delay={120} />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Picked up" value={data.answered}
            icon={<Phone size={18} />}
            iconBg="#edebfe" iconColor="#6c2bd9"
            chart={pickedUpChart} delay={180} />
        </div>
        <div style={{ minWidth: 0 }}>
          <MetricCard label="Not picked up" value={data.missed}
            icon={<PhoneMissed size={18} />}
            iconBg="#fce8f3" iconColor="#bf125d"
            chart={missedChart} delay={240} />
        </div>
      </section>

      {/* Pickup rate bar */}
      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 16, animationDelay: "260ms" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: NAVY, whiteSpace: "nowrap" }}>
          Pickup rate
        </p>
        <div style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: "#f0f3f8", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, backgroundColor: ACCENT,
            width: `${data.pickupRate}%`, transition: "width 1s cubic-bezier(0.22, 1, 0.36, 1)" }} />
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: NAVY, whiteSpace: "nowrap" }}>
          {data.pickupRate}%
        </p>
      </div>

      {/* Log call form */}
      <form onSubmit={logCall} className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "20px 24px", animationDelay: "320ms" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Log a call manually
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Direction</label>
            <select style={inputStyle} value={direction}
              onChange={(e) => setDirection(e.target.value as "inbound"|"outbound")}>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Outcome</label>
            <select style={inputStyle} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="answered">Picked up</option>
              <option value="missed">Not picked up</option>
              <option value="no_answer">No answer</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Contact</label>
            <input style={inputStyle} value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Alex" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone}
              onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={busy} className="btn-anim" style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${ACCENT}`,
              backgroundColor: ACCENT, color: "#ffffff", fontWeight: 700,
              fontSize: "0.82rem", cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}>
              Log
            </button>
            <button type="button" disabled={busy || !phone} onClick={queueOutbound} className="btn-anim" style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${ACCENT}`,
              backgroundColor: "#ffffff", color: ACCENT, fontWeight: 700,
              fontSize: "0.82rem", cursor: busy || !phone ? "not-allowed" : "pointer",
              opacity: busy || !phone ? 0.4 : 1,
            }}>
              Dial
            </button>
          </div>
        </div>
      </form>

      {msg && <p className="row-in" style={{ fontSize: "0.875rem", color: ACCENT, fontWeight: 600, margin: 0 }}>✓ {msg}</p>}

      {/* Call log table */}
      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden", animationDelay: "380ms" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f7f9fc" }}>
                {["When", "Dir", "Contact", "Phone", "Outcome", "Duration", "Tokens in/out"].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 700,
                    fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "#6b7fa0", whiteSpace: "nowrap", borderBottom: "1.5px solid #e2e8f0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.logs.map((l, i) => {
                const oc = OUTCOME_COLORS[l.outcome] ?? OUTCOME_COLORS.failed;
                return (
                  <tr
                    key={l.id}
                    className="row-in"
                    style={{
                      borderBottom: i < data.logs.length - 1 ? "1px solid #f0f3f8" : "none",
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <td style={{ padding: "11px 16px", color: "#6b7fa0", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5,
                        textTransform: "capitalize", color: NAVY, fontWeight: 500 }}>
                        {l.direction === "inbound"
                          ? <PhoneIncoming size={13} />
                          : <Phone size={13} />}
                        {l.direction}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: NAVY, fontWeight: 500 }}>
                      {l.contactName || ""}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#6b7fa0" }}>
                      {l.phoneNumber || ""}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem",
                        fontWeight: 600, textTransform: "capitalize",
                        backgroundColor: oc.bg, color: oc.color }}>
                        {l.outcome.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: NAVY }}>{l.duration}s</td>
                    <td style={{ padding: "11px 16px", color: "#6b7fa0", fontVariantNumeric: "tabular-nums" }}>
                      {l.tokensIn}/{l.tokensOut}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.logs.length === 0 && (
            <p style={{ padding: "24px", color: "#6b7fa0", textAlign: "center", fontSize: "0.875rem" }}>
              No calls yet.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}