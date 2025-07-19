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
      console.log("Savining user email & phone to: ", user_id, email, phone)
      const resp = await UserRepository.updateModel(user_id, { email: email?.toLowerCase(), phone })
      console.log("Response doing that: ", resp)
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
      email: z.string().optional(),
      phone: z.string().optional()
  }),
  execute: async ({ inputData: { user_id } }) => {
    try {
      console.log('Fetching user')
      const user = await getUserById(user_id);
      console.log('Fetching user', user)
      return { 
        email: user.email || undefined, 
        phone: user.phone || undefined, 
        user_id 
      };
    } catch(e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  },
});

const humanInputStep = createStep({
  id: "human-input",
  inputSchema: z.object({
    user_id: z.string().describe("The user ID of the person fetching the email and phone number"),
    email: z.string().optional().describe("The email of the user"),
    phone: z.string().optional().describe("The phone number of the user"),
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
    email: z.string().optional().describe("The email of the user"),
    phone: z.string().optional().describe("The phone number of the user"),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    console.log("Workflow Step:", inputData, resumeData)
    
    // If we have resumeData (user provided email/phone), use it
    if (resumeData?.email && resumeData?.phone) {
      return {
        email: resumeData.email,
        phone: resumeData.phone,
        user_id: inputData.user_id,
      };
    }
    
    // If user already has both email and phone, continue without suspending
    if (inputData.email && inputData.phone) {
      return {
        email: inputData.email,
        phone: inputData.phone,
        user_id: inputData.user_id,
      };
    }
    
    // Otherwise, suspend and wait for user input
    return suspend({ 
      user_id: inputData.user_id, 
      email: inputData.email, 
      phone: inputData.phone 
    });
  },
});

const storeUserEmailPhoneStep = createStep(storeUserEmailPhoneTool)


const userCheckWorkflow = createWorkflow({
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

export { userCheckWorkflow, humanInputStep }