import bcrypt from 'bcryptjs'
import { db } from '../db'
import { admin } from '../db/schema'

export async function hashToken(input: string) {
  return await bcrypt.hash(input, 10)
}

export async function verifyToken(input: string, hashedToken: string) {
  return await bcrypt.compare(input, hashedToken)
}