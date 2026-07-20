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

// ─────────────────────────────────────────────────────────────────────────────
// AI COMPANION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/ai/explain-term — deep-dive explanation for a Browse term (SSE streaming)
router.post("/ai/explain-term", async (req, res) => {
  const { term, definition, category, pronunciation, example } = req.body ?? {};
  if (!term || !definition) {
    res.status(400).json({ error: "term and definition are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const genai = getGenAI();

    const prompt = `You are a medical education assistant helping a student deeply understand a medical term.

Term: **${term}**${pronunciation ? `\nPronunciation: ${pronunciation}` : ""}
Category: ${category}
Definition: "${definition}"${example ? `\nClinical example: "${example}"` : ""}

Provide a comprehensive but concise educational breakdown with these sections:

## 🔬 Deep Dive
Explain the term thoroughly — its meaning, origin (etymology if interesting), and key characteristics.

## 🏥 Clinical Significance
Why does this matter in clinical practice? What scenarios does a doctor encounter this?

## 🔗 Related Concepts
List 3–4 closely related terms or conditions the student should know alongside this one.

## 💡 Memory Hook
Give one memorable mnemonic, analogy, or visual cue to make this stick.

Keep each section tight and scannable. Use **bold** for key terms, bullet points where helpful.`;

    const stream = await genai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err?.message ?? "Explain failed" })}\n\n`);
    res.end();
  }
});

// POST /api/ai/sort-task — analyse a task title+notes and suggest category/priority/notes
router.post("/ai/sort-task", async (req, res) => {
  const title = req.body?.title;
  const notes = req.body?.notes ?? "";
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  try {
    const genai = getGenAI();
    const prompt = `You are a medical study assistant. Analyse this study task and suggest the best categorisation.

Task title: "${title.trim()}"
Notes: "${notes.trim()}"

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "category": "<one of: Study | Reading | Assessment | Review | Practice | Other>",
  "priority": "<one of: high | medium | low>",
  "notes": "<optional improved/expanded notes — max 120 chars, or empty string>",
  "reasoning": "<one sentence explaining your choices>"
}

Category guide:
- Study = active learning / memorising terms
- Reading = textbooks / research articles
- Assessment = exams, tests, self-assessment
- Review = revisiting previously studied material
- Practice = MCQs, clinical cases, procedures
- Other = anything else

Priority guide:
- high = exam prep, deadlines < 3 days, urgent
- medium = regular study tasks
- low = optional reading, long-term goals`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 512 },
    });

    const text = (response.text ?? "{}").trim();
    const result = JSON.parse(text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "AI sort failed" });
  }
});

// POST /api/ai/explain-answer — SSE streaming explanation for a quiz answer
router.post("/ai/explain-answer", async (req, res) => {
  const { term, correctAnswer, selectedAnswer, wasCorrect } = req.body ?? {};
  if (!term || !correctAnswer) {
    res.status(400).json({ error: "term and correctAnswer are required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const genai = getGenAI();

    const wrongAnswerLine = !wasCorrect && selectedAnswer
      ? `\nThe student incorrectly selected: "${selectedAnswer}"`
      : "";

    const prompt = `You are a medical education assistant helping a student understand a quiz answer.

Medical term: **${term}**
Correct definition: "${correctAnswer}"${wrongAnswerLine}

Write a concise educational explanation (3 short paragraphs) using this structure:
1. **Definition & clinical significance** — explain the term clearly with one key clinical fact
2. **Why this answer is correct** — highlight what makes the correct answer right; if the student was wrong, gently explain the distinction
3. **Memory tip** — provide a mnemonic, analogy, or memorable hook

Use markdown: **bold** key terms, bullet points where helpful. Keep it focused and easy to remember.`;

    const stream = await genai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err?.message ?? "Explain failed" })}\n\n`);
    res.end();
  }
});

// POST /api/ai/generate-quiz — generate quiz questions for a given medical topic
router.post("/ai/generate-quiz", async (req, res) => {
  const topic = req.body?.topic;
  const count = Math.min(Math.max(Number(req.body?.count ?? 10), 3), 20);

  if (!topic || typeof topic !== "string" || !topic.trim()) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  try {
    const genai = getGenAI();

    const prompt = `Generate exactly ${count} multiple-choice quiz questions about "${topic.trim()}" for medical students.

Each question presents a medical term and asks the student to identify its correct definition.

Requirements:
- Each question must have exactly 4 choices (1 correct + 3 plausible distractors)
- Distractors should be related to the topic but clearly wrong
- Shuffle choices so the correct answer is not always first
- Cover a variety of clinically important terms within the topic
- Definitions should be concise (1-2 sentences)

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {
    "term": "Medical term name",
    "correctAnswer": "The accurate definition",
    "choices": ["The accurate definition", "Wrong option 1", "Wrong option 2", "Wrong option 3"]
  }
]`;

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
    });

    const text = (response.text ?? "[]").trim();
    const questions = JSON.parse(text);

    const formatted = (questions as any[]).map((q: any, i: number) => ({
      termId: -(i + 1),
      term: String(q.term ?? "Unknown"),
      correctAnswer: String(q.correctAnswer ?? ""),
      choices: Array.isArray(q.choices) ? q.choices.map(String) : [q.correctAnswer],
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Quiz generation failed" });
  }
});

export default router;
