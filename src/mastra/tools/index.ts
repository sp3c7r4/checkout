import { createTool } from "@mastra/core";
import { z } from "zod";
import ProductRepository from "../../repository/ProductRepository";
import CartRepository from "../../repository/CartRepository";
import CustomError from "../../utils/Error";
import { createProductsKeyboard, getProductByBusinessIdAndProductName, MarkDownizeProducts, MutateCartProducts, MutateProduct } from "../../helpers/bot";
import CheckoutEmitter from "../../Event";
import { getBusinessById } from "../../helpers/business";
import { getUserById } from "../../helpers/user";
import { getEmoji } from "../../utils/Emoji";
import UserRepository from "../../repository/UserRepository";
import Paystack from "../../utils/Paystack";
import PaymentRepository from "../../repository/PaymentRepository";
import OrderRepository from "../../repository/OrderRepository";

export const checkProductByNameTool = createTool({
  id: "checkProductByNameTool",
  description:
    "This tool is used to check if a product exists in a supermarket",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person checking the product"),
    product_name: z
      .string()
      .describe("The name of the product you want to check"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { product_name, user_id } }) => {
    try {
      const { current_business_id } = await getUserById(user_id);
      if (!current_business_id) return { success: false, data: { msg: `I don't think you're linked to a store please do that.`}}

      const resp = await getProductByBusinessIdAndProductName(current_business_id, product_name)
      if (!resp) return { success: false, data: { msg: `I couldn't find the product you're looking for.`} };

      const mutated_resp = MutateProduct(resp);
      const reply_markup = { inline_keyboard: [ [ { text: "Add to Cart", callback_data: `addToCart_${resp.id}` }, ], ], };

      if (resp) CheckoutEmitter.emit("foundProduct", { data: mutated_resp, user_id, message: `<b>Yes ${resp.name} is available 😊</b>\n`, reply_markup });

      return { success: true, data: { resp: mutated_resp } };
    } catch (e) {
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
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({}),
  }),
  execute: async ({ context: { user_id } }) => {
    try {
      const { current_business_id } = await getUserById(user_id);
      if (!current_business_id) return { success: false, data: { msg: `I don't think you're linked to a store please do that.`}}

      const resp = await CartRepository.readCartByUserAndBusiness( user_id, current_business_id );

      const mutate_cart = resp.products.length > 0 ? MutateCartProducts(resp.products) : ``;
      const message = resp.products.length > 0 ? `<b>List of items in your cart</b>\n` : `<b>No items found in your cart</b>\n`;
      const reply_markup = {
        inline_keyboard: resp.products.reduce((acc, product, index) => {
          const button = {
        text: `Edit ${product.name[0].toUpperCase()}${product.name.slice(1)}/Remove ${product.name[0].toUpperCase()}${product.name.slice(1)} ${getEmoji(product.name)}`,
        callback_data: `cartProductId_${product.id}`
          };
          
          if (index % 2 === 0) {
        acc.push([button]);
          } else {
        acc[acc.length - 1].push(button);
          }
          
          return acc;
        }, [] as any[])
      };
      CheckoutEmitter.emit("readCartItems", {
        data: mutate_cart,
        message,
        user_id,
        reply_markup
      });
      if (!resp) return { success: false, data: { mutate_cart } };
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
    user_id: z.string().describe("The user ID of the person reading the cart")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
    }),
  }),
  execute: async ({ context: { user_id } }) => {
    try {
      const { current_business_id } = await getUserById(user_id);
      if (!current_business_id) return { success: false, data: { msg: `I don't think you're linked to a store please do that.`}};
      
      // await Promise.all([getUserById(user_id), getBusinessById(current_business_id)]);
      const resp = await ProductRepository.readProductsByBusinessId(current_business_id);

      const message = resp.length > 0 ? `<b>List of all store Products</b>\n` : `<b>No products found in this store.</b>`;
      const mutated_resp = MarkDownizeProducts(resp);
      const reply_markup = createProductsKeyboard(resp)
      CheckoutEmitter.emit("sendStoreProducts", { reply_markup, user_id, message });

      return { success: true, data: { msg: "Products sent", mutated_resp } };
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

export const placeOrderForCartItemsTool = createTool({
  id: "placeOrderForCartItemsTool",
  description: "This tool is used to place an order for cart items",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person making the payment"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
      data: z.object({}).optional()
    }),
  }),
  execute: async ({ context: { user_id }}) => {
    try {
      const { current_business_id, email } = await getUserById(user_id);
      if (!current_business_id) return { success: false, data: { msg: `I don't think you're linked to a store please do that.`}}

      const cart = await CartRepository.readCartByUserAndBusiness(user_id, current_business_id);
      if (!cart || cart.products.length === 0) return { success: false, data: { msg: "No items found in your cart" } };

      const total_price: number = cart.products.reduce((sum, product) => {
        const itemTotal = Number(product.price) * Number(product.quantity);
        return sum + itemTotal;
      }, 0);

      console.log("Total Price: ",total_price)
      
      const { id: order_id } = await OrderRepository.create({
        user_id,
        total_price,
        products: cart.products,
        business_id: current_business_id,
      });

      const metadata = { order_id };
      const { data } = await Paystack.initializePayment(total_price * 100, email, metadata);
      console.log("Paystack Data: ", data)
      const reply_markup = {
        inline_keyboard: [[{
          text: "Click to make payment",
          web_app: { url: data?.authorization_url }
        }]]
      }
      CheckoutEmitter.emit("paymentEvent", { user_id, message: ``, reply_markup });
      return { success: true, data: { msg: "Payment link initialized successfully", data } };
    } catch (e) {
      if (e instanceof CustomError) {
        console.error(e.message)
        const { message: msg } = e;
        return { success: false, data: { msg } };
      }
      console.error(e.message)
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  }
})


