import { getAdminByEmail, getAdminById, validateAdminByEmail } from "../helpers/admin";
import { generateJWT } from "../middleware/JWT";
import AdminRepository from "../repository/AdminRepository";
import CartRepository from "../repository/CartRepository";
import UserRepository from "../repository/UserRepository";
import AdminResource from "../resource/admin";
import { verifyToken } from "../utils/Hashing";
import { BAD_REQUEST, CREATED, OK } from "../utils/Response";

export async function getCarts(admin_id: string, business_id: string) {
  await getAdminById(admin_id)
  const carts = await CartRepository.readCartByBusiness(business_id);
  return OK(`Carts fetched successfully`, carts);
}