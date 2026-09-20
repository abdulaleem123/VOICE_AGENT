"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, XCircle } from "lucide-react";

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<{ openaiConfigured: boolean; models: Record<string, string> } | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings || {}); setMeta(d); });
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved("Saved");
  }

  const fields: { key: string; label: string; placeholder?: string }[] = [
    { key: "company_name",    label: "Company name" },
    { key: "company_website", label: "Website",                   placeholder: "https://…" },
    { key: "timezone",        label: "Timezone",                  placeholder: "UTC" },
    { key: "meeting_duration",label: "Default meeting length (minutes)", placeholder: "30" },
    { key: "notify_email",    label: "Notify email",              placeholder: "you@company.com" },
  ];

  const modelRows = [
    { label: "Chat model",      value: meta?.models?.chat },
    { label: "Voice model",     value: meta?.models?.tts  },
    { label: "Speech-to-text",  value: meta?.models?.stt  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#1e56cc", margin: 0, fontWeight: 600 }}>
          Workspace
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Settings
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          Configure your workspace, models, and notification preferences.
        </p>
      </header>

      {/* Settings form */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px" }}>
        <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          General
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input
                style={inputStyle}
                value={settings[f.key] || ""}
                placeholder={f.placeholder}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
              />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={save}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 22px", borderRadius: 8,
              border: `2px solid ${NAVY}`, backgroundColor: NAVY,
              color: "#ffffff", fontWeight: 700, fontSize: "0.875rem",
              cursor: "pointer", boxShadow: "3px 3px 0px #000000",
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
            <Save size={15} /> Save settings
          </button>
          {saved && (
            <span style={{ fontSize: "0.875rem", color: "#057a55", fontWeight: 700 }}>
              ✓ {saved}
            </span>
          )}
        </div>
      </section>

      {/* OpenAI info */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px" }}>
        <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "0.9rem", color: NAVY }}>
          OpenAI
        </p>

        <p style={{ margin: "0 0 16px", fontSize: "0.875rem", color: "#6b7fa0", lineHeight: 1.6 }}>
          Chat, embeddings, Whisper, and TTS all use{" "}
          <code style={{ backgroundColor: "#f0f3f8", color: NAVY, padding: "2px 6px",
            borderRadius: 4, fontSize: "0.8rem", fontFamily: "monospace" }}>
            OPENAI_API_KEY
          </code>{" "}
          from your{" "}
          <code style={{ backgroundColor: "#f0f3f8", color: NAVY, padding: "2px 6px",
            borderRadius: 4, fontSize: "0.8rem", fontFamily: "monospace" }}>
            .env
          </code>{" "}
          file. This product is single-tenant  there is no org switcher.
        </p>

        {/* API key status */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "14px 18px", borderRadius: 10,
          backgroundColor: meta?.openaiConfigured ? "#e3fcef" : "#fce8f3",
          border: `1.5px solid ${meta?.openaiConfigured ? "#84e1bc" : "#f8b4d9"}` }}>
          {meta?.openaiConfigured
            ? <CheckCircle size={20} color="#057a55" />
            : <XCircle    size={20} color="#bf125d" />}
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem",
              color: meta?.openaiConfigured ? "#057a55" : "#bf125d" }}>
              API key {meta?.openaiConfigured ? "configured" : "missing"}
            </p>
            {!meta?.openaiConfigured && (
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#bf125d" }}>
                Paste it in .env and restart the server
              </p>
            )}
          </div>
        </div>

        {/* Model rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0,
          border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          {modelRows.map(({ label, value }, i) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < modelRows.length - 1 ? "1px solid #f0f3f8" : "none",
              backgroundColor: "#ffffff",
            }}>
              <span style={{ fontSize: "0.82rem", color: "#6b7fa0", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </span>
              <code style={{ backgroundColor: "#f0f3f8", color: NAVY, padding: "3px 10px",
                borderRadius: 6, fontSize: "0.8rem", fontFamily: "monospace", fontWeight: 600 }}>
                {value || ""}
              </code>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}