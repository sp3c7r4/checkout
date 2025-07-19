import { createTool } from "@mastra/core";
import { z } from "zod";
import ProductRepository from "../../repository/ProductRepository";
import CartRepository from "../../repository/CartRepository";
import CustomError from "../../utils/Error";
import {
  createProductsKeyboard,
  getProductByBusinessIdAndProductName,
  MarkDownizeProducts,
  MutateCartProducts,
  MutateProduct,
} from "../../helpers/bot";
import CheckoutEmitter from "../../Event";
import { getUserById } from "../../helpers/user";
import { getEmoji } from "../../utils/Emoji";
import Paystack from "../../utils/Paystack";
import OrderRepository from "../../repository/OrderRepository";

export const checkProductByNameTool = createTool({
  id: "checkProductByNameTool",
  description:
    "This tool is used to check if a product exists in a supermarket",
  inputSchema: z.object({
    user_id: z
      .string()
      .describe("The user ID of the person checking the product"),
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
      if (!current_business_id)
        return {
          success: false,
          data: {
            msg: `I don't think you're linked to a store please do that.`,
          },
        };

      const resp = await getProductByBusinessIdAndProductName(
        current_business_id,
        product_name
      );
      if (!resp)
        return {
          success: false,
          data: { msg: `I couldn't find the product you're looking for.` },
        };

      const mutated_resp = MutateProduct(resp);
      const reply_markup = {
        inline_keyboard: [
          [{ text: "Add to Cart", callback_data: `addToCart_${resp.id}` }],
        ],
      };

      if (resp)
        CheckoutEmitter.emit("foundProduct", {
          data: mutated_resp,
          user_id,
          message: `<b>Yes ${resp.name} is available 😊</b>\n`,
          reply_markup,
        });

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
      if (!current_business_id)
        return {
          success: false,
          data: {
            msg: `I don't think you're linked to a store please do that.`,
          },
        };

      const resp = await CartRepository.readCartByUserAndBusiness(
        user_id,
        current_business_id
      );

      const mutate_cart =
        resp.products.length > 0 ? MutateCartProducts(resp.products) : ``;
      const message =
        resp.products.length > 0
          ? `<b>List of items in your cart</b>\n`
          : `<b>No items found in your cart</b>\n`;
      const reply_markup = {
        inline_keyboard: resp.products.reduce((acc, product, index) => {
          const button = {
            text: `Edit ${product.name[0].toUpperCase()}${product.name.slice(1)}/Remove ${product.name[0].toUpperCase()}${product.name.slice(1)} ${getEmoji(product.name)}`,
            callback_data: `cartProductId_${product.id}`,
          };

          if (index % 2 === 0) {
            acc.push([button]);
          } else {
            acc[acc.length - 1].push(button);
          }

          return acc;
        }, [] as any[]),
      };
      CheckoutEmitter.emit("readCartItems", {
        data: mutate_cart,
        message,
        user_id,
        reply_markup,
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
    user_id: z.string().describe("The user ID of the person reading the cart"),
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
      if (!current_business_id)
        return {
          success: false,
          data: {
            msg: `I don't think you're linked to a store please do that.`,
          },
        };

      // await Promise.all([getUserById(user_id), getBusinessById(current_business_id)]);
      const resp =
        await ProductRepository.readProductsByBusinessId(current_business_id);

      const message =
        resp.length > 0
          ? `<b>List of all store Products</b>\n`
          : `<b>No products found in this store.</b>`;
      const mutated_resp = MarkDownizeProducts(resp);
      const reply_markup = createProductsKeyboard(resp);
      CheckoutEmitter.emit("sendStoreProducts", {
        reply_markup,
        user_id,
        message,
      });

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
    user_id: z
      .string()
      .describe("The user ID of the person making the payment"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
      data: z.object({}).optional(),
    }),
  }),
  execute: async ({ context: { user_id } }) => {
    try {
      const { current_business_id, email } = await getUserById(user_id);
      if (!current_business_id)
        return {
          success: false,
          data: {
            msg: `I don't think you're linked to a store please do that.`,
          },
        };

      const cart = await CartRepository.readCartByUserAndBusiness(
        user_id,
        current_business_id
      );
      if (!cart || cart.products.length === 0)
        return { success: false, data: { msg: "No items found in your cart" } };

      const total_price: number = cart.products.reduce((sum, product) => {
        const itemTotal = Number(product.price) * Number(product.quantity);
        return sum + itemTotal;
      }, 0);

      console.log("Total Price: ", total_price);

      const { id: order_id } = await OrderRepository.create({
        user_id,
        total_price,
        products: cart.products,
        business_id: current_business_id,
      });

      const metadata = { order_id };
      const { data } = await Paystack.initializePayment(
        total_price * 100,
        email,
        metadata
      );
      console.log("Paystack Data: ", data);
      const reply_markup = {
        inline_keyboard: [
          [
            {
              text: "Click to make payment",
              web_app: { url: data?.authorization_url },
            },
          ],
        ],
      };
      CheckoutEmitter.emit("paymentEvent", {
        user_id,
        message: ``,
        reply_markup,
      });
      return {
        success: true,
        data: { msg: "Payment link initialized successfully", data },
      };
    } catch (e) {
      if (e instanceof CustomError) {
        console.error(e.message);
        const { message: msg } = e;
        return { success: false, data: { msg } };
      }
      console.error(e.message);
      return {
        success: false,
        data: { msg: e instanceof Error ? e.message : String(e) },
      };
    }
  },
});

// Store for suspended workflow runs
const suspendedWorkflows = new Map<string, any>();

export const userCheckWorkflowTool = createTool({
  id: "userCheckWorkflowTool",
  description:
    "This tool manages the user email and phone verification workflow with suspend/resume capability",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID"),
    action: z
      .enum(["start", "resume"])
      .describe("Whether to start or resume the workflow"),
    email: z
      .string()
      .email()
      .optional()
      .describe("Email address when resuming"),
    phone: z.string().optional().describe("Phone number when resuming"),
  }),
  outputSchema: z.object({
    status: z.enum(["completed", "suspended", "error"]),
    message: z.string(),
    suspendData: z.object({}).optional(),
  }),
  execute: async ({ context: { user_id, action, email, phone }, mastra }) => {
    try {
      console.log("userCheckWorkflowTool called with:", {
        user_id,
        action,
        email,
        phone,
      });

      if (action === "start") {
        console.log("Starting workflow for user:", user_id);

        // Create new workflow run
        const workflow = mastra?.getWorkflow("userCheckWorkflow");
        if (!workflow) {
          return { status: "error", message: "Workflow not found" };
        }

        const run = await workflow.createRunAsync();
        const result = await run.start({ inputData: { user_id } });

        console.log("Workflow start result:", result);

        if (result.status === "suspended") {
          // Store the run for later resumption
          suspendedWorkflows.set(user_id, run);
          console.log("Workflow suspended for user:", user_id);

          return {
            status: "suspended",
            message: "Please provide your email and phone number",
            suspendData: result.steps["human-input"]?.suspendPayload || {},
          };
        } else if (result.status === "success") {
          // Workflow completed immediately (user already has data)
          console.log("Workflow completed for user:", user_id);
          return {
            status: "completed",
            message: "User verification completed",
          };
        } else {
          console.log("Workflow failed:", result);
          return {
            status: "error",
            message: "Workflow execution failed",
          };
        }
      } else if (action === "resume") {
        console.log("Resuming workflow for user:", user_id, "with data:", {
          email,
          phone,
        });

        if (!email || !phone) {
          return {
            status: "error",
            message: "Email and phone are required for resume",
          };
        }

        // Get the suspended run
        const run = suspendedWorkflows.get(user_id);
        if (!run) return { status: "error", message: "No suspended workflow found for this user", };

        // Resume the workflow
        const result = await run.resume({ step: "human-input", resumeData: { email, phone }, });

        console.log("Workflow resume result:", result);

        // Clean up
        suspendedWorkflows.delete(user_id);

        if (result.status === "success") {
          console.log("Workflow resumed and completed for user:", user_id);
          return {
            status: "completed",
            message: "User information saved successfully",
          };
        } else {
          console.log("Workflow resume failed:", result);
          return {
            status: "error",
            message: "Failed to complete workflow after resume",
          };
        }
      }

      return { status: "error", message: "Invalid action" };
    } catch (error) {
      console.error("Workflow tool error:", error);
      // Clean up on error
      suspendedWorkflows.delete(user_id);
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});