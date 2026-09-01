"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  portal,
  title,
  subtitle,
  accent,
}: {
  portal: "user" | "admin";
  title: string;
  subtitle: string;
  accent: "cyan" | "amber";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  const glow = accent === "amber" ? "rgba(245, 185, 66, 0.2)" : "rgba(46, 230, 200, 0.2)";
  const btn = accent === "amber" ? "bg-[#f5b942] text-[#1a1408]" : "bg-[#2ee6c8] text-[#06211c]";

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-8 w-full max-w-md" style={{ boxShadow: `0 20px 80px ${glow}` }}>
      <div className="mb-8">
        <p className="text-xs tracking-[0.22em] uppercase text-[var(--muted)] mb-2">
          {portal === "admin" ? "Control plane" : "Operator workspace"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-[var(--muted)] mt-2 leading-relaxed">{subtitle}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="username" />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
        </div>
        {error ? <p className="text-[#ff6b7a] text-sm">{error}</p> : null}
        <button disabled={busy} className={`${btn} w-full rounded-xl py-3 font-semibold disabled:opacity-60`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
