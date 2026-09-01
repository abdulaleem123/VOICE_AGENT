"use client";

import { useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/voices";
import { Mic, Send, Square, VolumeX } from "lucide-react";

type Msg = { id: string; role: string; content: string };
type Conv = {
  id: string;
  channel: string;
  status: string;
  messages: Msg[];
  lead?: { name?: string | null; company?: string | null; email?: string | null; persona?: string | null } | null;
  handoffs?: { id: string; reason: string; status: string }[];
};

export function ChatPane({ conversationId }: { conversationId: string }) {
  const [conv, setConv] = useState<Conv | null>(null);
  const [voiceId, setVoiceId] = useState("shimmer");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"idle" | "listening" | "talking">("idle");
  const [speak, setSpeak] = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);

  function stopSpeaking() {
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setTtsLoading(false);
    setMode("idle");
  }

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}`);
    const data = await res.json();
    setConv(data.conversation);
    setVoiceId(data.voiceId || "shimmer");
  }

  useEffect(() => {
    load();
    return () => stopSpeaking();
  }, [conversationId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length, busy]);

  async function playTTS(reply: string, vid: string) {
    if (!speak || !reply.trim()) return;
    stopSpeaking();
    setTtsLoading(true);
    const ac = new AbortController();
    ttsAbortRef.current = ac;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, voiceId: vid }),
        signal: ac.signal,
      });
      if (!res.ok) return;
      const blob = await res.blob();
      if (ac.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopSpeaking();
      setTtsLoading(false);
      setMode("talking");
      await audio.play().catch(() => stopSpeaking());
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      stopSpeaking();
    }
  }

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    stopSpeaking();
    setText("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: trimmed }),
      });
      let data: { error?: string; conversation?: Conv; reply?: string; voiceId?: string; closed?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error — refresh and try again.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Chat failed — check OPENAI_API_KEY in .env");
      }
      if (data.conversation) setConv(data.conversation);
      const vid = data.voiceId || voiceId;
      if (data.voiceId) setVoiceId(data.voiceId);
      void playTTS(data.reply || "", vid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setText(trimmed);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMic() {
    if (mode === "listening" && recRef.current) {
      recRef.current.stop();
      return;
    }
    stopSpeaking();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setMode("idle");
      const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "clip.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (data.text) send(data.text);
    };
    recRef.current = rec;
    rec.start();
    setMode("listening");
  }

  const voice = getVoice(voiceId);
  const speaking = mode === "talking" || ttsLoading;
  const chatClosed = conv?.status === "ended";

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5 h-[calc(100vh-8rem)]">
      <aside className="glass rounded-3xl p-5 flex flex-col items-center text-center">
        <div className={`relative h-40 w-40 rounded-full overflow-hidden orb ${mode === "talking" ? "talking" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={voice.avatar} alt={voice.name} className="h-full w-full object-cover" />
        </div>
        <p className="mt-4 font-semibold">{voice.name}</p>
        <p className="text-xs text-[var(--muted)] capitalize">{voice.gender} · {voice.tagline}</p>
        <p className="text-xs mt-3 text-[var(--accent)]">
          {ttsLoading ? "Preparing voice…" : mode === "listening" ? "Listening…" : mode === "talking" ? "Speaking…" : "Ready"}
        </p>
        {speaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b7a]/20 text-[#ff6b7a] text-sm font-medium"
          >
            <VolumeX size={16} />
            Stop speaking
          </button>
        ) : null}
        <div className="mt-6 w-full text-left space-y-2 text-sm">
          <p><span className="text-[var(--muted)]">Lead</span> · {conv?.lead?.name || "—"}</p>
          <p><span className="text-[var(--muted)]">Company</span> · {conv?.lead?.company || "—"}</p>
          <p><span className="text-[var(--muted)]">Email</span> · {conv?.lead?.email || "optional on chat"}</p>
          <p><span className="text-[var(--muted)]">Persona</span> · {conv?.lead?.persona || "unclassified"}</p>
          {conv?.handoffs?.[0] ? (
            <p className="text-[#f5b942]">Handoff · {conv.handoffs[0].reason}</p>
          ) : null}
        </div>
        <div className="mt-auto w-full space-y-2">
          <label className="flex items-center gap-2 text-sm normal-case tracking-normal text-white">
            <input
              type="checkbox"
              className="w-auto"
              checked={speak}
              onChange={(e) => {
                setSpeak(e.target.checked);
                if (!e.target.checked) stopSpeaking();
              }}
            />
            Speak replies
          </label>
          <p className="text-[10px] text-[var(--muted)] text-left">Uncheck before chatting to stay silent.</p>
        </div>
      </aside>

      <section className="glass rounded-3xl flex flex-col min-h-0">
        {chatClosed ? (
          <div className="px-5 py-3 border-b border-[#ff6b7a]/30 bg-[#ff6b7a]/10 text-sm text-[#ff9aa8]">
            This chat was closed due to off-topic or policy requests. Start a new conversation to continue.
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-3">
          {conv?.messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-[#2ee6c8]/15" : "bg-white/6"}`}>
              {m.content}
            </div>
          ))}
          {busy ? <p className="text-xs text-[var(--muted)]">Thinking…</p> : null}
          {error ? <p className="text-xs text-[#ff6b7a]">{error}</p> : null}
          <div ref={bottom} />
        </div>
        <form
          className="p-4 border-t border-white/8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <button
            type="button"
            onClick={speaking ? stopSpeaking : toggleMic}
            className={`h-11 w-11 rounded-xl grid place-items-center ${mode === "listening" ? "bg-[#ff6b7a] text-white" : speaking ? "bg-[#ff6b7a]/80 text-white" : "bg-white/8"}`}
            title={speaking ? "Stop speaking" : "Use microphone"}
          >
            {mode === "listening" || speaking ? <Square size={16} /> : <Mic size={16} />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={chatClosed ? "Chat closed" : "Type a reply, or use the mic…"}
            disabled={chatClosed}
          />
          <button type="submit" disabled={busy || chatClosed} className="h-11 px-4 rounded-xl bg-[#2ee6c8] text-[#06211c] disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
