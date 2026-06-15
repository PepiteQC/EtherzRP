import { Router } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, modelsTable } from "@workspace/db";
import { SaveModelBody, GetModelParams, DeleteModelParams } from "@workspace/api-zod";

const router = Router();

router.get("/models", async (req, res) => {
  const models = await db
    .select()
    .from(modelsTable)
    .orderBy(desc(modelsTable.createdAt))
    .limit(100);
  res.json(models.map(fmt));
});

router.get("/models/stats", async (req, res) => {
  const [{ total }] = await db.select({ total: count() }).from(modelsTable);
  const recent = await db
    .select()
    .from(modelsTable)
    .orderBy(desc(modelsTable.createdAt))
    .limit(6);
  res.json({ total: Number(total), recent: recent.map(fmt) });
});

router.post("/models", async (req, res) => {
  const parsed = SaveModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [model] = await db
    .insert(modelsTable)
    .values({ prompt: parsed.data.prompt })
    .returning();
  res.status(201).json(fmt(model));
});

router.get("/models/:id", async (req, res) => {
  const parsed = GetModelParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [model] = await db.select().from(modelsTable).where(eq(modelsTable.id, parsed.data.id));
  if (!model) { res.status(404).json({ error: "Not found" }); return; }
  res.json(fmt(model));
});

router.delete("/models/:id", async (req, res) => {
  const parsed = DeleteModelParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(modelsTable).where(eq(modelsTable.id, parsed.data.id));
  res.status(204).send();
});

function fmt(m: typeof modelsTable.$inferSelect) {
  return { id: m.id, prompt: m.prompt, createdAt: m.createdAt.toISOString() };
}

export default router;
