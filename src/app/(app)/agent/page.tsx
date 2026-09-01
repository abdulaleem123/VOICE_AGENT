"use client";

import { useEffect, useState } from "react";
import { VoicePicker } from "@/components/VoicePicker";
import { DEFAULT_TITLES, TONES } from "@/lib/voices";

type Agent = {
  name: string;
  tone: string;
  description: string;
  targetTitles: string[];
  qualificationRounds: number;
  collectName: boolean;
  collectCompany: boolean;
  collectEmail: boolean;
  emailRequiredOnChat: boolean;
  voiceId: string;
  greeting: string;
};

const empty: Agent = {
  name: "Aria",
  tone: "professional",
  description: "",
  targetTitles: DEFAULT_TITLES,
  qualificationRounds: 3,
  collectName: true,
  collectCompany: true,
  collectEmail: true,
  emailRequiredOnChat: false,
  voiceId: "nova",
  greeting: "",
};

export default function AgentPage() {
  const [agent, setAgent] = useState<Agent>(empty);
  const [titleInput, setTitleInput] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((d) => setAgent({ ...empty, ...d }));
  }, []);

  function addTitle() {
    const t = titleInput.trim();
    if (!t || agent.targetTitles.includes(t)) return;
    setAgent({ ...agent, targetTitles: [...agent.targetTitles, t] });
    setTitleInput("");
  }

  async function save() {
    setBusy(true);
    setSaved("");
    const res = await fetch("/api/agent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });
    setBusy(false);
    setSaved(res.ok ? "Saved" : "Could not save");
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Your agent</p>
          <h1 className="text-3xl font-semibold mt-1">Agent configuration</h1>
          <p className="text-[var(--muted)] mt-2">Name, tone, persona targets, qualification asks, voice, and greeting — all yours.</p>
        </div>
        <button onClick={save} disabled={busy} className="bg-[#2ee6c8] text-[#06211c] px-5 py-2.5 rounded-xl font-semibold">
          {busy ? "Saving…" : "Save agent"}
        </button>
      </header>
      {saved ? <p className="text-sm text-[var(--accent)]">{saved}</p> : null}

      <section className="glass rounded-2xl p-6 grid md:grid-cols-2 gap-5">
        <div>
          <label>Agent name</label>
          <input value={agent.name} onChange={(e) => setAgent({ ...agent, name: e.target.value })} />
        </div>
        <div>
          <label>Agent tone</label>
          <select value={agent.tone} onChange={(e) => setAgent({ ...agent, tone: e.target.value })}>
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label>Agent description</label>
          <textarea
            rows={4}
            value={agent.description}
            onChange={(e) => setAgent({ ...agent, description: e.target.value })}
            placeholder="Who this agent is, how they sell, and what they should never do."
          />
        </div>
        <div className="md:col-span-2">
          <label>Greeting</label>
          <textarea rows={2} value={agent.greeting} onChange={(e) => setAgent({ ...agent, greeting: e.target.value })} />
        </div>
      </section>

      <section className="glass rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium">Target titles / personas</h2>
          <p className="text-sm text-[var(--muted)]">Used by Leads to classify CEO, CFO, CTO, and anyone you add.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agent.targetTitles.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAgent({ ...agent, targetTitles: agent.targetTitles.filter((x) => x !== t) })}
              className="px-3 py-1.5 rounded-full bg-white/8 text-sm"
            >
              {t} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Add title e.g. Head of Finance"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTitle())}
          />
          <button type="button" onClick={addTitle} className="px-4 rounded-xl border border-white/10">
            Add
          </button>
        </div>
      </section>

      <section className="glass rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-medium">Qualification asks</h2>
          <p className="text-sm text-[var(--muted)]">
            Ask 1, 2, or 3 times for details. Name and company always matter. Email is mentioned, but on chat it can stay optional.
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAgent({ ...agent, qualificationRounds: n })}
              className={`px-4 py-2 rounded-xl ${agent.qualificationRounds === n ? "bg-[#2ee6c8] text-[#06211c]" : "bg-white/8"}`}
            >
              Ask {n}×
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["collectName", "Collect name"],
            ["collectCompany", "Collect company"],
            ["collectEmail", "Mention / collect email"],
            ["emailRequiredOnChat", "Require email even on chat"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 normal-case tracking-normal text-sm text-white !mt-0">
              <input
                type="checkbox"
                className="w-auto"
                checked={Boolean(agent[key as keyof Agent])}
                onChange={(e) => setAgent({ ...agent, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-medium mb-1">OpenAI voice avatar</h2>
        <p className="text-sm text-[var(--muted)] mb-5">Pick the female or male voice the agent should sound like.</p>
        <VoicePicker value={agent.voiceId} onChange={(voiceId) => setAgent({ ...agent, voiceId })} />
      </section>
    </div>
  );
}
