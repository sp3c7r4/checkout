import { z } from "zod";

export const storeIdSchema = z.object({
  store_id: z.string().ulid()
})

export const businessIdSchema = z.object({
  id: z.string().ulid()
})

export const createAdminSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
})

export const loginAdminSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const businessSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

export const addressSchema = z.object({
  street: z.string().min(5),
  state: z.string().min(2),
  country: z.string().min(2),
  business_id: z.string().ulid()
})

export const userSchema = z.object({
  business_id: z.string().ulid(),
  name: z.string()
})

export const createProductSchema = z.object({
  name: z.string().min(2).toLowerCase(),
  image: z.string().url(),
  price: z.string().min(1),
  kg: z.string().min(1),
  business_id: z.string().ulid()
})