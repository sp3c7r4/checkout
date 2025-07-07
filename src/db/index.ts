import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from './schema'
import { config } from 'dotenv'
import env from "../config/env";

config({ path: ".env.development" })
export const db = drizzle({
  connection: env.DB_MEMORY!,
  schema
});