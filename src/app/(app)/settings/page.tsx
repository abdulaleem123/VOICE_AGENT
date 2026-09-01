"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<{ openaiConfigured: boolean; models: Record<string, string> } | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setMeta(d);
      });
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved("Saved");
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Workspace</p>
        <h1 className="text-3xl font-semibold mt-1">Settings</h1>
      </header>

      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <label>Company name</label>
          <input value={settings.company_name || ""} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
        </div>
        <div>
          <label>Website</label>
          <input value={settings.company_website || ""} onChange={(e) => setSettings({ ...settings, company_website: e.target.value })} />
        </div>
        <div>
          <label>Timezone</label>
          <input value={settings.timezone || "UTC"} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
        </div>
        <div>
          <label>Default meeting length (minutes)</label>
          <input value={settings.meeting_duration || "30"} onChange={(e) => setSettings({ ...settings, meeting_duration: e.target.value })} />
        </div>
        <div>
          <label>Notify email</label>
          <input value={settings.notify_email || ""} onChange={(e) => setSettings({ ...settings, notify_email: e.target.value })} />
        </div>
        <button onClick={save} className="bg-[#2ee6c8] text-[#06211c] px-4 py-2 rounded-xl font-semibold">
          Save settings
        </button>
        {saved ? <span className="ml-3 text-sm text-[var(--accent)]">{saved}</span> : null}
      </section>

      <section className="glass rounded-2xl p-5 space-y-2 text-sm">
        <h2 className="font-medium text-base">OpenAI</h2>
        <p className="text-[var(--muted)]">
          Chat, embeddings, Whisper, and TTS all use <code className="text-[var(--accent)]">OPENAI_API_KEY</code> from your <code>.env</code> file. This product is single-tenant — there is no org switcher.
        </p>
        <p>Key: {meta?.openaiConfigured ? "configured" : "missing — paste it in .env and restart"}</p>
        <p>Chat model: {meta?.models.chat}</p>
        <p>Voice model: {meta?.models.tts}</p>
        <p>Speech-to-text: {meta?.models.stt}</p>
      </section>
    </div>
  );
}
