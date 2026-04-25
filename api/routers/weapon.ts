import { z } from "zod";
import { createRouter, authedQuery, editorQuery, deleterQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { weapons } from "@db/schema";
import { eq, like, and } from "drizzle-orm";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

export const weaponRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.search) {
        conditions.push(like(weapons.name, `%${input.search}%`));
      }
      if (input?.type) {
        conditions.push(eq(weapons.type, input.type as "pistola" | "rifle" | "escopeta" | "subfusil" | "francotirador" | "explosivo" | "otro"));
      }

      if (conditions.length > 0) {
        return db.select().from(weapons).where(and(...conditions)).orderBy(weapons.id);
      }
      return db.select().from(weapons).orderBy(weapons.id);
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const weapon = await db.query.weapons.findFirst({
        where: eq(weapons.id, input.id),
      });
      if (!weapon) throw new TRPCError({ code: "NOT_FOUND", message: "Arma no encontrada" });
      return weapon;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido").max(100),
        imageUrl: z.string().optional(),
        type: z.enum(["pistola", "rifle", "escopeta", "subfusil", "francotirador", "explosivo", "otro"]),
        price: z.string().or(z.number()).default("0"),
        caliber: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const price = typeof input.price === "string" ? parseFloat(input.price) : input.price;

      const [result] = await db.insert(weapons).values({
        name: input.name,
        imageUrl: input.imageUrl,
        type: input.type,
        price: price.toFixed(2),
        caliber: input.caliber,
      }).$returningId();

      await logActivity({
        type: "create",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Arma registrada",
        details: `${input.name} (${input.type}) - $${price.toFixed(2)}`,
      });

      return db.query.weapons.findFirst({ where: eq(weapons.id, result.id) });
    }),

  update: editorQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        imageUrl: z.string().optional(),
        type: z.enum(["pistola", "rifle", "escopeta", "subfusil", "francotirador", "explosivo", "otro"]).optional(),
        price: z.string().or(z.number()).optional(),
        caliber: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...updates } = input;

      const existing = await db.query.weapons.findFirst({ where: eq(weapons.id, id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Arma no encontrada" });

      const updateData: Record<string, unknown> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
      if (updates.type) updateData.type = updates.type;
      if (updates.caliber !== undefined) updateData.caliber = updates.caliber;
      if (updates.price !== undefined) {
        const price = typeof updates.price === "string" ? parseFloat(updates.price) : updates.price;
        updateData.price = price.toFixed(2);
      }

      await db.update(weapons).set(updateData).where(eq(weapons.id, id));

      await logActivity({
        type: "update",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Arma actualizada",
        details: `Arma '${existing.name}' (ID: ${id}) modificada`,
      });

      return db.query.weapons.findFirst({ where: eq(weapons.id, id) });
    }),

  delete: deleterQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.weapons.findFirst({ where: eq(weapons.id, input.id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Arma no encontrada" });

      await db.delete(weapons).where(eq(weapons.id, input.id));

      await logActivity({
        type: "delete",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Arma eliminada",
        details: `Arma '${existing.name}' eliminada del inventario`,
      });

      return { success: true };
    }),
});
