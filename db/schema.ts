import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── CUSTOM ROLES ───
// Dynamic roles with permission flags. Santana and Hacker can create new roles.
export const roles = mysqlTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  canEditRecords: boolean("can_edit_records").notNull().default(false),
  canDeleteRecords: boolean("can_delete_records").notNull().default(false),
  canCreateUsers: boolean("can_create_users").notNull().default(false),
  canManageRoles: boolean("can_manage_roles").notNull().default(false),
  canManageWeapons: boolean("can_manage_weapons").notNull().default(true),
  canManageSales: boolean("can_manage_sales").notNull().default(true),
  canManageOrgs: boolean("can_manage_orgs").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

// ─── USERS ───
// No public registration. Users created manually by Santana/Hacker.
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: bigint("role_id", { mode: "number", unsigned: true }).references(() => roles.id),
  roleName: varchar("role_name", { length: 50 }).notNull().default("user"),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── ORGANIZATIONS ───
// name, logo (base64 image), location, boss/leader
export const organizations = mysqlTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["organizacion_avanzada", "organizacion_oficial", "proyecto_organizacion"]).notNull(),
  logo: text("logo"),
  location: varchar("location", { length: 100 }),
  leader: varchar("leader", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ─── WEAPONS ───
// Simplified: name, image, type, price, caliber only
export const weapons = mysqlTable("weapons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  imageUrl: text("image_url"),
  type: mysqlEnum("type", ["pistola", "rifle", "escopeta", "subfusil", "francotirador", "explosivo", "otro"]).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  caliber: varchar("caliber", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Weapon = typeof weapons.$inferSelect;
export type InsertWeapon = typeof weapons.$inferInsert;

// ─── SALES ───
// Linked to organization. Auto timestamp. Total calculated from items.
export const sales = mysqlTable("sales", {
  id: serial("id").primaryKey(),
  organizationId: bigint("organization_id", { mode: "number", unsigned: true }).references(() => organizations.id),
  organizationName: varchar("organization_name", { length: 100 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(() => users.id),
  createdByName: varchar("created_by_name", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ─── SALE ITEMS ───
// Each sale can have multiple weapons with quantities
export const saleItems = mysqlTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: bigint("sale_id", { mode: "number", unsigned: true }).notNull().references(() => sales.id),
  weaponId: bigint("weapon_id", { mode: "number", unsigned: true }).notNull().references(() => weapons.id),
  weaponName: varchar("weapon_name", { length: 100 }),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

// ─── ACTIVITY LOGS ───
// Real-time activity tracking
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: mysqlEnum("type", ["login", "create", "update", "delete", "auth", "system"]).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  username: varchar("username", { length: 50 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
