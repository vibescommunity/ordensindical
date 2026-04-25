import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/auth";

export type UserContext = {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  status: "active" | "inactive";
  permissions: {
    canEditRecords: boolean;
    canDeleteRecords: boolean;
    canCreateUsers: boolean;
    canManageRoles: boolean;
    canManageWeapons: boolean;
    canManageSales: boolean;
    canManageOrgs: boolean;
  };
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: UserContext;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const authHeader = opts.req.headers.get("x-auth-token");
  let user: UserContext | undefined;

  if (authHeader) {
    try {
      const decoded = await verifyToken(authHeader);
      if (decoded && decoded.status === "active") {
        user = decoded;
      }
    } catch {
      // Invalid token
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
