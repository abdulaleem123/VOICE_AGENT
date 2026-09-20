// conversations/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Phone, PhoneOutgoing } from "lucide-react";

type Item = {
  id: string;
  channel: string;
  status: string;
  updatedAt: string;
  lead?: { name?: string | null; company?: string | null } | null;
  _count: { messages: number };
};

const NAVY = "#0a1628";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:  { bg: "#e3fcef", color: "#057a55" },
  ended:   { bg: "#f0f3f8", color: "#6b7fa0" },
  default: { bg: "#f0f3f8", color: "#6b7fa0" },
};

export default function ConversationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);

  async function start(channel: "chat" | "inbound" | "outbound") {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const data = await res.json();
    router.push(`/conversations/${data.id}`);
  }

  const ChannelIcon = ({ channel }: { channel: string }) => {
    if (channel === "inbound")  return <Phone size={14} />;
    if (channel === "outbound") return <PhoneOutgoing size={14} />;
    return <MessageSquare size={14} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#1e56cc", margin: 0 }}>
            Live
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>Conversations</h1>
          <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
            Chat or voice. Inbound and outbound calls are counted on the control plane.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => start("chat")}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 8,
              backgroundColor: NAVY, color: "#ffffff",
              border: `2px solid ${NAVY}`, boxShadow: "3px 3px 0px #000000",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            <MessageSquare size={15} /> New chat
          </button>
          <button
            onClick={() => start("inbound")}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 8,
              backgroundColor: "#ffffff", color: NAVY,
              border: `2px solid ${NAVY}`, boxShadow: "3px 3px 0px #000000",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            <Phone size={15} /> Inbound
          </button>
          <button
            onClick={() => start("outbound")}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 8,
              backgroundColor: "#ffffff", color: NAVY,
              border: `2px solid ${NAVY}`, boxShadow: "3px 3px 0px #000000",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            <PhoneOutgoing size={15} /> Outbound
          </button>
        </div>
      </header>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && (
          <div style={{
            padding: "32px", borderRadius: 10, textAlign: "center",
            border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            color: "#6b7fa0", fontSize: "0.875rem",
          }}>
            Start a chat or a call to see transcripts here.
          </div>
        )}

        {items.map((c) => {
          const statusStyle = STATUS_COLORS[c.status] ?? STATUS_COLORS.default;
          return (
            <Link
              key={c.id}
              href={`/conversations/${c.id}`}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 16,
                padding: "14px 18px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
                textDecoration: "none", transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = NAVY)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                {/* Channel icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  backgroundColor: "#f0f3f8", display: "grid", placeItems: "center", color: NAVY,
                }}>
                  <ChannelIcon channel={c.channel} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: NAVY,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.lead?.name || "Unknown visitor"}
                    {c.lead?.company ? ` · ${c.lead.company}` : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
                      borderRadius: 99, textTransform: "capitalize",
                      backgroundColor: statusStyle.bg, color: statusStyle.color,
                    }}>
                      {c.status}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7fa0", textTransform: "capitalize" }}>
                      {c.channel} · {c._count.messages} messages
                    </span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#6b7fa0", flexShrink: 0 }}>
                {new Date(c.updatedAt).toLocaleString()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}