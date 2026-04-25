import { z } from "zod";
import { createRouter, authedQuery, roleManagerQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

export const roleRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.select().from(roles).orderBy(roles.id);
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, input.id),
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Rol no encontrado" });
      return role;
    }),

  create: roleManagerQuery
    .input(
      z.object({
        name: z.string().min(1).max(50),
        canEditRecords: z.boolean().default(false),
        canDeleteRecords: z.boolean().default(false),
        canCreateUsers: z.boolean().default(false),
        canManageRoles: z.boolean().default(false),
        canManageWeapons: z.boolean().default(true),
        canManageSales: z.boolean().default(true),
        canManageOrgs: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.roles.findFirst({
        where: eq(roles.name, input.name),
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "El rol ya existe" });

      const [result] = await db.insert(roles).values(input).$returningId();

      await logActivity({
        type: "create",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Rol creado",
        details: `Rol '${input.name}' creado con permisos personalizados`,
      });

      return db.query.roles.findFirst({ where: eq(roles.id, result.id) });
    }),

  update: roleManagerQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(50).optional(),
        canEditRecords: z.boolean().optional(),
        canDeleteRecords: z.boolean().optional(),
        canCreateUsers: z.boolean().optional(),
        canManageRoles: z.boolean().optional(),
        canManageWeapons: z.boolean().optional(),
        canManageSales: z.boolean().optional(),
        canManageOrgs: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...updates } = input;

      const existing = await db.query.roles.findFirst({
        where: eq(roles.id, id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Rol no encontrado" });

      await db.update(roles).set(updates).where(eq(roles.id, id));

      await logActivity({
        type: "update",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Rol actualizado",
        details: `Rol '${existing.name}' (ID: ${id}) modificado`,
      });

      return db.query.roles.findFirst({ where: eq(roles.id, id) });
    }),

  delete: roleManagerQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (input.id <= 3) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No se pueden eliminar los roles del sistema" });
      }
      const existing = await db.query.roles.findFirst({
        where: eq(roles.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Rol no encontrado" });

      await db.delete(roles).where(eq(roles.id, input.id));

      await logActivity({
        type: "delete",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Rol eliminado",
        details: `Rol '${existing.name}' eliminado`,
      });

      return { success: true };
    }),
});
