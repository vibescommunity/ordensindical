import { z } from "zod";
import { createRouter, authedQuery, editorQuery, deleterQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { activityLogs } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export const logRouter = createRouter({
  list: authedQuery
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
    }),

  recent: authedQuery
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
    }),

  update: editorQuery
    .input(
      z.object({
        id: z.number(),
        action: z.string().min(1).max(100).optional(),
        details: z.string().optional(),
        type: z.enum(["login", "create", "update", "delete", "auth", "system"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      await db.update(activityLogs).set(updates).where(eq(activityLogs.id, id));
      return db.query.activityLogs.findFirst({ where: eq(activityLogs.id, id) });
    }),

  delete: deleterQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(activityLogs).where(eq(activityLogs.id, input.id));
      return { success: true };
    }),
});
