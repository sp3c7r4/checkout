import { sql } from 'drizzle-orm';
import { db } from '../db';
import { hashToken } from '../utils/Hashing';

export async function encryptDataPassword(data: any) {
  if (data.password) {
    data.password = await hashToken(data.password);
  }
  return data;
}

export function validateDataCheck(data: any) {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No data provided');
  }
}

export async function deleteWithIndex(index: number) {
  return await db.execute(sql`
    WITH to_delete AS (
      SELECT id FROM storage.mastra_messages
      ORDER BY "createdAt"
      OFFSET ${sql.raw(index.toString())} LIMIT 1
    )
    DELETE FROM storage.mastra_messages
    WHERE id IN (SELECT id FROM to_delete);
    `)
}