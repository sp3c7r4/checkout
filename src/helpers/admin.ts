import AdminRepository from "../repository/AdminRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function validateAdminByEmail(email: string) {
  const Admin = await AdminRepository.readOneByEmail(email);
  if (Admin) throw new CE_BAD_REQUEST("Email already exists.");
  return true;
}

export async function getAdminByEmail(email: string) {
  const Admin = await AdminRepository.readOneByEmail(email);
  if (!Admin) throw new CE_BAD_REQUEST(`Admin doesn't exist`);
  if (!Admin.password)
    throw new CE_BAD_REQUEST(
      `'Please use the link sent to your mail to add a password'`
    );
  return Admin;
}

export async function getAdminById(id: string) {
  const Admin = await AdminRepository.readOneById(id);
  if (!Admin) throw new CE_BAD_REQUEST(`Admin doesn't exist`);
  if (!Admin.password)
    throw new CE_BAD_REQUEST(
      `'Please use the link sent to your mail to add a password'`
    );
  return Admin;
}