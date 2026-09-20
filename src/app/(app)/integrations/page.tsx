"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Save, Radio } from "lucide-react";

const NAVY = "#0a1628";

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

function PressButton({
  onClick, filled = true, children,
}: { onClick: () => void; filled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 22px", borderRadius: 8,
        border: `2px solid ${NAVY}`,
        backgroundColor: filled ? NAVY : "#ffffff",
        color: filled ? "#ffffff" : NAVY,
        fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
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
      {children}
    </button>
  );
}

export default function IntegrationsPage() {
  const [form, setForm]                   = useState<Record<string, string>>({});
  const [envConfigured, setEnvConfigured] = useState<Record<string, boolean>>({});
  const [dispatchApiUrl, setDispatchApiUrl] = useState("http://localhost:8000");
  const [saved, setSaved]   = useState("");
  const [health, setHealth] = useState("");

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => {
        setForm(d.integrations || {});
        setEnvConfigured(d.envConfigured || {});
        setDispatchApiUrl(d.dispatchApiUrl || "http://localhost:8000");
      });
  }, []);

  async function save() {
    await fetch("/api/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dispatch_api_url: dispatchApiUrl }),
    });
    setSaved("Saved");
  }

  async function pingDispatch() {
    try {
      const res  = await fetch(`${dispatchApiUrl}/health`);
      const data = await res.json();
      setHealth(res.ok
        ? `OK · agent ${data.agent} · trunk ${data.outbound_trunk}`
        : "Unreachable");
    } catch {
      setHealth("Offline  start desktop/api.py");
    }
  }

  const fields: { key: string; label: string; hint: string }[] = [
    { key: "livekit_url",         label: "LiveKit URL",          hint: "wss://….livekit.cloud" },
    { key: "livekit_api_key",     label: "LiveKit API key",      hint: "Stored in settings / .env" },
    { key: "livekit_api_secret",  label: "LiveKit API secret",   hint: "Never commit to git" },
    { key: "inbound_trunk_id",    label: "Inbound trunk ID",     hint: "ST_…" },
    { key: "outbound_trunk_id",   label: "Outbound trunk ID",    hint: "ST_…" },
    { key: "telnyx_phone_number", label: "Telnyx / SIP number",  hint: "+1…" },
    { key: "agent_worker_name",   label: "Desktop agent name",   hint: "voice-agent-desktop" },
    { key: "desktop_worker_key",  label: "Desktop worker key",   hint: "Shared with DESKTOP_WORKER_KEY" },
  ];

  const statusItems = [
    { label: "LiveKit env",       ok: envConfigured.livekit       },
    { label: "OpenAI env",        ok: envConfigured.openai        },
    { label: "Outbound trunk env",ok: envConfigured.outboundTrunk },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#1e56cc", margin: 0, fontWeight: 600 }}>
          Third-party
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Integrations
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          LiveKit + SIP trunks power desktop inbound/outbound. OpenAI remains the LLM/voice brain.
        </p>
      </header>

      {/* Status cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {statusItems.map(({ label, ok }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 10,
            backgroundColor: "#ffffff", border: "1.5px solid #e2e8f0",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              backgroundColor: ok ? "#e3fcef" : "#fce8f3",
              display: "grid", placeItems: "center" }}>
              {ok
                ? <CheckCircle size={18} color="#057a55" />
                : <XCircle    size={18} color="#bf125d" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#6b7fa0" }}>{label}</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem",
                color: ok ? "#057a55" : "#bf125d" }}>
                {ok ? "Ready" : "Missing"}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Fields form */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px" }}>
        <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Configuration
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input
                style={inputStyle}
                value={form[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.hint}
                onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
              />
            </div>
          ))}
        </div>

        {/* Dispatch URL  full width */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Dispatch API URL</label>
          <input
            style={inputStyle}
            value={dispatchApiUrl}
            onChange={(e) => setDispatchApiUrl(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <PressButton onClick={save} filled>
            <Save size={15} /> Save integrations
          </PressButton>
          <PressButton onClick={pingDispatch} filled={false}>
            <Radio size={15} /> Ping dispatch API
          </PressButton>
          {saved && (
            <span style={{ fontSize: "0.875rem", color: "#057a55", fontWeight: 700 }}>
              ✓ {saved}
            </span>
          )}
        </div>

        {health && (
          <p style={{ marginTop: 12, fontSize: "0.875rem", color: "#6b7fa0" }}>
            {health}
          </p>
        )}
      </section>

      {/* Desktop staging */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px" }}>
        <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          Desktop staging (low latency)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "cd desktop && pip install -r requirements.txt",
            "python agent.py start",
            "python token_server.py  →  http://localhost:3001",
            "python api.py  →  outbound dials at http://localhost:8000/docs",
          ].map((cmd, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: NAVY,
                color: "#ffffff", display: "grid", placeItems: "center",
                fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </span>
              <code style={{ backgroundColor: "#f7f9fc", border: "1px solid #e2e8f0",
                borderRadius: 6, padding: "4px 10px", fontSize: "0.8rem",
                color: NAVY, fontFamily: "monospace", lineHeight: 1.6 }}>
                {cmd}
              </code>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}