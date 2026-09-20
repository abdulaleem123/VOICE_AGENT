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
  shortReplies: boolean;
  humanizedTone: boolean;
  interruptionEnabled: boolean;
  autoPauseEnabled: boolean;
  noiseCancelEnabled: boolean;
  lowLatencyMode: boolean;
  vadSilenceMs: number;
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
  voiceId: "shimmer",
  greeting: "",
  shortReplies: true,
  humanizedTone: true,
  interruptionEnabled: true,
  autoPauseEnabled: true,
  noiseCancelEnabled: true,
  lowLatencyMode: true,
  vadSilenceMs: 300,
};

const inputClass =
  "!bg-white !border !border-gray-200 !text-gray-900 rounded-[10px] px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-[#1e56cc]/40";

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
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
            Your agent
          </p>
          <h1 className="text-3xl font-semibold mt-1 text-gray-900">
            Agent configuration
          </h1>
          <p className="text-gray-500 mt-2">
            Name, tone, persona targets, qualification asks, voice, and greeting 
            all yours.
          </p>
        </div>
        <button
          onClick={save}
          disabled={busy}
          style={{
            padding: "10px 22px", borderRadius: 8,
            border: "2px solid #0a1628", backgroundColor: "#1e56cc",
            color: "#000000", fontWeight: 700, fontSize: "0.9rem",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
            boxShadow: busy ? "none" : "3px 3px 0px #000000",
            transition: "opacity 0.2s, box-shadow 0.1s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!busy) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px, 2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "1px 1px 0px #000000";
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(0, 0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0px #000000";
            }
          }}
        >
          {busy ? "Saving…" : "Save agent"}
        </button>
      </header>

      {saved ? <p className="text-sm text-[var(--accent)]">{saved}</p> : null}

      {/* Basic info */}
      <section className="bg-white rounded-[10px] p-6 grid md:grid-cols-2 gap-5 shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Agent name
          </label>
          <input
            className={inputClass}
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Agent tone
          </label>
          <select
            className={inputClass}
            value={agent.tone}
            onChange={(e) => setAgent({ ...agent, tone: e.target.value })}
          >
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Agent description
          </label>
          <textarea
            className={inputClass}
            rows={4}
            value={agent.description}
            onChange={(e) => setAgent({ ...agent, description: e.target.value })}
            placeholder="Who this agent is, how they sell, and what they should never do."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Greeting
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={agent.greeting}
            onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
          />
        </div>
      </section>

      {/* Target titles */}
      <section className="bg-white rounded-[10px] p-6 space-y-4 shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Target titles / personas
          </h2>
          <p className="text-sm text-gray-500">
            Used by Leads to classify CEO, CFO, CTO, and anyone you add.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agent.targetTitles.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setAgent({ ...agent, targetTitles: agent.targetTitles.filter((x) => x !== t) })
              }
              className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-800 hover:bg-gray-200"
            >
              {t} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Add title e.g. Head of Finance"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTitle())}
          />
          <button
            type="button"
            onClick={addTitle}
            className="px-4 rounded-[10px] border border-gray-200 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </section>

      {/* Qualification asks */}
      <section className="bg-white rounded-[10px] p-6 space-y-5 shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Qualification asks</h2>
          <p className="text-sm text-gray-500">
            Ask 1, 2, or 3 times for details. Name and company always matter.
            Email is mentioned, but on chat it can stay optional.
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAgent({ ...agent, qualificationRounds: n })}
              className={`px-4 py-2 rounded-[10px] ${
                agent.qualificationRounds === n
                  ? "bg-[#1e56cc] text-[#06211c]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Ask {n}×
            </button>
          ))}
        </div>
        {/* ── ONLY CHANGE: flex items-center + min-w-0 to fix alignment ── */}
        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8">
          {[
            ["collectName", "Collect name"],
            ["collectCompany", "Collect company"],
            ["collectEmail", "Mention / collect email"],
            ["emailRequiredOnChat", "Require email even on chat"],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex items-center gap-3 cursor-pointer select-none min-w-0"
              onClick={() =>
                setAgent({ ...agent, [key]: !Boolean(agent[key as keyof Agent]) })
              }
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#1e56cc]"
                checked={Boolean(agent[key as keyof Agent])}
                onChange={(e) => setAgent({ ...agent, [key]: e.target.checked })}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-gray-800 leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Voice quality */}
      <section className="bg-white rounded-[10px] p-6 space-y-4 shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Voice quality & desktop latency
          </h2>
          <p className="text-sm text-gray-500">
            Short humanized replies, barge-in, auto-pause, noise cancel  used by
            chat and the LiveKit desktop worker.
          </p>
        </div>
        {/* ── ONLY CHANGE: same checkbox fix ── */}
        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8">
          {(
            [
              ["shortReplies", "Short replies (1–2 sentences)"],
              ["humanizedTone", "Humanized tone"],
              ["interruptionEnabled", "Interruption / barge-in"],
              ["autoPauseEnabled", "Auto-pause on silence"],
              ["noiseCancelEnabled", "Noise cancellation"],
              ["lowLatencyMode", "Low-latency desktop mode"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center gap-3 cursor-pointer select-none min-w-0"
              onClick={() => setAgent({ ...agent, [key]: !Boolean(agent[key]) })}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#1e56cc]"
                checked={Boolean(agent[key])}
                onChange={(e) => setAgent({ ...agent, [key]: e.target.checked })}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm text-gray-800 leading-snug">{label}</span>
            </div>
          ))}
        </div>
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            VAD silence (ms)
          </label>
          <input
            className={inputClass}
            type="number"
            min={150}
            max={800}
            value={agent.vadSilenceMs}
            onChange={(e) =>
              setAgent({ ...agent, vadSilenceMs: Number(e.target.value) || 300 })
            }
          />
        </div>
      </section>

      {/* Voice picker */}
      <section className="bg-white rounded-[10px] p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium mb-1 text-gray-900">
          OpenAI voice avatar
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Pick the female or male voice the agent should sound like.
        </p>
        <VoicePicker
          value={agent.voiceId}
          onChange={(voiceId) => setAgent({ ...agent, voiceId })}
        />
      </section>
    </div>
  );
}