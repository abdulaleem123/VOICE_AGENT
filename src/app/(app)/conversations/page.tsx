"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  channel: string;
  status: string;
  updatedAt: string;
  lead?: { name?: string | null; company?: string | null } | null;
  _count: { messages: number };
};

export default function ConversationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function start(channel: "chat" | "inbound" | "outbound") {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const data = await res.json();
    router.push(`/conversations/${data.id}`);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Live</p>
          <h1 className="text-3xl font-semibold mt-1">Conversation</h1>
          <p className="text-[var(--muted)] mt-2">Chat or voice. Inbound and outbound calls are counted on the control plane.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => start("chat")} className="px-4 py-2 rounded-xl bg-[#2ee6c8] text-[#06211c] font-semibold">
            New chat
          </button>
          <button onClick={() => start("inbound")} className="px-4 py-2 rounded-xl bg-white/8">
            Inbound call
          </button>
          <button onClick={() => start("outbound")} className="px-4 py-2 rounded-xl bg-white/8">
            Outbound call
          </button>
        </div>
      </header>
      <div className="space-y-2">
        {items.map((c) => (
          <Link key={c.id} href={`/conversations/${c.id}`} className="glass rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{c.lead?.name || "Unknown visitor"} {c.lead?.company ? `· ${c.lead.company}` : ""}</p>
              <p className="text-xs text-[var(--muted)] capitalize mt-1">
                {c.channel} · {c.status} · {c._count.messages} messages
              </p>
            </div>
            <span className="text-xs text-[var(--muted)]">{new Date(c.updatedAt).toLocaleString()}</span>
          </Link>
        ))}
        {items.length === 0 ? <p className="text-[var(--muted)]">Start a chat or a call to see transcripts here.</p> : null}
      </div>
    </div>
  );
}
