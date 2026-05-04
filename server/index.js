import { config as loadEnv } from "dotenv";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, "../.env") });

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const STREAM_INTERVAL_MS = 200;

const SYSTEM_PROMPT = `You are MOI Assistant, an expert on the MOI protocol and Contextual Compute.

You answer questions using ONLY the provided context from MOI's official documents (whitepaper, docs, blog posts). If the context does not contain enough information, say so clearly instead of guessing.

Style rules:
- Default to concise answers.
- For broad intro questions like "What is MOI?", answer in 2 short paragraphs maximum.
- Start with a plain-English definition in the first sentence.
- Do not use headings unless the user asks for a detailed breakdown.
- Do not use more than 3 bullets unless the user explicitly asks for a list.
- Avoid repeating the same idea in slightly different words.
- Use simple language first, then add technical detail only if the user asks for it.
- When mentioning MOI-specific concepts like ICSM, KRAMA, COCO, Cocolang, or Proof of Context, explain them briefly in one line.
- If asked about something outside MOI, politely redirect.
- Use markdown only when it improves readability.

Tone:
- Warm, clear, and confident.
- Sound like a knowledgeable team member, not a marketing brochure.`;

async function embedQuery(text) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

async function findRelevantChunks(embedding) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.3,
    match_count: 6,
  });
  if (error) console.error('RPC error:', error);
  if (error) throw error;
  return data || [];
}
function buildContext(chunks) {
  return chunks
    .map((chunk, i) => {
      const source = chunk.metadata?.source || "unknown";
      const section = chunk.metadata?.section || "";
      const header = section ? `${source} — ${section}` : source;
      return `[Source ${i + 1}: ${header}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    let message;
    let history = [];

    if (Array.isArray(req.body.messages) && req.body.messages.length > 0) {
      const msgs = req.body.messages;
      const last = msgs[msgs.length - 1];
      if (!last || last.role !== "user" || typeof last.content !== "string") {
        return res.status(400).json({ error: "messages must end with a user role and string content" });
      }
      message = last.content;
      history = msgs.slice(0, -1).map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
      }));
    } else {
      const { message: m, history: h = [] } = req.body;
      if (!m) return res.status(400).json({ error: "message is required" });
      message = m;
      history = Array.isArray(h) ? h : [];
    }

    const embedding = await embedQuery(message);
    const chunks = await findRelevantChunks(embedding);

    const context = buildContext(chunks);

    const recentHistory = history.slice(-10).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    const userContent = `<context>\n${context}\n</context>\n\nUser question: ${message}`;
    const messages = [...recentHistory, { role: "user", content: userContent }];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    let pending = "";
    const flushInterval = setInterval(() => {
      if (!pending) return;
      writeSse(res, { type: "text", text: pending });
      pending = "";
    }, STREAM_INTERVAL_MS);

    stream.on("text", (delta) => {
      pending += delta || "";
    });

    stream.on("end", () => {
      clearInterval(flushInterval);
      if (pending) writeSse(res, { type: "text", text: pending });
      const sources = chunks.map((c) => ({
        source: c.metadata?.source || "unknown",
        section: c.metadata?.section || "",
        similarity: c.similarity,
      }));
      writeSse(res, { type: "sources", sources });
      writeSse(res, { type: "done" });
      res.end();
    });

    stream.on("error", (err) => {
      clearInterval(flushInterval);
      console.error("Stream error:", err);
      writeSse(res, { type: "error", error: "Something went wrong" });
      res.end();
    });
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MOI chatbot server running on :${PORT}`));
