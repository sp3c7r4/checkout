import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { checkoutAgent } from "./agents";
import { registerApiRoute } from "@mastra/core/server";

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
    host: "0.0.0.0",
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
    ],
  },
});
