import { prisma } from "./prisma";
import { embedModel, openai } from "./openai";
import { embedCost } from "./costs";

export type Chunk = { text: string; embedding: number[] };

export function chunkText(text: string, size = 900) {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const parts: string[] = [];
  let buf = "";
  for (const para of clean.split(/\n+/)) {
    if ((buf + "\n" + para).length > size && buf) {
      parts.push(buf.trim());
      buf = para;
    } else {
      buf = buf ? `${buf}\n${para}` : para;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter((p) => p.length > 40).slice(0, 80);
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}

export async function embedTexts(texts: string[], tenantId?: string | null) {
  if (!texts.length) return [] as number[][];
  const res = await openai().embeddings.create({
    model: embedModel(),
    input: texts,
  });
  const tokens = res.usage?.total_tokens || Math.ceil(texts.join(" ").length / 4);
  await prisma.usageLog.create({
    data: {
      type: "embedding",
      model: embedModel(),
      tokensIn: tokens,
      costUsd: embedCost(tokens),
      tenantId: tenantId || null,
    },
  });
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function retrieveKnowledge(query: string, k = 5, tenantId?: string | null) {
  const docs = await prisma.knowledgeDoc.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  if (!docs.length) return [] as { text: string; filename: string; score: number }[];

  let qEmbed: number[] | null = null;
  try {
    qEmbed = (await embedTexts([query], tenantId))[0];
  } catch {
    qEmbed = null;
  }

  const scored: { text: string; filename: string; score: number }[] = [];
  for (const doc of docs) {
    let chunks: Chunk[] = [];
    try {
      chunks = JSON.parse(doc.chunks) as Chunk[];
    } catch {
      chunks = [];
    }
    if (!chunks.length && doc.content) {
      scored.push({ text: doc.content.slice(0, 1200), filename: doc.filename, score: 0.2 });
      continue;
    }
    for (const chunk of chunks) {
      let score = 0;
      if (qEmbed && chunk.embedding?.length) score = cosine(qEmbed, chunk.embedding);
      else {
        const q = query.toLowerCase();
        score = chunk.text.toLowerCase().includes(q) ? 0.5 : 0.1;
      }
      scored.push({ text: chunk.text, filename: doc.filename, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}
