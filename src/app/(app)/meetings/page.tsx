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
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", fontWeight: 700,
  color: "#6b7fa0", textTransform: "uppercase",
  letterSpacing: "0.1em", marginBottom: 6,
};

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
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#1e56cc", margin: 0, fontWeight: 600 }}>
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
      <form onSubmit={create} style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Schedule a meeting
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.backgroundColor = "#fff"; }}
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
              onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
            />
          </div>
        </div>

        {/* Schedule button  matches other pages */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 22px", borderRadius: 8,
              border: "2px solid #1e56cc",
              backgroundColor: "#1e56cc", color: NAVY,
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
              boxShadow: "3px 3px 0px #000000",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px, 2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #000000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(0, 0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #000000";
            }}
          >
            <Calendar size={15} /> Schedule Meeting
          </button>
        </div>
      </form>

      {/* Meetings list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ padding: "32px", borderRadius: 10, textAlign: "center",
            border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            color: "#6b7fa0", fontSize: "0.875rem" }}>
            No meetings yet. Schedule one above.
          </div>
        ) : items.map((m) => {
          const statusStyle = STATUS_COLORS[m.status] ?? STATUS_COLORS.default;
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 16,
              padding: "16px 20px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                {/* Icon */}
                <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  backgroundColor: "#f0f3f8", display: "grid", placeItems: "center", color: NAVY }}>
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
                  <button onClick={() => patch(m.id, "completed")}
                    style={{
                      padding: "7px 14px", borderRadius: 8,
                      border: `2px solid ${NAVY}`, backgroundColor: NAVY,
                      color: "#ffffff", fontWeight: 700, fontSize: "0.78rem",
                      cursor: "pointer", boxShadow: "2px 2px 0px #000000",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translate(1px, 1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #000000";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translate(0, 0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "2px 2px 0px #000000";
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