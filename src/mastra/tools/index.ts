import { createTool } from "@mastra/core";
import { z } from "zod";
import { getProducts } from "../../controllers/product.controller";
import ProductRepository from "../../repository/ProductRepository";
import CartRepository from "../../repository/CartRepository";
import CustomError from "../../utils/Error";

export const checkProductToolByName = createTool({
  id: "checkProductToolByName",
  description:
    "This tool is used to check if a product exists in a supermarket",
  inputSchema: z.object({
    business_id: z
      .string()
      .ulid()
      .describe("This will be provided to you don't ask for it from the user"),
    product_name: z
      .string()
      .describe("The name of the product you want to check"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { business_id, product_name } }) => {
    try {
      const resp =
        await ProductRepository.readProductByBusinessIdAndProductName(
          business_id,
          product_name.toLowerCase()
        );
      if (!resp) return { success: false, data: {} };
      console.log("Tool call:", resp);
      return { success: true, data: { ...resp, price: `₦${resp.price}` } };
    } catch (e) {
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});

export const updateCartProductQuantityTool = createTool({
  id: "updateCartProductQuantityTool",
  description:
    "This tool is used to increase or decrease the quantity of one or more products in the user's cart.",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person updating the cart"),
    business_id: z
      .string()
      .ulid()
      .describe("The business ID of the supermarket"),
    products: z
      .array(
        z
          .object({
            product_id: z.string(),
            price: z.number(),
            quantity: z
              .number()
              .describe("The quantity to add or subtract from the cart"),
            type: z
              .enum(["reduce", "increase"])
              .default("increase")
              .describe(
                'Specify "increase" to add or "reduce" to subtract quantity from the cart'
              ),
          })
          .describe("Product details as obtained from checkProductToolByName")
      )
      .describe("List of products to update in the cart"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { user_id, business_id, products } }) => {
    console.log(user_id, business_id, products);
    try {
      const resp = await CartRepository.storeProductInCart(
        user_id,
        business_id,
        products
      );
      if (!resp) return { success: false, data: {} };
      console.log("Tool call:", resp, resp.products);
      return { success: true, data: resp };
    } catch (e) {
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});

export const removeFromCartTool = createTool({
  id: "removeFromCartTool",
  description: "This tool is used to remove a product from the cart",
  inputSchema: z.object({
    user_id: z
      .string()
      .describe("The user ID of the person removing the product from the cart"),
    business_id: z
      .string()
      .ulid()
      .describe("The business ID of the supermarket"),
    product_id: z
      .string()
      .describe("The id of the product you want to remove from the cart"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { user_id, business_id, product_id } }) => {
    try {
      const resp = await CartRepository.removeProductFromCart(
        user_id,
        business_id,
        product_id
      );
      if (!resp) return { success: false, data: {} };
      console.log("Tool call:", resp, resp.products);
      return { success: true, data: resp };
    } catch (e) {
      if (e instanceof CustomError) {
        const { message: msg } = e;
        return { success: false, data: { msg } };
      }
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});

export const readCartItems = createTool({
  id: "readCartItems",
  description: "This tool is used to read the items in the user's cart",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person reading the cart"),
    business_id: z
      .string()
      .ulid()
      .describe("The business ID of the supermarket"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { user_id, business_id } }) => {
    try {
      const resp = await CartRepository.readCartByUserAndBusiness(
        user_id,
        business_id
      );
      if (!resp) return { success: false, data: {} };
      console.log("Tool call:", resp, resp.products);
      return { success: true, data: resp };
    } catch (e) {
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});
// export const setUserMode = createTool({
//   id: 'setUserMode',
//   description: 'This tool is used to set the user mode',
//   inputSchema: z.object({

//   })
// })
