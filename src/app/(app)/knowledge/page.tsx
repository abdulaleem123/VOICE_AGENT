"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";

type Doc = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  preview?: string;
};

const NAVY = "#0a1628";

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function load() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setDocs(data.docs || []);
  }

  useEffect(() => { load(); }, []);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 28, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#1e56cc", margin: 0 }}>
          Grounding
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: NAVY, margin: "4px 0 0" }}>
          Knowledge base
        </h1>
        <p style={{ color: "#6b7fa0", marginTop: 6, fontSize: "0.9rem" }}>
          PDF, DOC/DOCX, and TXT. The agent answers from these files.
        </p>
      </header>

      {/* Upload dropzone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        style={{
          display: "grid",
          placeItems: "center",
          padding: "48px 24px",
          borderRadius: 10,
          border: `2px dashed ${dragOver ? NAVY : "#c8d3e8"}`,
          backgroundColor: dragOver ? "rgba(10,22,40,0.04)" : "#ffffff",
          backgroundImage: dragOver ? "none" : "radial-gradient(circle at 1px 1px, #ced3de 1px, transparent 0)",
          backgroundSize: "24px 24px",
          cursor: busy ? "not-allowed" : "pointer",
          transition: "border-color 0.2s, background-color 0.2s",
          textAlign: "center",
        }}
      >
        <input
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          disabled={busy}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            backgroundColor: NAVY, display: "grid", placeItems: "center",
          }}>
            <UploadCloud size={24} color="#ffffff" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: NAVY }}>
              {busy ? "Reading & embedding…" : "Drop or choose a file"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#6b7fa0" }}>
              PDF, DOC, DOCX, or TXT  parsed and stored for retrieval in every conversation.
            </p>
          </div>
          {!busy && (
            <span style={{
              display: "inline-block", marginTop: 4,
              padding: "8px 20px", borderRadius: 8,
              backgroundColor: NAVY, color: "#ffffff",
              fontSize: "0.82rem", fontWeight: 700,
              border: `2px solid ${NAVY}`,
              boxShadow: "3px 3px 0px #000000",
            }}>
              Browse files
            </span>
          )}
        </div>
      </label>

      {/* Status message */}
      {msg && (
        <p style={{ fontSize: "0.875rem", color: NAVY, fontWeight: 600, margin: 0 }}>
          ✓ {msg}
        </p>
      )}

      {/* Documents list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {docs.length === 0 && (
          <div style={{
            padding: "32px", borderRadius: 10,
            border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            textAlign: "center", color: "#6b7fa0", fontSize: "0.875rem",
          }}>
            No documents yet. Upload a file above to get started.
          </div>
        )}

        {docs.map((d) => (
          <div
            key={d.id}
            style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 16,
              padding: "16px 18px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
              {/* File icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                backgroundColor: "#f0f3f8",
                display: "grid", placeItems: "center",
              }}>
                <FileText size={18} color={NAVY} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: NAVY,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.filename}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "#6b7fa0" }}>
                  {(d.size / 1024).toFixed(1)} KB · {new Date(d.createdAt).toLocaleString()}
                </p>
                {d.preview && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#6b7fa0",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.preview}
                  </p>
                )}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={() => remove(d.id)}
              title="Remove document"
              style={{
                flexShrink: 0, background: "transparent", border: "none",
                cursor: "pointer", padding: 6, borderRadius: 6,
                color: "#c0cad8", display: "grid", placeItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#d93025")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#c0cad8")}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}