"use client";

import { useEffect, useState } from "react";

type Doc = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  preview?: string;
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setDocs(data.docs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/knowledge", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Indexed ${file.name}` : data.error || "Upload failed");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">Grounding</p>
        <h1 className="text-3xl font-semibold mt-1">Knowledge base</h1>
        <p className="text-[var(--muted)] mt-2">PDF, DOC/DOCX, and TXT. The agent answers from these files.</p>
      </header>

      <label className="glass rounded-2xl p-10 grid place-items-center cursor-pointer border-dashed">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <p className="font-medium">{busy ? "Reading & embedding…" : "Drop or choose a PDF, DOC, or TXT"}</p>
        <p className="text-sm text-[var(--muted)] mt-1">Files are parsed and stored for retrieval in every conversation.</p>
      </label>
      {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}

      <div className="space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{d.filename}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {(d.size / 1024).toFixed(1)} KB · {new Date(d.createdAt).toLocaleString()}
              </p>
              {d.preview ? <p className="text-sm text-[var(--muted)] mt-2 line-clamp-2">{d.preview}</p> : null}
            </div>
            <button onClick={() => remove(d.id)} className="text-sm text-[#ff6b7a]">
              Remove
            </button>
          </div>
        ))}
        {docs.length === 0 ? <p className="text-[var(--muted)]">No documents yet.</p> : null}
      </div>
    </div>
  );
}
