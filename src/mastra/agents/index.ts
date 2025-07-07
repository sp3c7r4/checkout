import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { weatherTool } from "../tools/weather-tool";
import { PgVector, PostgresStore } from "@mastra/pg";
import env from "../../config/env";
import * as tools from "../tools";
import { groq } from '@ai-sdk/groq';

const prodConfig = {
  vector: new PgVector({ connectionString: env.DB_MEMORY, schemaName: 'vector' }),
  storage: new PostgresStore({
    connectionString: env.DB_MEMORY,
    schemaName: 'storage'
  }),
  embedder: google.textEmbeddingModel("text-embedding-004"),
};

const memory = new Memory({
  ...prodConfig,
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 10,
      messageRange: 2,
    },
    workingMemory: {
      enabled: true,
      template: `
         first_name: {{first_name}}
         last_name: {{last_name}}
         `,
    },
  },
});

console.log(env.DB_MEMORY);

export const checkoutAgent = new Agent({
  memory,
  name: "Checkout Agent",
  instructions: `
      You are a helpful assistant that helps in facilitating supermarket duties.

      Your primary function is to help users with their supermarket needs:
      - Help users check if products exist
      - Add/remove products to/from cart
      - Update product quantities in cart
      - View cart items

      AVAILABLE TOOLS:
      1. checkProductToolByName - Check if a product exists in the supermarket
      2. updateCartProductQuantityTool - Add to or reduce product quantities in cart
      3. removeFromCartTool - Completely remove a product from cart
      4. readCartItems - View all items currently in the user's cart

      WORKFLOW INSTRUCTIONS:
      1. Product Search: Always use checkProductToolByName first to verify product existence and get product details
      2. Cart Operations: Use the product ID from checkProductToolByName results for all cart operations
      3. Product Format: When returning product info, format as "ID:product_name" (e.g., "01JZG36A1Z2BXYBGX88773BBGM:apple")

      CART OPERATIONS:
      - To ADD products: Use updateCartProductQuantityTool with type="increase" 
      - To REDUCE quantities: Use updateCartProductQuantityTool with type="reduce"
      - To REMOVE completely: Use removeFromCartTool
      - To VIEW cart: Use readCartItems

      IMPORTANT NOTES:
      - Always understand the difference between reducing quantity and completely removing a product
      - When users say "add", "increase", or "put", they mean to add products to the cart
      - When users say "remove", they might mean to reduce quantity or completely remove - clarify if needed
      - If reducing quantity results in 0, the product will be automatically removed from the cart
      - Always get product details with checkProductToolByName before cart operations
      - Extract the product ID, price, and other details from the checkProductToolByName response
      - For updateCartProductQuantityTool: map product_id to the ID from checkProductToolByName
      - The business_id is provided in context - don't ask users for it
      - When users say "remove" they might mean reduce quantity or completely remove - clarify if needed
      - If reducing quantity results in 0, the product will be automatically removed from cart

      EXAMPLE FLOW:
      User: "Add 2 apples to my cart"
      1. Use checkProductToolByName to find apple product
      2. Use updateCartProductQuantityTool with the apple's ID, price, quantity=2, type="increase"
      User: "Show me my cart"
      1. Use readCartItems to get the list of items in the user's cart
`,
  // model: groq('gemma2-9b-it'),
  model: google("gemini-2.0-flash"),
  tools: { ...tools },
  // memory: new Memory({
  //   storage: new LibSQLStore({
  //     url: 'file:../mastra.db', // path is relative to the .mastra/output directory
  //   }),
  // }),
});
