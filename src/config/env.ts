import { config } from 'dotenv'
import { z } from 'zod'

config({path: '.env'})

const EnvSchema = z.object({
  DB_MEMORY: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  JWT_SECRET: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  GOOGLE_CREDENTIALS_PATH: z.string(),
  TOKEN_PATH: z.string(),
  CHECKOUT_MAIL: z.string(),
  IMAGE_PATH: z.string(),
  CHECKOUT_MAIL_PASSWORD: z.string(),
  CHECKOUT_MAIL_PASSWORD2: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  PAYSTACK_SECRET_KEY: z.string(),
  // REDIS_HOST: z.string(),
  // REDIS_PORT: z.string(),
  // // REDIS_PASSWORD: z.string(),
  // REDIS_DB: z.string(),
  // SESSION_TTL: z.string(),
})

export type EnvSchema = z.infer<typeof EnvSchema>

// Parse and validate environment variables
const env = EnvSchema.parse(process.env)

export default env

// Debug logging
Object.entries(env).forEach(([key, value]) => console.log(`${key}: ${!!value}`));