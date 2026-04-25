import { z } from "zod";
import { createRouter, authedQuery, editorQuery, deleterQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { organizations } from "@db/schema";
import { eq, like, and } from "drizzle-orm";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

const orgTypeEnum = z.enum(["organizacion_avanzada", "organizacion_oficial", "proyecto_organizacion"]);

export const organizationRouter = createRouter({
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
        conditions.push(like(organizations.name, `%${input.search}%`));
      }
      if (input?.type) {
        conditions.push(eq(organizations.type, input.type as "organizacion_avanzada" | "organizacion_oficial" | "proyecto_organizacion"));
      }

      if (conditions.length > 0) {
        return db.select().from(organizations).where(and(...conditions)).orderBy(organizations.id);
      }
      return db.select().from(organizations).orderBy(organizations.id);
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organizacion no encontrada" });
      return org;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido").max(100),
        type: orgTypeEnum,
        logo: z.string().optional(),
        location: z.string().max(100).optional(),
        leader: z.string().max(100).optional(),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [result] = await db.insert(organizations).values({
        name: input.name,
        type: input.type,
        logo: input.logo,
        location: input.location,
        leader: input.leader,
        status: input.status,
      }).$returningId();

      await logActivity({
        type: "create",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Organizacion creada",
        details: `Organizacion '${input.name}' (${input.type}) - Jefe: ${input.leader || "N/A"}`,
      });

      return db.query.organizations.findFirst({ where: eq(organizations.id, result.id) });
    }),

  update: editorQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        type: orgTypeEnum.optional(),
        logo: z.string().optional(),
        location: z.string().max(100).optional(),
        leader: z.string().max(100).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...updates } = input;

      const existing = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Organizacion no encontrada" });

      await db.update(organizations).set(updates).where(eq(organizations.id, id));

      await logActivity({
        type: "update",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Organizacion actualizada",
        details: `Organizacion '${existing.name}' (ID: ${id}) modificada`,
      });

      return db.query.organizations.findFirst({ where: eq(organizations.id, id) });
    }),

  delete: deleterQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.organizations.findFirst({ where: eq(organizations.id, input.id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Organizacion no encontrada" });

      await db.delete(organizations).where(eq(organizations.id, input.id));

      await logActivity({
        type: "delete",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Organizacion eliminada",
        details: `Organizacion '${existing.name}' eliminada`,
      });

      return { success: true };
    }),
});
