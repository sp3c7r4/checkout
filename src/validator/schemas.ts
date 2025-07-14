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
  name: z.string().min(2).toLowerCase(),
  email: z.string().email().toLowerCase()
})

export const addressSchema = z.object({
  street: z.string().min(5).toLowerCase(),
  state: z.string().min(2).toLowerCase(),
  country: z.string().min(2).toLowerCase()
})

export const businessAddressSchema = businessSchema.merge(addressSchema)

export const userSchema = z.object({
  business_id: z.string().ulid(),
  name: z.string()
})

export const createProductSchema = z.object({
  name: z.string().min(2).toLowerCase(),
  image: z.string().url(),
  price: z.string().min(1),
  quantity: z.number(),
  description: z.string(),
  kg: z.string().min(1),
  business_id: z.string().ulid()
})

export const businessIDSchema = z.object({
  business_id: z.string().ulid()
})

export const productIDSchema = z.object({
  product_id: z.string().ulid()
})

export const settingsSchema = z.object({
  // settings_id, mass_view, notifications, weekly_reports
  settings_id: z.string().ulid().optional(),
  mass_view: z.boolean().optional(),
  notifications: z.boolean().optional(),
  weekly_reports: z.boolean().optional()
})

export const productUpdateSchema = createProductSchema.partial()
export const productDeleteSchema = businessIDSchema.merge(productIDSchema)
export const businessUpdateSchema = businessIDSchema.merge(businessAddressSchema.partial())
