import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { prisma } from "@/lib/prisma";
import { chunkText, embedTexts, type Chunk } from "@/lib/rag";
import { requireApi } from "@/lib/guard";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT = [".pdf", ".doc", ".docx", ".txt"];

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\- ()]/g, "_").replace(/^\.+/, "").slice(0, 120) || "document.txt";
}

async function extractText(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return buf.toString("utf8");
  }
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const res = await mammoth.extractRawText({ buffer: buf });
    return res.value;
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const mod = await import("pdf-parse");
    const pdfParse = (mod.default || mod) as unknown as (b: Buffer) => Promise<{ text: string }>;
    const res = await pdfParse(buf);
    return res.text;
  }
  throw new Error("Unsupported file. Upload PDF, DOC/DOCX, or TXT.");
}

export async function GET(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;
  const docs = await prisma.knowledgeDoc.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, mimeType: true, size: true, createdAt: true, content: true },
  });
  return NextResponse.json({
    docs: docs.map(({ content, ...d }) => ({
      ...d,
      preview: content.slice(0, 240),
    })),
  });
}

export async function POST(req: Request) {
  const gate = await requireApi(req);
  if (!gate.ok) return gate.response;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF, DOC, or TXT file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 8 MB)" }, { status: 400 });
  }
  if (!ALLOWED_EXT.includes(extOf(file.name))) {
    return NextResponse.json({ error: "Unsupported file. Upload PDF, DOC, or TXT." }, { status: 400 });
  }

  let text = "";
  try {
    text = await extractText(file);
  } catch {
    return NextResponse.json({ error: "Could not read that file" }, { status: 400 });
  }
  if (!text.trim()) {
    return NextResponse.json({ error: "No text found in that file" }, { status: 400 });
  }

  const pieces = chunkText(text);
  let chunks: Chunk[] = pieces.map((t) => ({ text: t, embedding: [] }));
  try {
    const embeddings = await embedTexts(pieces.length ? pieces : [text.slice(0, 8000)]);
    chunks = (pieces.length ? pieces : [text.slice(0, 8000)]).map((t, i) => ({
      text: t,
      embedding: embeddings[i] || [],
    }));
  } catch {
    /* embeddings optional if key missing during first upload */
  }

  const doc = await prisma.knowledgeDoc.create({
    data: {
      filename: safeFilename(file.name),
      mimeType: file.type || "application/octet-stream",
      content: text.slice(0, 500_000),
      chunks: JSON.stringify(chunks),
      size: file.size,
    },
  });

  return NextResponse.json({ ok: true, id: doc.id, filename: doc.filename, chars: text.length });
}
