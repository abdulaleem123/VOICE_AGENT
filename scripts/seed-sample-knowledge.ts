import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "../prisma/env";
import { PrismaClient } from "@prisma/client";
import { chunkText, embedTexts } from "../src/lib/rag";

const prisma = new PrismaClient();
const FILENAME = "voice-agent-product-knowledge.txt";

async function main() {
  const path = resolve(process.cwd(), "samples", FILENAME);
  const content = readFileSync(path, "utf8");
  const existing = await prisma.knowledgeDoc.findFirst({ where: { filename: FILENAME } });
  if (existing) {
    await prisma.knowledgeDoc.delete({ where: { id: existing.id } });
  }

  const pieces = chunkText(content);
  let chunks = pieces.map((text) => ({ text, embedding: [] as number[] }));
  try {
    const embeddings = await embedTexts(pieces.length ? pieces : [content.slice(0, 8000)]);
    chunks = (pieces.length ? pieces : [content.slice(0, 8000)]).map((text, i) => ({
      text,
      embedding: embeddings[i] || [],
    }));
    console.log("Embedded", chunks.length, "chunks with OpenAI.");
  } catch {
    console.log("OpenAI key missing or invalid — stored text without embeddings.");
  }

  await prisma.knowledgeDoc.create({
    data: {
      filename: FILENAME,
      mimeType: "text/plain",
      content,
      chunks: JSON.stringify(chunks),
      size: Buffer.byteLength(content, "utf8"),
    },
  });

  console.log("Sample knowledge loaded:", FILENAME);
  console.log("Path on disk:", path);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
