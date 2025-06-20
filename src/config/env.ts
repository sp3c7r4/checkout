import {config} from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config({path: '.env'}))

const EnvSchema = z.object({
  DB_MEMORY: z.string()
})

export type EnvSchema = z.infer<typeof EnvSchema>

const env: EnvSchema = {...process.env}

export default env;