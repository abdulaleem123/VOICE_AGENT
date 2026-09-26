"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  persona: string | null;
  status: string;
  source: string;
  askCount: number;
  createdAt: string;
  _count: { conversations: number; meetings: number; handoffs: number };
};

const NAVY = "#0a1628";
const ACCENT = "#1e56cc";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:          { bg: "#e8f0fe", color: "#1a56db" },
  qualified:    { bg: "#e3fcef", color: "#057a55" },
  contacted:    { bg: "#edebfe", color: "#6c2bd9" },
  converted:    { bg: "#fdf6b2", color: "#8e4b10" },
  disqualified: { bg: "#f0f3f8", color: "#6b7fa0" },
  default:      { bg: "#f0f3f8", color: "#6b7fa0" },
};

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  chat:     { bg: "#e3fcef", color: "#057a55" },
  inbound:  { bg: "#e8f0fe", color: "#1a56db" },
  outbound: { bg: "#edebfe", color: "#6c2bd9" },
  default:  { bg: "#f0f3f8", color: "#6b7fa0" },
};

const ANIM_STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes countChipIn {
    0% { opacity: 0; transform: scale(0.7); }
    70% { opacity: 1; transform: scale(1.08); }
    100% { transform: scale(1); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .chip-in { animation: countChipIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .lead-row { transition: background-color 0.15s ease, transform 0.15s ease; }
  .lead-row:hover { background-color: #fafbfc; transform: translateX(2px); }
`;

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      {/* Header */}
      <header className="rise-in" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, animationDelay: "0ms" }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, margin: 0 }}>
            Pipeline
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>Leads</h1>
          <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
            Persona is classified from titles you set on the agent (CEO, CFO, CTO, …). Qualification ask count is stored per lead.
          </p>
        </div>
        <div className="chip-in" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
          borderRadius: 8, backgroundColor: "#f0f3f8", border: "1.5px solid #e2e8f0", animationDelay: "120ms" }}>
          <Users size={16} color={ACCENT} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>{items.length}</span>
          <span style={{ fontSize: "0.8rem", color: "#6b7fa0" }}>total</span>
        </div>
      </header>

      {/* Table */}
      <div className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", overflow: "hidden", animationDelay: "80ms" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f7f9fc" }}>
                {["Name", "Company", "Email", "Persona", "Status", "Asks", "Source"].map((h) => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left", fontWeight: 700,
                    fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "#6b7fa0", whiteSpace: "nowrap", borderBottom: "1.5px solid #e2e8f0",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => {
                const statusStyle = STATUS_COLORS[l.status] ?? STATUS_COLORS.default;
                const sourceStyle = SOURCE_COLORS[l.source] ?? SOURCE_COLORS.default;
                return (
                  <tr
                    key={l.id}
                    className="row-in lead-row"
                    style={{
                      borderBottom: i < items.length - 1 ? "1px solid #f0f3f8" : "none",
                      animationDelay: `${120 + i * 40}ms`,
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: NAVY, fontWeight: 600 }}>
                      {l.name || ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: NAVY }}>
                      {l.company || ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7fa0", fontSize: "0.82rem" }}>
                      {l.email || ""}
                    </td>
                    <td style={{ padding: "12px 16px", color: NAVY }}>
                      {l.persona || l.title || (
                        <span style={{ color: "#6b7fa0", fontStyle: "italic" }}>unclassified</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem",
                        fontWeight: 600, textTransform: "capitalize",
                        backgroundColor: statusStyle.bg, color: statusStyle.color,
                      }}>
                        {l.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: NAVY, fontWeight: 600,
                      fontVariantNumeric: "tabular-nums" }}>
                      {l.askCount}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: "0.72rem",
                        fontWeight: 600, textTransform: "capitalize",
                        backgroundColor: sourceStyle.bg, color: sourceStyle.color,
                      }}>
                        {l.source}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <p style={{ padding: "32px", color: "#6b7fa0", textAlign: "center", fontSize: "0.875rem" }}>
              Leads appear as the agent captures name and company.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}