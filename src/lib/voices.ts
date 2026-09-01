export type VoiceGender = "female" | "male" | "neutral";

export type VoiceOption = {
  id: string;
  name: string;
  gender: VoiceGender;
  tagline: string;
  avatar: string;
};

export const VOICES: VoiceOption[] = [
  {
    id: "nova",
    name: "Nova",
    gender: "female",
    tagline: "Warm, clear, conversational",
    avatar: "/avatars/voice-nova.png",
  },
  {
    id: "shimmer",
    name: "Shimmer",
    gender: "female",
    tagline: "Bright and expressive",
    avatar: "/avatars/voice-shimmer.png",
  },
  {
    id: "coral",
    name: "Coral",
    gender: "female",
    tagline: "Natural, engaging, polished",
    avatar: "/avatars/voice-coral.png",
  },
  {
    id: "sage",
    name: "Sage",
    gender: "female",
    tagline: "Calm, measured, thoughtful",
    avatar: "/avatars/voice-sage.png",
  },
  {
    id: "alloy",
    name: "Alloy",
    gender: "neutral",
    tagline: "Balanced and versatile",
    avatar: "/avatars/voice-alloy.png",
  },
  {
    id: "echo",
    name: "Echo",
    gender: "male",
    tagline: "Clear, confident, professional",
    avatar: "/avatars/voice-echo.png",
  },
  {
    id: "onyx",
    name: "Onyx",
    gender: "male",
    tagline: "Deep, authoritative, composed",
    avatar: "/avatars/voice-onyx.png",
  },
  {
    id: "fable",
    name: "Fable",
    gender: "male",
    tagline: "Refined British narrative",
    avatar: "/avatars/voice-fable.png",
  },
  {
    id: "ash",
    name: "Ash",
    gender: "male",
    tagline: "Steady, modern, grounded",
    avatar: "/avatars/voice-ash.png",
  },
];

export function getVoice(id: string) {
  return VOICES.find((v) => v.id === id) || VOICES[0];
}

export const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "warm", label: "Warm" },
  { id: "executive", label: "Executive" },
  { id: "consultative", label: "Consultative" },
  { id: "direct", label: "Direct" },
];

export const DEFAULT_TITLES = ["CEO", "CFO", "CTO", "COO", "VP Sales", "VP Marketing", "Founder", "Director", "Head of Ops"];
