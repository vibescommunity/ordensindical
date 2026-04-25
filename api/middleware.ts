import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// Any authenticated user
export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Requires canEditRecords permission
export const editorQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
  }
  if (!ctx.user.permissions.canEditRecords) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tiene permiso para editar registros" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Requires canDeleteRecords permission
export const deleterQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
  }
  if (!ctx.user.permissions.canDeleteRecords) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tiene permiso para eliminar registros" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Requires canCreateUsers permission
export const userCreatorQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
  }
  if (!ctx.user.permissions.canCreateUsers) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tiene permiso para crear usuarios" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Requires canManageRoles permission
export const roleManagerQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acceso no autorizado" });
  }
  if (!ctx.user.permissions.canManageRoles) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tiene permiso para gestionar roles" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
