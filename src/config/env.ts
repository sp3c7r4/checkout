import { config } from 'dotenv'
import { z } from 'zod'

config({path: '.env'})

const EnvSchema = z.object({
  DB_MEMORY: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string(),
  JWT_SECRET: z.string()
})

export type EnvSchema = z.infer<typeof EnvSchema>

// Parse and validate environment variables
const env = EnvSchema.parse(process.env)

export default env

// Debug logging
console.log('JWT_SECRET loaded:', !!env.JWT_SECRET)