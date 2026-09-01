"use client";

import { useEffect, useState } from "react";

type Meeting = {
  id: string;
  title: string;
  reason: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  notes: string | null;
  meetLink: string | null;
  lead?: { name?: string | null; company?: string | null; email?: string | null } | null;
};

export default function MeetingsPage() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("Discovery call");
  const [reason, setReason] = useState("discovery");
  const [when, setWhen] = useState("");

  async function load() {
    const res = await fetch("/api/meetings");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, reason, scheduledAt: when }),
    });
    setWhen("");
    load();
  }

  async function patch(id: string, status: string) {
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Calendar</p>
        <h1 className="text-3xl font-semibold mt-1">Meeting</h1>
        <p className="text-[var(--muted)] mt-2">
          Pricing and NDA threads should land here as booked follow-ups instead of being handled live on the agent call.
        </p>
      </header>

      <form onSubmit={create} className="glass rounded-2xl p-5 grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="pricing">Pricing</option>
            <option value="nda">NDA</option>
            <option value="demo">Demo</option>
            <option value="discovery">Discovery</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>When</label>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </div>
        <div className="md:col-span-4">
          <button className="bg-[#2ee6c8] text-[#06211c] px-4 py-2 rounded-xl font-semibold">Schedule</button>
        </div>
      </form>

      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                {new Date(m.scheduledAt).toLocaleString()} · {m.durationMin} min · {m.reason}
                {m.lead?.name ? ` · ${m.lead.name}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs capitalize text-[var(--muted)]">{m.status}</span>
              {m.status === "scheduled" ? (
                <button onClick={() => patch(m.id, "completed")} className="text-xs px-3 py-1 rounded-lg bg-white/8">
                  Complete
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="text-[var(--muted)]">No meetings yet.</p> : null}
      </div>
    </div>
  );
}
