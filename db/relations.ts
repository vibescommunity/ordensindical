import { relations } from "drizzle-orm";
import { roles, users, sales, saleItems, weapons, organizations, activityLogs } from "./schema";

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  activityLogs: many(activityLogs),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  sales: many(sales),
}));

export const weaponsRelations = relations(weapons, ({ many }) => ({
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ many, one }) => ({
  organization: one(organizations, { fields: [sales.organizationId], references: [organizations.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  weapon: one(weapons, { fields: [saleItems.weaponId], references: [weapons.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
