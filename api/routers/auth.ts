import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, roles } from "@db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, signToken } from "../lib/auth";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

export const authRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1, "Usuario requerido"),
        password: z.string().min(1, "Contrasena requerida"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario o contrasena invalidos",
        });
      }

      if (user.status !== "active") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usuario inactivo. Contacte al administrador.",
        });
      }

      const validPassword = await comparePassword(input.password, user.password);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuario o contrasena invalidos",
        });
      }

      // Load role permissions
      const role = user.roleId
        ? await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) })
        : null;

      const token = await signToken({
        id: user.id,
        username: user.username,
        roleId: user.roleId ?? 0,
        roleName: user.roleName,
        status: user.status as "active" | "inactive",
        permissions: {
          canEditRecords: role?.canEditRecords ?? false,
          canDeleteRecords: role?.canDeleteRecords ?? false,
          canCreateUsers: role?.canCreateUsers ?? false,
          canManageRoles: role?.canManageRoles ?? false,
          canManageWeapons: role?.canManageWeapons ?? true,
          canManageSales: role?.canManageSales ?? true,
          canManageOrgs: role?.canManageOrgs ?? true,
        },
      });

      await logActivity({
        type: "auth",
        userId: user.id,
        username: user.username,
        action: "Inicio de sesion",
        details: `Usuario '${user.username}' ha iniciado sesion`,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          roleName: user.roleName,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });
    if (!user || user.status !== "active") return null;

    const role = user.roleId
      ? await db.query.roles.findFirst({ where: eq(roles.id, user.roleId) })
      : null;

    return {
      id: user.id,
      username: user.username,
      roleId: user.roleId ?? 0,
      roleName: user.roleName,
      status: user.status,
      permissions: {
        canEditRecords: role?.canEditRecords ?? false,
        canDeleteRecords: role?.canDeleteRecords ?? false,
        canCreateUsers: role?.canCreateUsers ?? false,
        canManageRoles: role?.canManageRoles ?? false,
        canManageWeapons: role?.canManageWeapons ?? true,
        canManageSales: role?.canManageSales ?? true,
        canManageOrgs: role?.canManageOrgs ?? true,
      },
    };
  }),
});
