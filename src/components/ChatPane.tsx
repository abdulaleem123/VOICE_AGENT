// components/ChatPane.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/voices";
import { Mic, Send, Square, VolumeX } from "lucide-react";

type Msg  = { id: string; role: string; content: string };
type Conv = {
  id: string; channel: string; status: string; messages: Msg[];
  lead?: { name?: string | null; company?: string | null; email?: string | null; persona?: string | null } | null;
  handoffs?: { id: string; reason: string; status: string }[];
};

const NAVY = "#1e56cc";

export function ChatPane({ conversationId }: { conversationId: string }) {
  const [conv, setConv]           = useState<Conv | null>(null);
  const [voiceId, setVoiceId]     = useState("shimmer");
  const [text, setText]           = useState("");
  const [busy, setBusy]           = useState(false);
  const [mode, setMode]           = useState<"idle"|"listening"|"talking">("idle");
  const [speak, setSpeak]         = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [voiceQuality, setVoiceQuality] = useState({
    interruptionEnabled: true, autoPauseEnabled: true,
    noiseCancelEnabled: true,  lowLatencyMode: true,
  });
  const recRef      = useRef<MediaRecorder | null>(null);
  const chunks      = useRef<Blob[]>([]);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const bottom      = useRef<HTMLDivElement | null>(null);

  function stopSpeaking() {
    ttsAbortRef.current?.abort(); ttsAbortRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    setTtsLoading(false); setMode("idle");
  }

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}`);
    const data = await res.json();
    setConv(data.conversation); setVoiceId(data.voiceId || "shimmer");
  }

  useEffect(() => {
    load();
    fetch("/api/agent").then((r) => r.json()).then((d) =>
      setVoiceQuality({
        interruptionEnabled: d.interruptionEnabled !== false,
        autoPauseEnabled:    d.autoPauseEnabled    !== false,
        noiseCancelEnabled:  d.noiseCancelEnabled  !== false,
        lowLatencyMode:      d.lowLatencyMode      !== false,
      })
    ).catch(() => undefined);
    return () => stopSpeaking();
  }, [conversationId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages.length, busy]);

  async function playTTS(reply: string, vid: string) {
    if (!speak || !reply.trim()) return;
    stopSpeaking(); setTtsLoading(true);
    const ac = new AbortController(); ttsAbortRef.current = ac;
    try {
      const res = await fetch("/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, voiceId: vid }), signal: ac.signal,
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (ac.signal.aborted) return;
      const url = URL.createObjectURL(blob); audioUrlRef.current = url;
      const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => stopSpeaking();
      setTtsLoading(false); setMode("talking");
      await audio.play().catch(() => stopSpeaking());
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      stopSpeaking();
    }
  }

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    stopSpeaking(); setText(""); setBusy(true); setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: trimmed }),
      });
      let data: { error?: string; conversation?: Conv; reply?: string; voiceId?: string } = {};
      try { data = await res.json(); } catch { throw new Error("Server error  refresh and try again."); }
      if (!res.ok) throw new Error(data.error || "Chat failed  check OPENAI_API_KEY in .env");
      if (data.conversation) setConv(data.conversation);
      const vid = data.voiceId || voiceId;
      if (data.voiceId) setVoiceId(data.voiceId);
      void playTTS(data.reply || "", vid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong"); setText(trimmed);
    } finally { setBusy(false); }
  }

  async function toggleMic() {
    if (mode === "listening" && recRef.current) { recRef.current.stop(); return; }
    if ((mode === "talking" || ttsLoading) && voiceQuality.interruptionEnabled) stopSpeaking();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: voiceQuality.noiseCancelEnabled, autoGainControl: true },
    });
    const rec = new MediaRecorder(stream); chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); setMode("idle");
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      if (voiceQuality.autoPauseEnabled && blob.size < 1200) return;
      const form = new FormData(); form.append("audio", blob, "clip.webm");
      const res  = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (data.text) send(data.text);
    };
    recRef.current = rec; rec.start(); setMode("listening");
  }

  const voice      = getVoice(voiceId);
  const speaking   = mode === "talking" || ttsLoading;
  const chatClosed = conv?.status === "ended";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20,
      height: "calc(100vh - 8rem)", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Left sidebar  voice avatar panel ── */}
      <aside style={{
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        padding: 20, borderRadius: 10, border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
        backgroundImage: "radial-gradient(circle at 1px 1px, #ced3de 1px, transparent 0)",
        backgroundSize: "22px 22px", overflowY: "auto",
      }}>
        {/* Avatar orb */}
        <div className={`orb ${mode === "talking" ? "talking" : ""}`} style={{
          width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
          border: `3px solid ${speaking ? NAVY : "#e2e8f0"}`,
          transition: "border-color 0.3s",
          flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={voice.avatar} alt={voice.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <p style={{ marginTop: 14, fontWeight: 700, fontSize: "1rem", color: NAVY }}>{voice.name}</p>
        <p style={{ fontSize: "0.75rem", color: "#6b7fa0", textTransform: "capitalize", marginTop: 2 }}>
          {voice.gender} · {voice.tagline}
        </p>

        {/* Status badge */}
        <span style={{
          marginTop: 10, padding: "4px 12px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600,
          backgroundColor: speaking ? NAVY : ttsLoading ? "#f0f3f8" : mode === "listening" ? "#fce8f3" : "#f0f3f8",
          color: speaking ? "#ffffff" : mode === "listening" ? "#bf125d" : "#6b7fa0",
        }}>
          {ttsLoading ? "Preparing…" : mode === "listening" ? "Listening…" : mode === "talking" ? "Speaking…" : "Ready"}
        </span>

        {speaking && (
          <button onClick={stopSpeaking} style={{
            marginTop: 10, display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
            backgroundColor: "#ffffff", color: "#d93025", fontSize: "0.8rem",
            fontWeight: 600, cursor: "pointer",
          }}>
            <VolumeX size={14} /> Stop speaking
          </button>
        )}

        {/* Lead info */}
        <div style={{ marginTop: 20, width: "100%", textAlign: "left",
          display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Lead",    conv?.lead?.name    || ""],
            ["Company", conv?.lead?.company || ""],
            ["Email",   conv?.lead?.email   || "optional on chat"],
            ["Persona", conv?.lead?.persona || "unclassified"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1,
              padding: "8px 10px", borderRadius: 8, backgroundColor: "#f7f9fc",
              border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#6b7fa0" }}>{label}</span>
              <span style={{ fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>{val}</span>
            </div>
          ))}
          {conv?.handoffs?.[0] && (
            <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: "#fdf6b2",
              border: "1px solid #e3a008", fontSize: "0.8rem", color: "#8e4b10", fontWeight: 600 }}>
              Handoff · {conv.handoffs[0].reason}
            </div>
          )}
        </div>

        {/* Speak toggle */}
        <div style={{ marginTop: "auto", paddingTop: 16, width: "100%", textAlign: "left" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8,
            fontSize: "0.82rem", color: NAVY, cursor: "pointer" }}>
            <input type="checkbox" checked={speak}
              onChange={(e) => { setSpeak(e.target.checked); if (!e.target.checked) stopSpeaking(); }}
              style={{ width: 15, height: 15, accentColor: NAVY, flexShrink: 0 }} />
            Speak replies
          </label>
          <p style={{ fontSize: "0.68rem", color: "#6b7fa0", marginTop: 6, lineHeight: 1.5 }}>
            {voiceQuality.noiseCancelEnabled  ? "Noise cancel on · " : ""}
            {voiceQuality.interruptionEnabled ? "Barge-in on · "     : ""}
            {voiceQuality.lowLatencyMode      ? "Low-latency profile" : "Standard latency"}
          </p>
        </div>
      </aside>

      {/* ── Right  chat messages ── */}
      <section style={{ display: "flex", flexDirection: "column", minHeight: 0,
        borderRadius: 10, border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Closed banner */}
        {chatClosed && (
          <div style={{ padding: "10px 18px", backgroundColor: "#fce8f3",
            borderBottom: "1.5px solid #f8b4d9", fontSize: "0.82rem", color: "#bf125d", fontWeight: 500 }}>
            This chat was closed due to off-topic or policy requests. Start a new conversation to continue.
          </div>
        )}

        {/* Messages */}
        <div className="scroll-thin" style={{ flex: 1, overflowY: "auto", padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
          {conv?.messages.map((m) => (
            <div key={m.id} style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: 10,
              fontSize: "0.875rem", lineHeight: 1.6,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: m.role === "user" ? NAVY : "#f0f3f8",
              color: m.role === "user" ? "#ffffff" : NAVY,
            }}>
              {m.content}
            </div>
          ))}
          {busy  && <p style={{ fontSize: "0.78rem", color: "#6b7fa0" }}>Thinking…</p>}
          {error && <p style={{ fontSize: "0.78rem", color: "#d93025" }}>{error}</p>}
          <div ref={bottom} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(text); }}
          style={{ display: "flex", gap: 8, padding: "12px 16px",
            borderTop: "1.5px solid #e2e8f0", backgroundColor: "#f7f9fc" }}
        >
          {/* Mic button */}
          <button type="button" onClick={speaking ? stopSpeaking : toggleMic} title={speaking ? "Stop speaking" : "Use microphone"}
            style={{
              width: 42, height: 42, borderRadius: 8, flexShrink: 0,
              border: `1.5px solid ${mode === "listening" || speaking ? "#d93025" : "#e2e8f0"}`,
              backgroundColor: mode === "listening" || speaking ? "#fce8f3" : "#ffffff",
              color: mode === "listening" || speaking ? "#d93025" : "#6b7fa0",
              cursor: "pointer", display: "grid", placeItems: "center",
            }}>
            {mode === "listening" || speaking ? <Square size={15} /> : <Mic size={15} />}
          </button>

          {/* Text input */}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={chatClosed ? "Chat closed" : "Type a reply, or use the mic…"}
            disabled={chatClosed}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #e2e8f0", backgroundColor: "#ffffff",
              color: NAVY, fontSize: "0.875rem", outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e)  => (e.target.style.borderColor = NAVY)}
            onBlur={(e)   => (e.target.style.borderColor = "#e2e8f0")}
          />

          {/* Send button */}
          <button type="submit" disabled={busy || chatClosed}
            style={{
              width: 42, height: 42, borderRadius: 8, flexShrink: 0,
              backgroundColor: NAVY, color: "#ffffff",
              border: `2px solid ${NAVY}`, cursor: busy || chatClosed ? "not-allowed" : "pointer",
              opacity: busy || chatClosed ? 0.5 : 1,
              display: "grid", placeItems: "center",
            }}>
            <Send size={15} />
          </button>
        </form>
      </section>
    </div>
  );
}