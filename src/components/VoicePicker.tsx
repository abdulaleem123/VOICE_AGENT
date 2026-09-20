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
    { label: "Male",   gender: "male"   },
    { label: "Neutral", gender: "neutral" },
  ];

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.gender}>
          <p className="text-xs tracking-[0.18em] uppercase text-gray-500 mb-3">
            {g.label} voices
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {VOICES.filter((v) => v.gender === g.gender).map((v) => {
              const selected = v.id === value;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange(v.id)}
                  className={`text-left rounded-[10px] overflow-hidden border transition bg-white ${
                    selected
                      ? "border-[#2ee6c8] ring-2 ring-[#2ee6c8]/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Image  no dark overlay */}
                  <div className="h-52 bg-white overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.avatar}
                      alt={v.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  {/* Name + tagline on white background */}
                  <div className="bg-white px-3 py-2.5 border-t border-gray-100">
                    <p className="font-semibold text-sm text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{v.tagline}</p>
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