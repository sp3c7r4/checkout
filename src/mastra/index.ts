import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { checkoutAgent } from "./agents";
import { registerApiRoute } from "@mastra/core/server";
import { addressSchema, createAdminSchema, loginAdminSchema, storeIdSchema } from "../validator/schemas";
import { zValidator } from '@hono/zod-validator'
import tryCatch from "../utils/TryCatch";
import { Context } from 'hono'
import { createAdmin, loginAdmin } from "../controllers/admin.controller";
import { setCookie } from 'hono/cookie'

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { checkoutAgent },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    // middleware: 
    host: "0.0.0.0",
    middleware: null,
    apiRoutes: [
      registerApiRoute("/chat/:store_id", {
        method: "GET",
        handler: async (c) => {
          const store_id = c.req.param("store_id");
          const user_id = c.req.query("chat_id");
          const mastra = c.get("mastra");
          const agents = await mastra.getAgent("checkoutAgent");

          //* Chat
          const { text } = await agents.generate([
            { role: "user", content: "Hello, how can you assist me today?" },
          ])
          return c.json({ message: text });
        },
      }),
      registerApiRoute("/validate", {
        method: "POST",
        middleware: zValidator('json', storeIdSchema),
        handler: tryCatch(async (c: Context) => {
          return c.json({msg: 'hi'})
        })
      }),
      //* Admin
      registerApiRoute("/admin/create", {
        method: "POST",
        middleware: zValidator('json', createAdminSchema),
        handler: tryCatch(async (c: Context) => {
          const data = await c.req.json()
          const create = await createAdmin(data)
          return c.json(create, create.statusCode)
        })
      }),
      registerApiRoute("/admin/login", {
        method: "POST",
        middleware: zValidator('json', loginAdminSchema),
        handler: tryCatch(async (c: Context) => {
          const { email, password } = await c.req.json()
          const login = await loginAdmin(email, password)
          setCookie(c, 'ref', 'admin')
          return c.json(login, login.statusCode)
        })
      }),
      registerApiRoute("/business/create", {
        method: "POST",
        middleware: zValidator('json', storeIdSchema),
        handler: async (c) => {
          const { state, street, country } = await c.req.json();
          const create = await createAdmin(data)
          return c.json(create, create.statusCode)
        },
      }),
      registerApiRoute("/business/address", {
        method: "POST",
        middleware: zValidator('json', addressSchema),
        handler: async (c) => {
          const { state, street, country } = await c.req.json();
          const create = await createAdmin(data)
          return c.json(create, create.statusCode)
        },
      }),
      registerApiRoute('/business', {
        method: "POST",
        middleware: zValidator('json', storeIdSchema),
        handler: async (c) => {
          const { store_id } = await c.req.json();
          
          return c.json({ message: text });
        },

      })
    ],
  },
});
