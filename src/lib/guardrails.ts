export type GuardrailVerdict = "allow" | "off_topic" | "security";

export type GuardrailResult = {
  verdict: GuardrailVerdict;
  reason: string;
};

const SECURITY_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(api[_\s-]?key|openai[_\s-]?key|secret\s*key|jwt[_\s-]?secret)\b/i, reason: "credential_request" },
  { re: /\bsk-[a-z0-9]{10,}\b/i, reason: "api_key_probe" },
  { re: /\b(\.env|dotenv|environment\s+variable)\b/i, reason: "env_probe" },
  { re: /\b(password|passwd|credential)s?\b/i, reason: "password_probe" },
  { re: /\b(system\s*prompt|hidden\s*prompt|your\s*instructions|ignore\s+(all\s+)?(previous|prior)\s+instructions)\b/i, reason: "prompt_injection" },
  { re: /\b(you\s+are\s+now|act\s+as\s+DAN|jailbreak|developer\s+mode|bypass\s+(safety|guardrails?))\b/i, reason: "jailbreak" },
  { re: /\b(reveal|show|print|dump|expose)\b.{0,30}\b(prompt|instructions|config|secrets?|keys?)\b/i, reason: "exfiltration" },
  { re: /\b(before\s+answering|first\s+reverse|ignore\s+my\s+question\s+and)\b/i, reason: "instruction_hijack" },
];

const OFF_TOPIC_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(linked\s*list|binary\s*tree|write\s+(me\s+)?code|leetcode|hackerrank|homework|assignment)\b/i, reason: "coding" },
  { re: /\b(reverse\s+(the\s+)?string|palindrome|fibonacci|sort\s+an?\s+array|implement\s+\w+\s+in\s+\w+)\b/i, reason: "coding_task" },
  { re: /\b(python|javascript|java|c\+\+|typescript)\s+(code|script|function|program)\b/i, reason: "coding" },
  { re: /\b(write\s+(a\s+)?(poem|story|essay|joke|song)|tell\s+me\s+a\s+joke)\b/i, reason: "creative" },
  { re: /\b(weather|football|cricket|recipe|movie|celebrity|who\s+won|capital\s+of)\b/i, reason: "trivia" },
  { re: /\b(translate\s+this|what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+)\b/i, reason: "general_ai" },
  { re: /\b(chatgpt|gpt-?4|claude|gemini)\s+(vs|versus)\b/i, reason: "unrelated_ai" },
  { re: /\bpretend\s+you\s+are\s+(not|a\s+coder|chatgpt)\b/i, reason: "roleplay_escape" },
];

const ON_TOPIC_HINTS =
  /\b(product|pricing|price|demo|meeting|schedule|nda|company|business|help|hi|hello|hey|thanks|name|email|ceo|cfo|cto|founder|buy|quote|plan|feature|voice\s*agent|integrat|onboard|support)\b/i;

export function classifyUserMessage(text: string): GuardrailResult {
  const t = text.trim();
  if (!t) return { verdict: "allow", reason: "empty" };

  for (const { re, reason } of SECURITY_PATTERNS) {
    if (re.test(t)) return { verdict: "security", reason };
  }

  for (const { re, reason } of OFF_TOPIC_PATTERNS) {
    if (re.test(t)) return { verdict: "off_topic", reason };
  }

  // Short generic commands with no business context
  if (t.length < 80 && /\b(do\s+this|just\s+answer|only\s+answer|forget\s+everything)\b/i.test(t)) {
    return { verdict: "off_topic", reason: "manipulation" };
  }

  // Very long pasted code blocks
  if (/```[\s\S]{80,}```/.test(t) || (t.includes("function ") && t.includes("{") && t.length > 200)) {
    return { verdict: "off_topic", reason: "code_dump" };
  }

  return { verdict: "allow", reason: ON_TOPIC_HINTS.test(t) ? "business" : "neutral" };
}

const MAX_STRIKES = 3;

export function guardrailReply(
  verdict: GuardrailVerdict,
  strikes: number,
  agentName: string,
): { reply: string; strikes: number; endChat: boolean } {
  if (verdict === "security") {
    const next = strikes + 1;
    if (next >= MAX_STRIKES) {
      return {
        strikes: next,
        endChat: true,
        reply: `I'm not able to share internal system details or credentials. This chat is now closed. Start a new conversation if you'd like help with our product or to book a meeting.`,
      };
    }
    return {
      strikes: next,
      endChat: false,
      reply: `I'm ${agentName}, here to help with our product, pricing conversations, and scheduling meetings. I can't share API keys, passwords, or internal system details. What can I help you with regarding our offering?`,
    };
  }

  if (verdict === "off_topic") {
    const next = strikes + 1;
    if (next >= MAX_STRIKES) {
      return {
        strikes: next,
        endChat: true,
        reply: `I've noticed a few off-topic requests. I'm going to close this chat now. When you're ready to discuss our product or book a meeting, please start a new conversation — I'd be happy to help then.`,
      };
    }
    if (next === 2) {
      return {
        strikes: next,
        endChat: false,
        reply: `I can only help with questions about our product, your business needs, pricing follow-ups, NDAs, or booking a meeting. One more off-topic message and I'll need to close this chat.`,
      };
    }
    return {
      strikes: next,
      endChat: false,
      reply: `I'm here as a business assistant for our product — I can't help with coding, homework, or general trivia. Tell me about your company or what you're looking to solve, and I'll guide you from there.`,
    };
  }

  return { reply: "", strikes, endChat: false };
}

export { MAX_STRIKES };
