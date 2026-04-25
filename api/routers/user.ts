import { z } from "zod";
import { createRouter, authedQuery, userCreatorQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq, like, and } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

export const userRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        search: z.string().optional(),
        roleName: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.search) {
        conditions.push(like(users.username, `%${input.search}%`));
      }
      if (input?.roleName) {
        conditions.push(eq(users.roleName, input.roleName));
      }
      if (input?.status) {
        conditions.push(eq(users.status, input.status as "active" | "inactive"));
      }

      if (conditions.length > 0) {
        return db.select().from(users).where(and(...conditions)).orderBy(users.id);
      }
      return db.select().from(users).orderBy(users.id);
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      return user;
    }),

  create: userCreatorQuery
    .input(
      z.object({
        username: z.string().min(3, "Minimo 3 caracteres").max(50),
        password: z.string().min(6, "Minimo 6 caracteres"),
        roleId: z.number().min(1),
        roleName: z.string().min(1),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const existing = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "El usuario ya existe" });

      const hashedPassword = await hashPassword(input.password);

      const [result] = await db.insert(users).values({
        username: input.username,
        password: hashedPassword,
        roleId: input.roleId,
        roleName: input.roleName,
        status: input.status,
      }).$returningId();

      const newUser = await db.query.users.findFirst({
        where: eq(users.id, result.id),
      });

      await logActivity({
        type: "create",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Usuario creado",
        details: `Usuario '${input.username}' creado con rol ${input.roleName}`,
      });

      return newUser;
    }),

  update: userCreatorQuery
    .input(
      z.object({
        id: z.number(),
        username: z.string().min(3).max(50).optional(),
        roleId: z.number().optional(),
        roleName: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...updates } = input;

      const existing = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });

      const updateData: Record<string, unknown> = {};
      if (updates.username) updateData.username = updates.username;
      if (updates.roleId) updateData.roleId = updates.roleId;
      if (updates.roleName) updateData.roleName = updates.roleName;
      if (updates.status) updateData.status = updates.status;
      if (updates.password) updateData.password = await hashPassword(updates.password);

      await db.update(users).set(updateData).where(eq(users.id, id));

      await logActivity({
        type: "update",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Usuario actualizado",
        details: `Usuario '${existing.username}' (ID: ${id}) modificado`,
      });

      return db.query.users.findFirst({ where: eq(users.id, id) });
    }),

  delete: userCreatorQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puede eliminar su propia cuenta" });
      }

      // Find the first admin user to protect
      const allUsers = await db.select().from(users);
      const admins = allUsers.filter(u => u.roleName === "admin");
      if (admins.length === 1 && admins[0].id === input.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Debe existir al menos un administrador" });
      }

      const existing = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });

      await db.delete(users).where(eq(users.id, input.id));

      await logActivity({
        type: "delete",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Usuario eliminado",
        details: `Usuario '${existing.username}' eliminado permanentemente`,
      });

      return { success: true };
    }),
});
