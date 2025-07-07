import { getAdminByEmail, getAdminById, validateAdminByEmail } from "../helpers/admin";
import { generateJWT } from "../middleware/JWT";
import AdminRepository from "../repository/AdminRepository";
import UserRepository from "../repository/UserRepository";
import AdminResource from "../resource/admin";
import { verifyToken } from "../utils/Hashing";
import { BAD_REQUEST, CREATED, OK } from "../utils/Response";

export async function getUsers(admin_id: string) {
  const { business: { id }} = await getAdminById(admin_id)
  const users = await UserRepository.readAll(id);
  return OK(`Users fetched successfully`, users);
}

export async function createUser(data: any) {
  const { business_id, name } = data;
  const create = await UserRepository.create({ business_id, name })
  return CREATED('User created successfully', create)
}

// export async function loginAdmin(email: string, password: string) {
//   const admin = await getAdminByEmail(email)

//   const data = {
//     admin: AdminResource(admin)
//   }

//   const decrypt_pass = await verifyToken(password, admin.password)
//   const token = await generateJWT(data)
//   if(!decrypt_pass) return BAD_REQUEST(`Incorrect credentials 😔`)

//   return OK(`Admin login successfully`,{ ...data, token })
// }
