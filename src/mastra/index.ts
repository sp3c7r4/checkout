import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { checkoutAgent } from "./agents";
import { ContextWithMastra, registerApiRoute } from "@mastra/core/server";
import {
  businessAddressSchema,
  businessIDSchema,
  businessSchema,
  businessUpdateSchema,
  createAdminSchema,
  createProductSchema,
  loginAdminSchema,
  productDeleteSchema,
  productIDSchema,
  productUpdateSchema,
  userSchema,
} from "../validator/schemas";
import { zValidator } from "@hono/zod-validator";
import tryCatch from "../utils/TryCatch";
import { Context } from "hono";
import { createAdmin, loginAdmin } from "../controllers/admin.controller";
import { validateJWT } from "../middleware/JWT";
import { createUser, getUsers } from "../controllers/user.controller";
import {
  createBusiness,
  updateBusiness,
} from "../controllers/business.controller";
import Checkout from "../utils/checkout-bot";
import env from "../config/env";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/product.controller";
import { getCarts } from "../controllers/cart.controller";
import "./../Event";

export const mastra = new Mastra({
  agents: { checkoutAgent },
  storage: new LibSQLStore({
    url: ":memory:",
  }) as any,
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    // middleware:
    host: "0.0.0.0",
    apiRoutes: [
      // registerApiRoute("/chat/:store_id", {
      //   method: "GET",
      //   handler: async (c: ContextWithMastra) => {
      //     const store_id = c.req.param("store_id");
      //     const user_id = c.req.query("chat_id");
      //     const mastra = c.get("mastra");
      //     const agents = await mastra.getAgent("checkoutAgent");

      //     //* Chat
      //     const { text } = await agents.generate([
      //       { role: "user", content: "Hello, how can you assist me today?" },
      //     ]);
      //     return c.json({ message: text });
      //   },
      // }),
      // registerApiRoute("/validate", {
      //   method: "POST",
      //   middleware: zValidator("json", storeIdSchema),
      //   handler: tryCatch(async (c: Context) => {
      //     return c.json({ msg: "hi" });
      //   }),
      // }),
      //* Admin
      registerApiRoute("/admin/create", {
        method: "POST",
        middleware: zValidator("json", createAdminSchema) as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const data = await c.req.json();
          const create = await createAdmin(data);
          return c.json(create, create.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/admin/login", {
        method: "POST",
        middleware: zValidator("json", loginAdminSchema) as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { email, password } = await c.req.json();
          const login = await loginAdmin(email, password);
          return c.json(login, login.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/admin/business/create", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", businessAddressSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const admin = c.get("admin" as any);
          const { id } = admin;
          const data = await c.req.json();
          const create = await createBusiness({ ...data, admin_id: id });
          return c.json(create, create.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/admin/business/update", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", businessUpdateSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const data = await c.req.json();
          const create = await updateBusiness({ ...data, admin_id: id });
          return c.json(create, create.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/user/create", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", userSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { business_id, name } = await c.req.json();
          const create = await createUser({ business_id, name });
          return c.json(create, create.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/admin/users/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = await c.req.param();
          const users = await getUsers({ business_id, admin_id: id });
          return c.json(users, users.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/products/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = c.req.param();
          const products = await getProducts({ business_id, admin_id: id });
          return c.json(products, products.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/products/:business_id/:product_id", {
        method: "GET",
        middleware: [validateJWT] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id, product_id } = await c.req.param();
          const products = await getSingleProduct(business_id, product_id);
          return c.json(products, products.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/products/:product_id", {
        method: "POST",
        middleware: [
          validateJWT,
          zValidator("param", productIDSchema),
          zValidator("json", productUpdateSchema),
        ] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id: admin_id } = c.get("admin" as any);
          const { product_id } = c.req.param();
          const data = await c.req.json(); // Assuming you want to get business_id from the request body
          const products = await updateProduct({
            ...data,
            product_id,
            admin_id,
          });
          return c.json(products, products.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/products/:business_id/:product_id", {
        method: "DELETE",
        middleware: [validateJWT, zValidator("param", productDeleteSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id: admin_id } = c.get("admin" as any);
          const { business_id, product_id } = await c.req.param();
          const products = await deleteProduct({
            business_id,
            product_id,
            admin_id,
          });
          return c.json(products, products.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/products", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", createProductSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const data = await c.req.json(); // Assuming you want to get business_id from the request body
          const res = await createProduct({ ...data, admin_id: id });
          return c.json(res, res.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/carts/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = await c.req.param();
          const products = await getCarts(id, business_id);
          return c.json(products, products.statusCode || 200 as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
    ],
  },
});

export const checkoutBot = new Checkout(env.TELEGRAM_BOT_TOKEN);
