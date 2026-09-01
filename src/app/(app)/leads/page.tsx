"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  persona: string | null;
  status: string;
  source: string;
  askCount: number;
  createdAt: string;
  _count: { conversations: number; meetings: number; handoffs: number };
};

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Pipeline</p>
        <h1 className="text-3xl font-semibold mt-1">Leads</h1>
        <p className="text-[var(--muted)] mt-2">
          Persona is classified from titles you set on the agent (CEO, CFO, CTO, …). Qualification ask count is stored per lead.
        </p>
      </header>
      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr>
              {["Name", "Company", "Email", "Persona", "Status", "Asks", "Source"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t border-white/6">
                <td className="px-4 py-3">{l.name || "—"}</td>
                <td className="px-4 py-3">{l.company || "—"}</td>
                <td className="px-4 py-3">{l.email || "—"}</td>
                <td className="px-4 py-3">{l.persona || l.title || "unclassified"}</td>
                <td className="px-4 py-3 capitalize">{l.status.replace("_", " ")}</td>
                <td className="px-4 py-3">{l.askCount}</td>
                <td className="px-4 py-3 capitalize">{l.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="p-4 text-[var(--muted)]">Leads appear as the agent captures name and company.</p> : null}
      </div>
    </div>
  );
}
