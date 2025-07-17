import { createStep, createTool, createWorkflow } from "@mastra/core";
import UserRepository from "../../repository/UserRepository";
import { getUserById } from "../../helpers/user";
import { z } from "zod";
import CustomError from "../../utils/Error";
import CheckoutEmitter from "../../Event";

const storeUserEmailPhoneTool = createTool({
  id: "storeUserEmailPhoneTool",
  description: "This tool is used to store the user's email and phone number",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person storing the email and phone number"),
    email: z.string().email().describe("The email address of the user"),
    phone: z.string().describe("The phone number of the user with country code"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
    }),
  }),
  execute: async ({ context: { user_id, email, phone } }) => {
    try {
      await getUserById(user_id)
      const resp = await UserRepository.updateModel(user_id, { email, phone })
      if (!resp) return { success: false, data: { msg: "Failed to update user information" } };
      CheckoutEmitter.emit("storeEmailPhone", { user_id, message: `<b>Email and Phone updated successfully</b>` });
      return { success: true, data: { msg: "User information updated successfully" } };
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

const fetchUserEmailPhoneStep = createStep({
  id: "fetchUserEmailPhoneStep",
  description: "This step fetches the user's email and phone number",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
  }),
  outputSchema: z.object({
      user_id: z.string(),
      email: z.string(),
      phone: z.string()
  }),
  execute: async ({ inputData: { user_id } }) => {
    try {
      const user = await getUserById(user_id);
      return { email: user.email, phone: user.phone, user_id };
    } catch(e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  },
});

const humanInputStep = createStep({
  id: "human-input",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
    email: z.string().describe("The email of the user"),
    phone: z.string().describe("The phone number of the user"),
  }),
  outputSchema: z.object({
    user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
    email: z.string().describe("The email of the user"),
    phone: z.string().describe("The phone number of the user"),
  }),
  resumeSchema: z.object({
    email: z.string().describe("The email of the user"),
    phone: z.string().describe("The phone number of the user"),
  }),
  suspendSchema: z.object({
      user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
      email: z.string().describe("The email of the user"),
      phone: z.string().describe("The phone number of the user"),
    }),
  execute: async ({ inputData, resumeData, suspend, getInitData }) => {
    if (!resumeData?.email || !resumeData?.phone) {
      return suspend({ user_id: inputData?.user_id, email: inputData?.email, phone: inputData?.phone });
    }
 
    return {
      email: resumeData?.email,
      phone: resumeData?.phone,
      user_id: inputData?.user_id,
    };
  },
});

const storeUserEmailPhoneStep = createStep(storeUserEmailPhoneTool)


export const userCheckWorkflow = createWorkflow({
  id: 'userCheckWorkflow',
  description: 'This workflow checks the user email and phone number exists and stores it if not',
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      msg: z.string().optional(),
    }),
  }),
})
.then(fetchUserEmailPhoneStep)
.then(humanInputStep)
.then(storeUserEmailPhoneStep)
.commit()