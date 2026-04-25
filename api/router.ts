import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { roleRouter } from "./routers/role";
import { userRouter } from "./routers/user";
import { organizationRouter } from "./routers/organization";
import { saleRouter } from "./routers/sale";
import { weaponRouter } from "./routers/weapon";
import { logRouter } from "./routers/log";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  role: roleRouter,
  user: userRouter,
  organization: organizationRouter,
  sale: saleRouter,
  weapon: weaponRouter,
  log: logRouter,
});

export type AppRouter = typeof appRouter;
