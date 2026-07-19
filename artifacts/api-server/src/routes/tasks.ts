import { Router } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";

const router = Router();

type Priority = "low" | "medium" | "high";
type Status = "active" | "completed";

function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isValidPriority(s: unknown): s is Priority {
  return s === "low" || s === "medium" || s === "high";
}

// GET /tasks
router.get("/tasks", async (req, res) => {
  const { date, from, to, category, priority, status } = req.query as Record<string, string | undefined>;
  const conditions = [];

  if (date) {
    if (!isValidDate(date)) { res.status(400).json({ error: "Invalid date format (YYYY-MM-DD)" }); return; }
    conditions.push(eq(tasksTable.dueDate, date));
  } else {
    if (from) {
      if (!isValidDate(from)) { res.status(400).json({ error: "Invalid from format" }); return; }
      conditions.push(gte(tasksTable.dueDate, from));
    }
    if (to) {
      if (!isValidDate(to)) { res.status(400).json({ error: "Invalid to format" }); return; }
      conditions.push(lte(tasksTable.dueDate, to));
    }
  }

  if (category && typeof category === "string") conditions.push(eq(tasksTable.category, category));
  if (priority && isValidPriority(priority)) conditions.push(eq(tasksTable.priority, priority));
  if (status === "active") conditions.push(eq(tasksTable.isCompleted, false));
  if (status === "completed") conditions.push(eq(tasksTable.isCompleted, true));

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tasksTable.dueDate, tasksTable.dueTime, tasksTable.createdAt);

  res.json(tasks);
});

// POST /tasks
router.post("/tasks", async (req, res) => {
  const { title, category, priority, dueDate, dueTime, notes } = req.body as Record<string, unknown>;

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ error: "title is required" }); return;
  }
  if (!dueDate || !isValidDate(dueDate)) {
    res.status(400).json({ error: "dueDate is required (YYYY-MM-DD)" }); return;
  }

  const [created] = await db.insert(tasksTable).values({
    title: (title as string).trim(),
    category: typeof category === "string" ? category : "Study",
    priority: isValidPriority(priority) ? priority : "medium",
    dueDate: dueDate as string,
    dueTime: typeof dueTime === "string" && dueTime ? dueTime : null,
    notes: typeof notes === "string" && notes ? notes.trim() : null,
  }).returning();

  res.status(201).json(created);
});

// GET /tasks/:id
router.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  res.json(task);
});

// PATCH /tasks/:id
router.patch("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, category, priority, dueDate, dueTime, notes, isCompleted } = req.body as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") { res.status(400).json({ error: "title must be a non-empty string" }); return; }
    patch.title = title.trim();
  }
  if (category !== undefined) patch.category = category;
  if (priority !== undefined) {
    if (!isValidPriority(priority)) { res.status(400).json({ error: "priority must be low|medium|high" }); return; }
    patch.priority = priority;
  }
  if (dueDate !== undefined) {
    if (!isValidDate(dueDate)) { res.status(400).json({ error: "dueDate must be YYYY-MM-DD" }); return; }
    patch.dueDate = dueDate;
  }
  if (dueTime !== undefined) patch.dueTime = dueTime || null;
  if (notes !== undefined) patch.notes = notes || null;
  if (isCompleted !== undefined) patch.isCompleted = Boolean(isCompleted);

  if (Object.keys(patch).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }

  const [updated] = await db
    .update(tasksTable)
    .set(patch as any)
    .where(eq(tasksTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Task not found" }); return; }

  res.json(updated);
});

// DELETE /tasks/:id
router.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Task not found" }); return; }

  res.status(204).send();
});

// POST /tasks/:id/toggle — flip isCompleted
router.post("/tasks/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

  const [updated] = await db
    .update(tasksTable)
    .set({ isCompleted: !existing.isCompleted })
    .where(eq(tasksTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
