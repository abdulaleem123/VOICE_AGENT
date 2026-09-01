"use client";

import { VOICES, type VoiceOption } from "@/lib/voices";

export function VoicePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const groups: { label: string; gender: VoiceOption["gender"] }[] = [
    { label: "Female", gender: "female" },
    { label: "Male", gender: "male" },
    { label: "Neutral", gender: "neutral" },
  ];

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.gender}>
          <p className="text-xs tracking-[0.18em] uppercase text-[var(--muted)] mb-3">{g.label} voices</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {VOICES.filter((v) => v.gender === g.gender).map((v) => {
              const selected = v.id === value;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange(v.id)}
                  className={`text-left rounded-2xl overflow-hidden border transition ${
                    selected ? "border-[#2ee6c8] ring-2 ring-[#2ee6c8]/30" : "border-[var(--line)] hover:border-white/20"
                  }`}
                >
                  <div className="relative h-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.avatar} alt={v.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <p className="font-medium">{v.name}</p>
                      <p className="text-xs text-white/70">{v.tagline}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
