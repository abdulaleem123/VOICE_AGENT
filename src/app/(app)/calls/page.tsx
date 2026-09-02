"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";

type CallRow = {
  id: string;
  direction: string;
  status: string;
  outcome: string;
  duration: number;
  phoneNumber: string | null;
  contactName: string | null;
  tokensIn: number;
  tokensOut: number;
  createdAt: string;
};

type CallsData = {
  logs: CallRow[];
  inbound: number;
  outbound: number;
  answered: number;
  missed: number;
  failed: number;
  pickupRate: number;
};

export default function CallsPage() {
  const [data, setData] = useState<CallsData | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [outcome, setOutcome] = useState("answered");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/calls");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function logCall(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        outcome,
        status: outcome === "answered" ? "completed" : "ended",
        phoneNumber: phone,
        contactName: name,
        duration: outcome === "answered" ? 90 : 0,
      }),
    });
    setBusy(false);
    setMsg(res.ok ? "Call logged" : "Failed to log call");
    setPhone("");
    setName("");
    load();
  }

  async function queueOutbound() {
    setBusy(true);
    setMsg("");
    const dispatchUrl = (await fetch("/api/integrations").then((r) => r.json())).dispatchApiUrl || "http://localhost:8000";
    try {
      const res = await fetch(`${dispatchUrl}/call/outbound`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: { phone_number: phone, contact_name: name || "Contact", company_name: "" },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? data.message || "Outbound queued via desktop worker" : data.detail || "Dispatch API not reachable — start desktop/api.py");
    } catch {
      setMsg("Dispatch API offline. Run: cd desktop && python api.py");
    }
    setBusy(false);
    load();
  }

  if (!data) return <p className="text-[var(--muted)]">Loading calls…</p>;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Telephony</p>
        <h1 className="text-3xl font-semibold mt-1">Inbound & outbound</h1>
        <p className="text-[var(--muted)] mt-2">
          Pickup vs miss metrics, desktop LiveKit sessions, and SaaS call logging.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Inbound" value={data.inbound} />
        <StatCard label="Outbound" value={data.outbound} />
        <StatCard label="Picked up" value={data.answered} hint="Answered calls" />
        <StatCard label="Not picked up" value={data.missed} hint="Missed / no answer" />
        <StatCard label="Pickup rate" value={`${data.pickupRate}%`} />
      </section>

      <form onSubmit={logCall} className="glass rounded-2xl p-5 grid md:grid-cols-5 gap-3">
        <div>
          <label>Direction</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as "inbound" | "outbound")}>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </div>
        <div>
          <label>Outcome</label>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="answered">Picked up</option>
            <option value="missed">Not picked up</option>
            <option value="no_answer">No answer</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label>Contact</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
        </div>
        <div>
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={busy} className="bg-[#2ee6c8] text-[#06211c] px-4 py-2.5 rounded-xl font-semibold">
            Log call
          </button>
          <button type="button" disabled={busy || !phone} onClick={queueOutbound} className="bg-white/8 px-4 py-2.5 rounded-xl">
            Dial (LiveKit)
          </button>
        </div>
      </form>
      {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}

      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr>
              {["When", "Dir", "Contact", "Phone", "Outcome", "Duration", "Tokens in/out"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.logs.map((l) => (
              <tr key={l.id} className="border-t border-white/6">
                <td className="px-4 py-3 text-xs text-[var(--muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{l.direction}</td>
                <td className="px-4 py-3">{l.contactName || "—"}</td>
                <td className="px-4 py-3">{l.phoneNumber || "—"}</td>
                <td className="px-4 py-3 capitalize">{l.outcome.replace("_", " ")}</td>
                <td className="px-4 py-3">{l.duration}s</td>
                <td className="px-4 py-3">
                  {l.tokensIn}/{l.tokensOut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.logs.length === 0 ? <p className="p-4 text-[var(--muted)]">No calls yet.</p> : null}
      </div>
    </div>
  );
}
