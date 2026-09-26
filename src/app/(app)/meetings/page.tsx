"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

type Meeting = {
  id: string;
  title: string;
  reason: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  notes: string | null;
  meetLink: string | null;
  lead?: { name?: string | null; company?: string | null; email?: string | null } | null;
};

const NAVY = "#0a1628";
const ACCENT = "#1e56cc";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled:  { bg: "#e8f0fe", color: "#1a56db" },
  completed:  { bg: "#e3fcef", color: "#057a55" },
  cancelled:  { bg: "#fce8f3", color: "#bf125d" },
  default:    { bg: "#f0f3f8", color: "#6b7fa0" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", backgroundColor: "#f7f9fc",
  color: NAVY, fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s ease, background-color 0.15s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", fontWeight: 700,
  color: "#6b7fa0", textTransform: "uppercase",
  letterSpacing: "0.1em", marginBottom: 6,
};

const ANIM_STYLES = `
  @keyframes pageFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-hover { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
  .row-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(10,22,40,0.08); border-color: ${ACCENT} !important; }
  .btn-anim { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-anim:hover { transform: translateY(-2px); }
  .btn-anim:active { transform: translateY(0px) scale(0.97); }
`;

export default function MeetingsPage() {
  const [items, setItems]   = useState<Meeting[]>([]);
  const [title, setTitle]   = useState("Discovery call");
  const [reason, setReason] = useState("discovery");
  const [when, setWhen]     = useState("");

  async function load() {
    const res  = await fetch("/api/meetings");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, reason, scheduledAt: when }),
    });
    setWhen(""); load();
  }

  async function patch(id: string, status: string) {
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      {/* Header */}
      <header className="rise-in" style={{ animationDelay: "0ms" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: ACCENT, margin: 0, fontWeight: 600 }}>
          Calendar
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Meetings
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          Pricing and NDA threads should land here as booked follow-ups instead
          of being handled live on the agent call.
        </p>
      </header>

      {/* Create form */}
      <form onSubmit={create} className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px", animationDelay: "80ms" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Schedule a meeting
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
            />
          </div>
          <div>
            <label style={labelStyle}>Reason</label>
            <select style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="pricing">Pricing</option>
              <option value="nda">NDA</option>
              <option value="demo">Demo</option>
              <option value="discovery">Discovery</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>When</label>
            <input type="datetime-local" style={inputStyle} value={when} required
              onChange={(e) => setWhen(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
            />
          </div>
        </div>

        {/* Schedule button  single accent color */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn-anim"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 22px", borderRadius: 8,
              border: `1.5px solid ${ACCENT}`,
              backgroundColor: ACCENT, color: "#ffffff",
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            <Calendar size={15} /> Schedule Meeting
          </button>
        </div>
      </form>

      {/* Meetings list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div className="rise-in" style={{ padding: "32px", borderRadius: 10, textAlign: "center",
            border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            color: "#6b7fa0", fontSize: "0.875rem", animationDelay: "140ms" }}>
            No meetings yet. Schedule one above.
          </div>
        ) : items.map((m, i) => {
          const statusStyle = STATUS_COLORS[m.status] ?? STATUS_COLORS.default;
          return (
            <div key={m.id} className="row-in row-hover" style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 16,
              padding: "16px 20px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
              animationDelay: `${140 + i * 50}ms`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  backgroundColor: "#f0f3f8", display: "grid", placeItems: "center", color: ACCENT }}>
                  <Calendar size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: NAVY,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.title}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "#6b7fa0",
                    display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={11} />
                    {new Date(m.scheduledAt).toLocaleString()} · {m.durationMin} min ·{" "}
                    <span style={{ textTransform: "capitalize" }}>{m.reason}</span>
                    {m.lead?.name ? ` · ${m.lead.name}` : ""}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {/* Status pill */}
                <span style={{
                  padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem",
                  fontWeight: 600, textTransform: "capitalize",
                  backgroundColor: statusStyle.bg, color: statusStyle.color,
                }}>
                  {m.status}
                </span>

                {/* Complete button */}
                {m.status === "scheduled" && (
                  <button onClick={() => patch(m.id, "completed")} className="btn-anim"
                    style={{
                      padding: "7px 14px", borderRadius: 8,
                      border: `1.5px solid ${ACCENT}`, backgroundColor: ACCENT,
                      color: "#ffffff", fontWeight: 700, fontSize: "0.78rem",
                      cursor: "pointer",
                    }}
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}