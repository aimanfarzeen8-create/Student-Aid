import { Router } from "express";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { db, termsTable } from "@workspace/db";
import {
  ListTermsQueryParams,
  CreateTermBody,
  GetTermParams,
  UpdateTermParams,
  UpdateTermBody,
  DeleteTermParams,
  ToggleFavoriteParams,
  ToggleLearnedParams,
  GetQuizTermsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// GET /terms
router.get("/terms", async (req, res) => {
  const parsed = ListTermsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { search, category, difficulty, favoritesOnly, learnedOnly } = parsed.data;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(termsTable.term, `%${search}%`),
        ilike(termsTable.definition, `%${search}%`),
      )
    );
  }
  if (category) {
    conditions.push(eq(termsTable.category, category));
  }
  if (difficulty) {
    conditions.push(eq(termsTable.difficulty, difficulty));
  }
  if (favoritesOnly === true) {
    conditions.push(eq(termsTable.isFavorite, true));
  }
  if (learnedOnly === true) {
    conditions.push(eq(termsTable.isLearned, true));
  }

  const terms = await db
    .select()
    .from(termsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(termsTable.term);

  res.json(terms);
});

// POST /terms
router.post("/terms", async (req, res) => {
  const parsed = CreateTermBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [created] = await db.insert(termsTable).values(parsed.data).returning();
  res.status(201).json(created);
});

// GET /terms/quiz — must come before /terms/:id
router.get("/terms/quiz", async (req, res) => {
  const parsed = GetQuizTermsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { count = 10, category, difficulty } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(termsTable.category, category));
  if (difficulty) conditions.push(eq(termsTable.difficulty, difficulty));

  // Get all available terms for the filter
  const allTerms = await db
    .select()
    .from(termsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (allTerms.length < 2) {
    res.json([]);
    return;
  }

  // Shuffle and pick quiz terms
  const shuffled = allTerms.sort(() => Math.random() - 0.5);
  const quizTerms = shuffled.slice(0, Math.min(count, shuffled.length));

  // Build quiz questions with wrong choices from all terms
  const questions = quizTerms.map((term) => {
    const wrong = allTerms
      .filter((t) => t.id !== term.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((t) => t.definition);

    const choices = [term.definition, ...wrong].sort(() => Math.random() - 0.5);

    return {
      termId: term.id,
      term: term.term,
      correctAnswer: term.definition,
      choices,
    };
  });

  res.json(questions);
});

// GET /terms/:id
router.get("/terms/:id", async (req, res) => {
  const parsed = GetTermParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [term] = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.id, parsed.data.id));

  if (!term) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  res.json(term);
});

// PATCH /terms/:id
router.patch("/terms/:id", async (req, res) => {
  const paramsParsed = UpdateTermParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateTermBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [updated] = await db
    .update(termsTable)
    .set(bodyParsed.data)
    .where(eq(termsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  res.json(updated);
});

// DELETE /terms/:id
router.delete("/terms/:id", async (req, res) => {
  const parsed = DeleteTermParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(termsTable)
    .where(eq(termsTable.id, parsed.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  res.status(204).send();
});

// POST /terms/:id/favorite
router.post("/terms/:id/favorite", async (req, res) => {
  const parsed = ToggleFavoriteParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  const [updated] = await db
    .update(termsTable)
    .set({ isFavorite: !existing.isFavorite })
    .where(eq(termsTable.id, parsed.data.id))
    .returning();

  res.json(updated);
});

// POST /terms/:id/learned
router.post("/terms/:id/learned", async (req, res) => {
  const parsed = ToggleLearnedParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  const [updated] = await db
    .update(termsTable)
    .set({ isLearned: !existing.isLearned })
    .where(eq(termsTable.id, parsed.data.id))
    .returning();

  res.json(updated);
});

export default router;