//   id: "storeUserEmailPhoneTool",
//   description: "This tool is used to store the user's email and phone number",
//   inputSchema: z.object({
//     user_id: z.string().describe("The user ID of the person storing the email and phone number"),
//     email: z.string().email().describe("The email address of the user"),
//     phone: z.string().describe("The phone number of the user with country code"),
//   }),
//   outputSchema: z.object({
//     success: z.boolean(),
//     data: z.object({
//       msg: z.string().optional(),
//     }),
//   }),
//   execute: async ({ context: { user_id, email, phone } }) => {
//     try {
//       await getUserById(user_id)
//       const resp = await UserRepository.updateModel(user_id, { email, phone })
//       if (!resp) return { success: false, data: { msg: "Failed to update user information" } };
//       CheckoutEmitter.emit("storeEmailPhone", { user_id, message: `<b>Email and Phone updated successfully</b>` });
//       return { success: true, data: { msg: "User information updated successfully" } };
//     } catch (e) {
//       if (e instanceof CustomError) {
//         const { message: msg } = e;
//         return { success: false, data: { msg } };
//       }
//       return {
//         success: false,
//         data: { msg: e instanceof Error ? e.message : String(e) },
//       };
//     }
//   },
// })
// export const storeUserEmailPhoneTool = createTool({

// export const updateCartProductQuantityTool = createTool({
//   id: "updateCartProductQuantityTool",
//   description:
//     "This tool is used to increase or decrease the quantity of one or more products in the user's cart.",
//   inputSchema: z.object({
//     user_id: z.string().describe("The user ID of the person updating the cart"),
//     business_id: z.string().ulid().describe("The business ID of the supermarket"),
//     products: z.array(
//       z.object({
//         product_id: z.string(),
//         price: z.number(),
//         quantity: z
//           .number()
//           .describe("The quantity to add or subtract from the cart"),
//         type: z
//           .enum(["reduce", "increase"])
//           .default("increase")
//           .describe(
//             'Specify "increase" to add or "reduce" to subtract quantity from the cart'
//           ),
//       }).describe("Product details as obtained from checkProductToolByName")
//     ).describe("List of products to update in the cart"),
//   }),
//   outputSchema: z.object({
//     success: z.boolean(),
//     data: z.object({}),
//   }),
//   execute: async ({ context: { user_id, business_id, products } }) => {
//     try {
//       const resp = await CartRepository.storeProductInCart(
//         user_id,
//         business_id,
//         products
//       );
//       if (!resp) return { success: false, data: {} };
//       return { success: true, data: resp };
//     } catch (e) {
//       return {
//         success: false,
//         data: { msg: e instanceof Error ? e.message : String(e) },
//       };
//     }
//   },
// });

// export const removeFromCartTool = createTool({
//   id: "removeFromCartTool",
//   description: "This tool is used to remove a product from the cart",
//   inputSchema: z.object({
//     user_id: z
//       .string()
//       .describe("The user ID of the person removing the product from the cart"),
//     business_id: z
//       .string()
//       .ulid()
//       .describe("The business ID of the supermarket"),
//     product_id: z
//       .string()
//       .describe("The id of the product you want to remove from the cart"),
//   }),
//   outputSchema: z.object({
//     success: z.boolean(),
//     data: z.object({}),
//   }),
//   execute: async ({ context: { user_id, business_id, product_id } }) => {
//     try {
//       const resp = await CartRepository.removeProductFromCart(
//         user_id,
//         business_id,
//         product_id
//       );
//       if (!resp) return { success: false, data: {} };
//       return { success: true, data: { msg: "Product removed successfully"} };
//     } catch (e) {
//       if (e instanceof CustomError) {
//         const { message: msg } = e;
//         return { success: false, data: { msg } };
//       }
//       return {
//         success: false,
//         data: { msg: e instanceof Error ? e.message : String(e) },
//       };
//     }
//   },
// });
