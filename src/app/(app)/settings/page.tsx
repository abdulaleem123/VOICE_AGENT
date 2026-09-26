"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, XCircle } from "lucide-react";

const NAVY = "#0a1628";
const ACCENT = "#1e56cc";

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
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .pop-in { animation: popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .btn-anim { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-anim:hover { transform: translateY(-2px); }
  .btn-anim:active { transform: translateY(0px) scale(0.97); }
`;

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
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 28,
      fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{ANIM_STYLES}</style>

      {/* Header */}
      <header className="rise-in" style={{ animationDelay: "0ms" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: ACCENT, margin: 0, fontWeight: 600 }}>
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
      <section className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px", animationDelay: "80ms" }}>
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
                onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f7f9fc"; }}
              />
            </div>
          ))}
        </div>

        {/* Save button  single accent color */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={save}
            className="btn-anim"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 22px", borderRadius: 8,
              border: `1.5px solid ${ACCENT}`, backgroundColor: ACCENT,
              color: "#ffffff", fontWeight: 700, fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <Save size={15} /> Save settings
          </button>
          {saved && (
            <span className="pop-in" style={{ fontSize: "0.875rem", color: "#057a55", fontWeight: 700 }}>
              ✓ {saved}
            </span>
          )}
        </div>
      </section>

      {/* OpenAI info */}
      <section className="rise-in" style={{ backgroundColor: "#ffffff", borderRadius: 10,
        border: "1.5px solid #e2e8f0", padding: "24px", animationDelay: "160ms" }}>
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
        <div className="pop-in" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "14px 18px", borderRadius: 10, animationDelay: "220ms",
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
            <div key={label} className="row-in" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < modelRows.length - 1 ? "1px solid #f0f3f8" : "none",
              backgroundColor: "#ffffff",
              animationDelay: `${260 + i * 40}ms`,
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