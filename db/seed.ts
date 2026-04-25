import "dotenv/config";
import { getDb } from "../api/queries/connection";
import { roles, users } from "./schema";
import { hashPassword } from "../api/lib/auth";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Create default roles
  const existingRoles = await db.select().from(roles);
  if (existingRoles.length === 0) {
    console.log("Creating default roles...");
    await db.insert(roles).values([
      {
        name: "admin",
        canEditRecords: true,
        canDeleteRecords: true,
        canCreateUsers: true,
        canManageRoles: true,
        canManageWeapons: true,
        canManageSales: true,
        canManageOrgs: true,
      },
      {
        name: "hacker",
        canEditRecords: true,
        canDeleteRecords: true,
        canCreateUsers: true,
        canManageRoles: false,
        canManageWeapons: true,
        canManageSales: true,
        canManageOrgs: true,
      },
      {
        name: "user",
        canEditRecords: false,
        canDeleteRecords: false,
        canCreateUsers: false,
        canManageRoles: false,
        canManageWeapons: true,
        canManageSales: true,
        canManageOrgs: true,
      },
    ]);
    console.log("Roles created: admin, hacker, user");
  }

  // Get role IDs
  const allRoles = await db.select().from(roles);
  const adminRole = allRoles.find(r => r.name === "admin");
  const hackerRole = allRoles.find(r => r.name === "hacker");
  const userRole = allRoles.find(r => r.name === "user");

  if (!adminRole || !hackerRole || !userRole) {
    throw new Error("Roles not found after seeding");
  }

  // Create default users
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    console.log("Creating default users...");

    const hashedSantana = await hashPassword("Admin123!");
    const hashedHacker1 = await hashPassword("Hack456!");
    const hashedHacker2 = await hashPassword("Hack789!");
    const hashedOp = await hashPassword("Op111!");

    await db.insert(users).values([
      { username: "Santana", password: hashedSantana, roleId: adminRole.id, roleName: "admin", status: "active" },
      { username: "hacker1", password: hashedHacker1, roleId: hackerRole.id, roleName: "hacker", status: "active" },
      { username: "hacker2", password: hashedHacker2, roleId: hackerRole.id, roleName: "hacker", status: "active" },
      { username: "operativo1", password: hashedOp, roleId: userRole.id, roleName: "user", status: "active" },
    ]);
    console.log("Users created: Santana, hacker1, hacker2, operativo1");
  } else {
    console.log("Users already exist, skipping...");
  }

  console.log("Seed completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
