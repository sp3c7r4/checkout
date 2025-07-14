import CheckoutEmitter from "../Event";
import { getAdminByEmail, getAdminById, validateAdminByEmail, } from "../helpers/admin";
import { getBusinessById } from "../helpers/business";
import { generateJWT } from "../middleware/JWT";
import AdminRepository from "../repository/AdminRepository";
import AdminResource from "../resource/admin";
import BusinessResource from "../resource/business";
import { verifyToken } from "../utils/Hashing";
import { BAD_REQUEST, CREATED, OK } from "../utils/Response";

export async function createAdmin(data: any) {
  const { first_name, last_name, email, password } = data;
  await validateAdminByEmail(email);
  const create = await AdminRepository.create({
    first_name,
    last_name,
    email,
    password,
  });
  return CREATED(`Admin created successfully`, create);
}

export async function loginAdmin(email: string, password: string, ip: string) {
  const admin = await getAdminByEmail(email);
  console.log(admin)
  const data = {
    admin: AdminResource(admin),
    business: admin.business ? BusinessResource(admin.business) : undefined
  };

  const decrypt_pass = await verifyToken(password, admin.password);
  const token = await generateJWT({ admin: AdminResource(admin) });
  if (!decrypt_pass) return BAD_REQUEST(`Incorrect credentials 😔`);
  CheckoutEmitter.emit("sendLoginMail", { email: admin.email, name: admin.first_name, ip, });
  return OK(`Admin login successfully`, { ...data, token });
}

export async function getTotalRevenue(data: any) {
  const { admin_id, business_id } = data;
  await Promise.all([getAdminById(admin_id), getBusinessById(business_id)]);
}
