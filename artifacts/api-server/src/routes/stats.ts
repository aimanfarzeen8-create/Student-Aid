import { Router } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, termsTable } from "@workspace/db";

const router = Router();

// GET /stats
router.get("/stats", async (req, res) => {
  const [totals] = await db
    .select({
      total: count(),
      learned: sql<number>`sum(case when ${termsTable.isLearned} then 1 else 0 end)::int`,
      favorites: sql<number>`sum(case when ${termsTable.isFavorite} then 1 else 0 end)::int`,
    })
    .from(termsTable);

  const byCategory = await db
    .select({
      category: termsTable.category,
      count: count(),
      learned: sql<number>`sum(case when ${termsTable.isLearned} then 1 else 0 end)::int`,
    })
    .from(termsTable)
    .groupBy(termsTable.category)
    .orderBy(termsTable.category);

  const byDifficulty = await db
    .select({
      difficulty: termsTable.difficulty,
      count: count(),
    })
    .from(termsTable)
    .groupBy(termsTable.difficulty);

  res.json({
    total: totals?.total ?? 0,
    learned: totals?.learned ?? 0,
    favorites: totals?.favorites ?? 0,
    byCategory,
    byDifficulty,
  });
});

// GET /categories
router.get("/categories", async (req, res) => {
  const rows = await db
    .selectDistinct({ category: termsTable.category })
    .from(termsTable)
    .orderBy(termsTable.category);

  res.json(rows.map((r) => r.category));
});

export default router;
