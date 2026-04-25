import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { UserContext } from "../context";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "shadow-command-secret-key-2024"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: UserContext): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    roleId: user.roleId,
    roleName: user.roleName,
    status: user.status,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserContext | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
    });
    return {
      id: payload.id as number,
      username: payload.username as string,
      roleId: payload.roleId as number,
      roleName: payload.roleName as string,
      status: payload.status as "active" | "inactive",
      permissions: payload.permissions as UserContext["permissions"],
    };
  } catch {
    return null;
  }
}
