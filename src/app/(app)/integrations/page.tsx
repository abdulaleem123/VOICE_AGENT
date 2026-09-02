"use client";

import { useEffect, useState } from "react";

export default function IntegrationsPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [envConfigured, setEnvConfigured] = useState<Record<string, boolean>>({});
  const [dispatchApiUrl, setDispatchApiUrl] = useState("http://localhost:8000");
  const [saved, setSaved] = useState("");
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
      const res = await fetch(`${dispatchApiUrl}/health`);
      const data = await res.json();
      setHealth(res.ok ? `OK · agent ${data.agent} · trunk ${data.outbound_trunk}` : "Unreachable");
    } catch {
      setHealth("Offline — start desktop/api.py");
    }
  }

  const fields: { key: string; label: string; hint: string }[] = [
    { key: "livekit_url", label: "LiveKit URL", hint: "wss://….livekit.cloud" },
    { key: "livekit_api_key", label: "LiveKit API key", hint: "Stored in settings / .env" },
    { key: "livekit_api_secret", label: "LiveKit API secret", hint: "Never commit to git" },
    { key: "inbound_trunk_id", label: "Inbound trunk ID", hint: "ST_…" },
    { key: "outbound_trunk_id", label: "Outbound trunk ID", hint: "ST_…" },
    { key: "telnyx_phone_number", label: "Telnyx / SIP number", hint: "+1…" },
    { key: "agent_worker_name", label: "Desktop agent name", hint: "voice-agent-desktop" },
    { key: "desktop_worker_key", label: "Desktop worker key", hint: "Shared with DESKTOP_WORKER_KEY" },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Third-party</p>
        <h1 className="text-3xl font-semibold mt-1">Integrations</h1>
        <p className="text-[var(--muted)] mt-2">
          LiveKit + SIP trunks power desktop inbound/outbound. OpenAI remains the LLM/voice brain.
        </p>
      </header>

      <section className="glass rounded-2xl p-5 grid sm:grid-cols-3 gap-3 text-sm">
        <p>LiveKit env: {envConfigured.livekit ? "ready" : "missing"}</p>
        <p>OpenAI env: {envConfigured.openai ? "ready" : "missing"}</p>
        <p>Outbound trunk env: {envConfigured.outboundTrunk ? "ready" : "missing"}</p>
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            <input
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.hint}
            />
          </div>
        ))}
        <div>
          <label>Dispatch API URL</label>
          <input value={dispatchApiUrl} onChange={(e) => setDispatchApiUrl(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={save} className="bg-[#2ee6c8] text-[#06211c] px-4 py-2 rounded-xl font-semibold">
            Save integrations
          </button>
          <button onClick={pingDispatch} className="bg-white/8 px-4 py-2 rounded-xl">
            Ping dispatch API
          </button>
          {saved ? <span className="text-sm text-[var(--accent)]">{saved}</span> : null}
        </div>
        {health ? <p className="text-sm text-[var(--muted)]">{health}</p> : null}
      </section>

      <section className="glass rounded-2xl p-5 text-sm text-[var(--muted)] space-y-2">
        <p className="text-white font-medium">Desktop staging (low latency)</p>
        <p>1. `cd desktop && pip install -r requirements.txt`</p>
        <p>2. `python agent.py start`</p>
        <p>3. `python token_server.py` → http://localhost:3001</p>
        <p>4. `python api.py` → outbound dials at http://localhost:8000/docs</p>
      </section>
    </div>
  );
}
