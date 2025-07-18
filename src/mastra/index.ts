import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { checkoutAgent } from "./agents";
import { ContextWithMastra, registerApiRoute } from "@mastra/core/server";
import {
  businessAddressSchema,
  businessIDSchema,
  businessUpdateSchema,
  createAdminSchema,
  createProductSchema,
  loginAdminSchema,
  productDeleteSchema,
  productIDSchema,
  productUpdateSchema,
  settingsSchema,
  syncSheetSchema,
  updateBusinessSchema,
  userSchema,
} from "../validator/schemas";
import { zValidator } from "@hono/zod-validator";
import tryCatch from "../utils/TryCatch";
import { createAdmin, loginAdmin } from "../controllers/admin.controller";
import { validateJWT } from "../middleware/JWT";
import { createUser, getUsers } from "../controllers/user.controller";
import {
  createBusiness,
  requestSpreadSheet,
  syncSheet,
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
// import GoogleSheetsService, { addProductsToDatabase, getSheetDataAndMutate, run } from "../utils/GoogleSheetsService";
import { getSettings, getSettingsByBusinessId, updateSettings } from "../controllers/settings.controller";
import { userCheckWorkflow } from "./workflows";
import { getUserPayments, handlePaystackPayment } from "../controllers/payment.controller";
import { getUserOrders } from "../controllers/order.controller";

export const mastra = new Mastra({
  agents: { checkoutAgent },
  workflows: { userCheckWorkflow },
  storage: new LibSQLStore({
    url: ":memory:",
  }) as any,
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    host: "0.0.0.0",
    cors: {
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization","x-mastra-client-type","x-highlight-request","traceparent", "ngrok-skip-browser-warning"],
      credentials: false,
    },
    apiRoutes: [
      registerApiRoute("/paystack/webhook", {
        method: "POST",
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { event, data } = await c.req.json();
          await handlePaystackPayment(data, event)
          return c.json({ msg: "success"}, 200 as any);
        }) as any,
      }),
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
          const { email, password, ip } = await c.req.json();
          const login = await loginAdmin(email, password, ip);
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
        middleware: [validateJWT, zValidator("json", updateBusinessSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const admin = c.get("admin" as any);
          const { id } = admin;
          const data = await c.req.json();
          const update = await updateBusiness({ ...data, admin_id: id });
          return c.json(update, update.statusCode as any);
        }) as any,
      }),
      registerApiRoute("/admin/business/request-sheet", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const admin = c.get("admin" as any);
          const { id } = admin;
          const data = await c.req.json();
          const create = await requestSpreadSheet({ ...data, admin_id: id });
          return c.json(create, create.statusCode as any);
        }) as any,
      }),
      // registerApiRoute("/admin/business/update", {
      //   method: "POST",
      //   middleware: [validateJWT, zValidator("json", businessUpdateSchema)] as any,
      //   handler: tryCatch(async (c: ContextWithMastra) => {
      //     const { id } = c.get("admin" as any);
      //     const data = await c.req.json();
      //     const create = await updateBusiness({ ...data, admin_id: id });
      //     return c.json(create, create.statusCode as any);
      //   }) as any,
      // }),
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
      registerApiRoute("/admin/settings/update", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", settingsSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = c.req.param();
          const data = await c.req.json();
          console.log('testing\n\n\n', data)
          const settings = await updateSettings({ ...data, business_id, admin_id: id });
          return c.json(settings, settings.statusCode as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/settings/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = c.req.param();
          const settings = await getSettingsByBusinessId({ business_id, admin_id: id });
          return c.json(settings, settings.statusCode as any);
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
      registerApiRoute("/admin/orders/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = await c.req.param();
          const products = await getUserOrders(id, business_id);
          return c.json(products, products.statusCode || 200 as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/payments/:business_id", {
        method: "GET",
        middleware: [validateJWT, zValidator("param", businessIDSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const { business_id } = await c.req.param();
          const products = await getUserPayments(id, business_id);
          return c.json(products, products.statusCode || 200 as any);
          // return c.json({ message: "Done", token });
        }) as any,
      }),
      registerApiRoute("/admin/business/sync-sheet", {
        method: "POST",
        middleware: [validateJWT, zValidator("json", syncSheetSchema)] as any,
        handler: tryCatch(async (c: ContextWithMastra) => {
          const { id } = c.get("admin" as any);
          const data = await c.req.json();
          const res = await syncSheet({ ...data, admin_id: id });
          return c.json(res, res.statusCode || 200 as any);
          // // await getSheetDataAndMutate("1VTyfAzRhxX0hg9_xWL9UyzYLeDuc4x7Olu8CrmjvL5U");
          // await addProductsToDatabase('1VTyfAzRhxX0hg9_xWL9UyzYLeDuc4x7Olu8CrmjvL5U', '01K04TYQ49QD4B41C1059H5GJX');
          // return c.json({ msg: "Hi" })
        }) as any,
      }),
    ],
  },
});

export const checkoutBot = new Checkout(env.TELEGRAM_BOT_TOKEN);