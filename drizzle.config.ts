import { defineConfig } from 'drizzle-kit'
import env from './src/config/env'

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: "postgresql",
  dbCredentials: {
    url: env.DB_MEMORY!,
  },
  schemaFilter: ['!vector', '!storage']
})