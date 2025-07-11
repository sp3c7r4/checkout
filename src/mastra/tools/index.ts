import { createTool } from "@mastra/core";
import { z } from "zod";
import ProductRepository from "../../repository/ProductRepository";
import CartRepository from "../../repository/CartRepository";
import CustomError from "../../utils/Error";
import { getProductByBusinessIdAndProductName, MarkDownizeProducts, MutateCartProducts, MutateProduct } from "../../helpers/bot";
import CheckoutEmitter from "../../Event";
import { getBusinessById } from "../../helpers/business";
import { getUserById } from "../../helpers/user";
import { getEmoji } from "../../utils/Emoji";

export const checkProductByNameTool = createTool({
  id: "checkProductByNameTool",
  description:
    "This tool is used to check if a product exists in a supermarket",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person checking the product"),
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
  execute: async ({ context: { business_id, product_name, user_id } }) => {
    try {
      await getBusinessById(business_id);
      const resp = await getProductByBusinessIdAndProductName(business_id, product_name)
      if (!resp) return { success: false, data: {} };
      // const message = `<b>Yes ${resp.name} product is available</b>\n`;
      const mutated_resp = MutateProduct(resp);

      const reply_markup = {
        inline_keyboard: [
          [
            {
              text: "Add to Cart",
              callback_data: `addToCart_${resp.id}`
            },
          ],
        ],
      };

      if (resp) CheckoutEmitter.emit("foundProduct", { data: mutated_resp, user_id, message: `<b>Yes ${resp.name} is available 😊</b>\n`, reply_markup });

      return { success: true, data: {} };
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
    business_id: z.string().ulid().describe("The business ID of the supermarket"),
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
    try {
      const resp = await CartRepository.storeProductInCart(
        user_id,
        business_id,
        products
      );
      if (!resp) return { success: false, data: {} };
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
      console.log(getEmoji('mango'))
      const mutate_cart = MutateCartProducts(resp.products);
      const message = `<b>List of items in your cart</b>\n`;
      const reply_markup = {
        inline_keyboard: [
          [
            ...resp.products.map((product) => ({
              text: `Edit ${product.name[0].toUpperCase()}${product.name.slice(1)}/Remove ${product.name[0].toUpperCase()}${product.name.slice(1)} ${getEmoji(product.name)}`,
              callback_data: `cartProductId_${product.id}`
            }))
          ]
        ]
      };
      CheckoutEmitter.emit("readCartItems", {
        data: mutate_cart,
        message,
        user_id,
        reply_markup
      });
      if (!resp) return { success: false, data: {} };
      return { success: true, data: resp };
    } catch (e) {
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});

export const readAllStoreProducts = createTool({
  id: "readAllStoreProducts",
  description: "This tool is used to read all products in a supermarket",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person reading the cart"),
    business_id: z
      .string()
      .ulid()
      .describe("The business ID of the supermarket"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
    }),
  }),
  execute: async ({ context: { business_id, user_id } }) => {
    try {
      await Promise.all([getUserById(user_id), getBusinessById(business_id)]);
      const resp = await ProductRepository.readProductsByBusinessId(business_id);
      // if (!resp) return { success: false, data: [] };
      const message =
        resp.length > 0
          ? `<b>List of all store Products</b>\n`
          : `<b>No products found in this store.</b>`;
      const mutated_resp = MarkDownizeProducts(resp);
      CheckoutEmitter.emit("sendStoreProducts", {
        data: mutated_resp,
        user_id,
        message
      });
      return { success: true, data: { msg: "Products sent" } };
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

// export const 