import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { checkoutAgent } from "./agents";
import { registerApiRoute } from "@mastra/core/server";
import { addressSchema, businessSchema, createAdminSchema, createProductSchema, loginAdminSchema, storeIdSchema, userSchema } from "../validator/schemas";
import { zValidator } from '@hono/zod-validator'
import tryCatch from "../utils/TryCatch";
import { Context } from 'hono'
import { createAdmin, loginAdmin } from "../controllers/admin.controller";
import { setCookie } from 'hono/cookie'
import { validateJWT } from "../middleware/JWT";
import { createUser, getUsers } from "../controllers/user.controller";
import { addAddress, createBusiness } from "../controllers/business.controller";
import Checkout from "../utils/checkout-bot";
import env from "../config/env";
import { createProduct, getProducts, getSingleProduct } from "../controllers/product.controller";

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
        middleware: [validateJWT,zValidator('json', businessSchema)],
        handler: tryCatch(async (c) => {
          const { id } = c.get('admin')
          console.log(id)
          const data = await c.req.json();
          const create = await createBusiness({...data, admin_id: id })
          return c.json(create, create.statusCode)
        }),
      }),
      registerApiRoute("/business/address", {
        method: "POST",
        middleware: zValidator('json', addressSchema),
        handler: tryCatch(async (c) => {
          const { state, street, country, business_id } = await c.req.json();
          const create = await addAddress(business_id, { state, street, country })
          return c.json(create, create.statusCode)
        }),
      }),
      registerApiRoute('/user/create', {
        method: "POST",
        middleware: [validateJWT, zValidator('json', userSchema)],
        handler: tryCatch(async (c) => {
          const { business_id, name } = await c.req.json();
          const create = await createUser({ business_id, name })
          return c.json(create, create.statusCode)
        }),
        
      }),
      registerApiRoute('/user', {
        method: "GET",
        middleware: [validateJWT],
        handler: tryCatch(async (c) => {
          const { id } = c.get('admin')
          const fetch = await getUsers(id)
          return c.json(fetch, fetch.statusCode)
          // return c.json({ message: "Done", token });
        }),

      }),
      registerApiRoute('/admin/products/:business_id', {
        method: "GET",
        middleware: [validateJWT],
        handler: tryCatch(async (c) => {
          const { id } = c.get('admin')
          const {business_id} = await c.req.param()
          const products = await getProducts(business_id)
          console.log(products, business_id)
          return c.json(products, products.statusCode || 200)
          // return c.json({ message: "Done", token });
        }),
      }),
      registerApiRoute('/admin/products/:business_id/:product_id', {
        method: "GET",
        middleware: [validateJWT],
        handler: tryCatch(async (c) => {
          const { id } = c.get('admin')
          const {business_id, product_id} = await c.req.param()
          const products = await getSingleProduct(business_id, product_id)
          console.log(products, business_id)
          return c.json(products, products.statusCode || 200)
          // return c.json({ message: "Done", token });
        }),
      }),
      registerApiRoute('/admin/products', {
        method: "POST",
        middleware: [validateJWT, zValidator('json', createProductSchema)],
        handler: tryCatch(async (c) => {
          const data = await c.req.json() // Assuming you want to get business_id from the request body
          const res = await createProduct(data)
          return c.json(res, res.statusCode)
          // return c.json({ message: "Done", token });
        }),
      }),
      // registerApiRoute('/user', {
      //   method: "GET",
      //   middleware: [validateJWT],
      //   handler: async (c) => {
      //     const { id } = c.get('admin')
      //     const login = await getUsers(id)
      //     setCookie(c, 'ref', 'admin')
      //     return c.json(login, login.statusCode)
      //   },

      // }),
    ],
  },
});

export const checkoutBot = new Checkout(env.TELEGRAM_BOT_TOKEN)