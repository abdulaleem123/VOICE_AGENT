import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "../prisma/env";
import { PrismaClient } from "@prisma/client";
import { chunkText, embedTexts } from "../src/lib/rag";

const prisma = new PrismaClient();
const FILENAME = "voice-agent-product-knowledge.txt";

async function main() {
  const tenant =
    (await prisma.tenant.findFirst({ where: { slug: "software-house" } })) ||
    (await prisma.tenant.findFirst({ where: { active: true }, orderBy: { sortOrder: "asc" } }));
  if (!tenant) {
    throw new Error("No tenant found — run npm run db:seed first");
  }

  const path = resolve(process.cwd(), "samples", FILENAME);
  const content = readFileSync(path, "utf8");
  const existing = await prisma.knowledgeDoc.findFirst({
    where: { filename: FILENAME, tenantId: tenant.id },
  });
  if (existing) {
    await prisma.knowledgeDoc.delete({ where: { id: existing.id } });
  }

  const pieces = chunkText(content);
  let chunks = pieces.map((text) => ({ text, embedding: [] as number[] }));
  try {
    const embeddings = await embedTexts(pieces.length ? pieces : [content.slice(0, 8000)], tenant.id);
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
      tenantId: tenant.id,
      filename: FILENAME,
      mimeType: "text/plain",
      content,
      chunks: JSON.stringify(chunks),
      size: Buffer.byteLength(content, "utf8"),
    },
  });

  console.log("Sample knowledge loaded for tenant:", tenant.slug, "→", FILENAME);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
