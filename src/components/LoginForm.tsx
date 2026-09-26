"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NAVY = "#1e56cc";

export function LoginForm({
  portal, title, subtitle, accent,
}: {
  portal: "user" | "admin";
  title: string;
  subtitle: string;
  accent: "cyan" | "amber";
}) {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res  = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Login failed"); return; }
    router.push(data.redirect);
    router.refresh();
  }

  const btnBg =
    accent === "amber"
      ? { backgroundColor: "#ffffff", color: NAVY, border: `1.5px solid ${NAVY}` }
      : { backgroundColor: NAVY,      color: "#ffffff", border: `1.5px solid ${NAVY}` };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: `1.5px solid #c8d5ee`, backgroundColor: "#f4f7ff",
    color: NAVY, fontSize: "0.95rem", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.72rem", fontWeight: 700,
    color: NAVY, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7,
  };

  return (
    <form onSubmit={onSubmit} className="w-full"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#1e56cc", marginBottom: 8, fontWeight: 600 }}>
          {portal === "admin" ? "Control plane" : "Operator workspace"}
        </p>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 700, color: NAVY,
          margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p style={{ color: "#4a6080", marginTop: 8, lineHeight: 1.6, fontSize: "0.9rem" }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" required autoComplete="username"
            placeholder="you@company.com" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.boxShadow = `0 0 0 3px rgba(30,86,204,0.12)`; e.target.style.backgroundColor = "#ffffff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#c8d5ee"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f4f7ff"; }}
          />
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" required autoComplete="current-password"
            placeholder="••••••••" style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = NAVY; e.target.style.boxShadow = `0 0 0 3px rgba(30,86,204,0.12)`; e.target.style.backgroundColor = "#ffffff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#c8d5ee"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#f4f7ff"; }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: "#d93025", fontSize: "0.85rem", margin: 0,
            display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠</span> {error}
          </p>
        )}

        {/* Submit */}
        <button
          disabled={busy}
          style={{
            ...btnBg,
            width: "100%",
            padding: "13px",
            borderRadius: 8,
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
            letterSpacing: "0.02em",
            marginTop: 4,
            transition: "opacity 0.2s, background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!busy && accent !== "amber") {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1648b0";
            }
          }}
          onMouseLeave={(e) => {
            if (!busy && accent !== "amber") {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = NAVY;
            }
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

      </div>
    </form>
  );
}