import { Context, Next } from "hono";
import { ContextWithMastra } from "@mastra/core/server";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "./Response";
import CustomError from "./Error";

// Fix: Return a proper middleware function
const tryCatch =
  (controller: (c: ContextWithMastra) => Promise<Response>) =>
  async (c: ContextWithMastra, _next: Next): Promise<Response> => {
    try {
      return await controller(c);
    } catch (error: any) {
      if (error instanceof CustomError) {
        const { status, status_code, message } = error;
        switch (status) {
          case "BAD_REQUEST":
            return c.json(BAD_REQUEST(error.message), status_code as any);
          case "INTERNAL_SERVER_ERROR":
            return c.json(INTERNAL_SERVER_ERROR(error.message), status_code as any);
          default:
            return c.json(INTERNAL_SERVER_ERROR(error.message), 500);
        }
      }
      console.error("Error occurred:", error);
      return c.json(BAD_REQUEST(error.message, error.message), 400);
    }
  };

export default tryCatch;