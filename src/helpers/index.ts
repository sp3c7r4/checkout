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
