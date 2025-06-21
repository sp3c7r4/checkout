import { config } from 'dotenv'
import { z } from 'zod'

config({path: '.env'})

const EnvSchema = z.object({
  DB_MEMORY: z.string(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string()
})

export type EnvSchema = z.infer<typeof EnvSchema>

const env: Partial<EnvSchema> = { 
  ...process.env
}

export default env;

console.log(env.DB_MEMORY)