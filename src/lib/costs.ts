export function chatCost(model: string, tokensIn: number, tokensOut: number) {
  const rates: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15, out: 0.6 },
    "gpt-4o": { in: 2.5, out: 10 },
    "gpt-4.1-mini": { in: 0.4, out: 1.6 },
    "gpt-4.1": { in: 2, out: 8 },
  };
  const r = rates[model] || rates["gpt-4o-mini"];
  return (tokensIn / 1_000_000) * r.in + (tokensOut / 1_000_000) * r.out;
}

export function embedCost(tokens: number) {
  return (tokens / 1_000_000) * 0.02;
}

export function ttsCost(characters: number) {
  return (characters / 1_000_000) * 15;
}

export function sttCost(seconds: number) {
  return (Math.max(seconds, 1) / 60) * 0.006;
}

export function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4 });
}

export function usdShort(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}
