import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const SYSTEM_PROMPT = `You are a professional medical assistant AI integrated into a browser-based application.
Your responsibilities:
- Provide accurate, concise, and beginner-friendly explanations of medical terminology.
- Support medical students with structured study guidance, summaries, and clarifications.
- Use clear language, avoiding unnecessary jargon unless explicitly requested.
- When appropriate, include short examples, diagrams (in text form), or step-by-step breakdowns.
- Maintain a professional, supportive, and reliable tone at all times.
- Never provide misleading or incomplete information; ensure every response is factually grounded.

When explaining a medical term, structure your response like this:
1. A clear 1–2 sentence definition
2. Pronunciation (if relevant)
3. A simple real-world example or analogy
4. Clinical significance (brief)

Use markdown formatting: **bold** for key terms, bullet lists for breakdowns, and \`code\` for abbreviations.`;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it via Replit Secrets.");
  }
  return new GoogleGenAI({ apiKey });
}

// GET /api/ai/conversations
router.get("/ai/conversations", async (_req, res) => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(asc(conversationsTable.updatedAt));
  res.json(conversations.reverse());
});

// POST /api/ai/conversations
router.post("/ai/conversations", async (req, res) => {
  const title = typeof req.body?.title === "string"
    ? req.body.title.slice(0, 120)
    : "New Conversation";

  const [conv] = await db
    .insert(conversationsTable)
    .values({ title })
    .returning();
  res.status(201).json(conv);
});

// DELETE /api/ai/conversations/:id
router.delete("/ai/conversations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Conversation not found" }); return; }
  res.status(204).send();
});

// GET /api/ai/conversations/:id/messages
router.get("/ai/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  res.json(msgs);
});

// POST /api/ai/conversations/:id/messages  (SSE streaming)
router.post("/ai/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userContent = req.body?.content;
  if (!userContent || typeof userContent !== "string" || !userContent.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  // Verify conversation exists
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId: id,
    role: "user",
    content: userContent.trim(),
  });

  // Load full history for context
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  // Auto-title the conversation from first user message
  if (conv.title === "New Conversation" && history.filter(m => m.role === "user").length === 1) {
    const shortTitle = userContent.trim().slice(0, 60);
    await db
      .update(conversationsTable)
      .set({ title: shortTitle, updatedAt: new Date() })
      .where(eq(conversationsTable.id, id));
  } else {
    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, id));
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const genai = getGenAI();

    // Build Gemini contents (exclude the last user message — we pass it as the last turn)
    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const stream = await genai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 8192,
      },
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    const message = err?.message ?? "AI request failed";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

export default router;
