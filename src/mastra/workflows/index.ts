import { createStep, createWorkflow } from "@mastra/core";
import { storeUserEmailPhoneTool } from "../tools";
import UserRepository from "../../repository/UserRepository";
import { getUserById } from "../../helpers/user";
import { z } from "zod";

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