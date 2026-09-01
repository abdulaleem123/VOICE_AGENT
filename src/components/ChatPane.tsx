"use client";

import { useEffect, useRef, useState } from "react";
import { getVoice } from "@/lib/voices";
import { Mic, Send, Square } from "lucide-react";

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
  const [voiceId, setVoiceId] = useState("nova");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"idle" | "listening" | "talking">("idle");
  const [speak, setSpeak] = useState(true);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}`);
    const data = await res.json();
    setConv(data.conversation);
    setVoiceId(data.voiceId || "nova");
  }

  useEffect(() => {
    load();
  }, [conversationId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length]);

  async function playTTS(reply: string, vid: string) {
    if (!speak) return;
    setMode("talking");
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply, voiceId: vid }),
    });
    if (!res.ok) {
      setMode("idle");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setMode("idle");
    await audio.play().catch(() => setMode("idle"));
  }

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setText("");
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      alert(data.error || "Chat failed — check OPENAI_API_KEY in .env");
      return;
    }
    setConv(data.conversation);
    setVoiceId(data.voiceId || voiceId);
    await playTTS(data.reply, data.voiceId || voiceId);
  }

  async function toggleMic() {
    if (mode === "listening" && recRef.current) {
      recRef.current.stop();
      return;
    }
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
          {mode === "listening" ? "Listening…" : mode === "talking" ? "Speaking…" : "Ready"}
        </p>
        <div className="mt-6 w-full text-left space-y-2 text-sm">
          <p><span className="text-[var(--muted)]">Lead</span> · {conv?.lead?.name || "—"}</p>
          <p><span className="text-[var(--muted)]">Company</span> · {conv?.lead?.company || "—"}</p>
          <p><span className="text-[var(--muted)]">Email</span> · {conv?.lead?.email || "optional on chat"}</p>
          <p><span className="text-[var(--muted)]">Persona</span> · {conv?.lead?.persona || "unclassified"}</p>
          {conv?.handoffs?.[0] ? (
            <p className="text-[#f5b942]">Handoff · {conv.handoffs[0].reason}</p>
          ) : null}
        </div>
        <label className="mt-auto flex items-center gap-2 text-sm normal-case tracking-normal text-white">
          <input type="checkbox" className="w-auto" checked={speak} onChange={(e) => setSpeak(e.target.checked)} />
          Speak replies
        </label>
      </aside>

      <section className="glass rounded-3xl flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-3">
          {conv?.messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-[#2ee6c8]/15" : "bg-white/6"}`}>
              {m.content}
            </div>
          ))}
          {busy ? <p className="text-xs text-[var(--muted)]">Thinking…</p> : null}
          <div ref={bottom} />
        </div>
        <form
          className="p-4 border-t border-white/8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <button type="button" onClick={toggleMic} className={`h-11 w-11 rounded-xl grid place-items-center ${mode === "listening" ? "bg-[#ff6b7a] text-white" : "bg-white/8"}`}>
            {mode === "listening" ? <Square size={16} /> : <Mic size={16} />}
          </button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a reply, or use the mic…" />
          <button type="submit" className="h-11 px-4 rounded-xl bg-[#2ee6c8] text-[#06211c]">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
