import { z } from "zod";
import { createRouter, authedQuery, editorQuery, deleterQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { sales, saleItems } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "../lib/logger";
import { TRPCError } from "@trpc/server";

export const saleRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        organizationId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.organizationId) {
        conditions.push(eq(sales.organizationId, input.organizationId));
      }

      const saleList = conditions.length > 0
        ? await db.select().from(sales).where(and(...conditions)).orderBy(sales.saleDate)
        : await db.select().from(sales).orderBy(sales.saleDate);

      // Get items for each sale
      const items = await db.select().from(saleItems);
      return saleList.map(s => ({
        ...s,
        items: items.filter(i => i.saleId === s.id),
      }));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const sale = await db.query.sales.findFirst({ where: eq(sales.id, input.id) });
      if (!sale) throw new TRPCError({ code: "NOT_FOUND", message: "Venta no encontrada" });
      const items = await db.select().from(saleItems).where(eq(saleItems.saleId, input.id));
      return { ...sale, items };
    }),

  create: authedQuery
    .input(
      z.object({
        organizationId: z.number(),
        organizationName: z.string(),
        items: z.array(
          z.object({
            weaponId: z.number(),
            weaponName: z.string(),
            quantity: z.number().min(1),
            unitPrice: z.string().or(z.number()),
          })
        ).min(1, "Debe incluir al menos un arma"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Calculate totals
      let totalAmount = 0;
      const saleItemsData = input.items.map((item) => {
        const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;
        return {
          weaponId: item.weaponId,
          weaponName: item.weaponName,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
        };
      });

      // Create sale
      const [result] = await db.insert(sales).values({
        organizationId: input.organizationId,
        organizationName: input.organizationName,
        totalAmount: totalAmount.toFixed(2),
        createdBy: ctx.user.id,
        createdByName: ctx.user.username,
      }).$returningId();

      // Create sale items
      for (const item of saleItemsData) {
        await db.insert(saleItems).values({
          saleId: result.id,
          weaponId: item.weaponId,
          weaponName: item.weaponName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

      const itemNames = input.items.map(i => `${i.quantity}x ${i.weaponName}`).join(", ");
      await logActivity({
        type: "create",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Venta registrada",
        details: `$${totalAmount.toFixed(2)} a '${input.organizationName}' - ${itemNames}`,
      });

      return db.query.sales.findFirst({ where: eq(sales.id, result.id) });
    }),

  update: editorQuery
    .input(
      z.object({
        id: z.number(),
        organizationId: z.number().optional(),
        organizationName: z.string().optional(),
        items: z.array(
          z.object({
            weaponId: z.number(),
            weaponName: z.string(),
            quantity: z.number().min(1),
            unitPrice: z.string().or(z.number()),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, items, ...updates } = input;

      const existing = await db.query.sales.findFirst({ where: eq(sales.id, id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Venta no encontrada" });

      const updateData: Record<string, unknown> = {};
      if (updates.organizationId) updateData.organizationId = updates.organizationId;
      if (updates.organizationName) updateData.organizationName = updates.organizationName;

      // If items provided, recalculate totals
      if (items && items.length > 0) {
        let totalAmount = 0;
        // Delete old items
        await db.delete(saleItems).where(eq(saleItems.saleId, id));
        // Insert new items
        for (const item of items) {
          const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
          const totalPrice = unitPrice * item.quantity;
          totalAmount += totalPrice;
          await db.insert(saleItems).values({
            saleId: id,
            weaponId: item.weaponId,
            weaponName: item.weaponName,
            quantity: item.quantity,
            unitPrice: unitPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
          });
        }
        updateData.totalAmount = totalAmount.toFixed(2);
      }

      await db.update(sales).set(updateData).where(eq(sales.id, id));

      await logActivity({
        type: "update",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Venta actualizada",
        details: `Venta ID ${id} a '${existing.organizationName}' modificada`,
      });

      return db.query.sales.findFirst({ where: eq(sales.id, id) });
    }),

  delete: deleterQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.query.sales.findFirst({ where: eq(sales.id, input.id) });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Venta no encontrada" });

      // Delete items first
      await db.delete(saleItems).where(eq(saleItems.saleId, input.id));
      // Delete sale
      await db.delete(sales).where(eq(sales.id, input.id));

      await logActivity({
        type: "delete",
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "Venta eliminada",
        details: `Venta a '${existing.organizationName}' ($${existing.totalAmount}) eliminada`,
      });

      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const allSales = await db.select().from(sales);

    const totalSales = allSales.length;
    const totalAmount = allSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSales = allSales.filter(s => new Date(s.saleDate) >= monthStart);
    const thisMonthTotal = thisMonthSales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);

    return {
      totalSales,
      totalAmount: totalAmount.toFixed(2),
      thisMonth: thisMonthTotal.toFixed(2),
      averageAmount: averageAmount.toFixed(2),
    };
  }),
});
