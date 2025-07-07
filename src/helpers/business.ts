import AdminRepository from "../repository/AdminRepository";
import BusinessRepository from "../repository/BusinessRepository";
import { CE_BAD_REQUEST } from "../utils/Error";


export async function validateIfBusinessExists(admin_id: string) {
  const business = await BusinessRepository.readOneById(admin_id);
  console.log(business)
  if(business) throw new CE_BAD_REQUEST('Business registered already')
  return false
}

export async function getBusinessById(id: string) {
  const business = await BusinessRepository.readOneById(id);
  if (!business) throw new CE_BAD_REQUEST(`Business doesn't exist`);
  return business;
}

// export async function getAdminByEmail(email: string) {
//   const Admin = await AdminRepository.readOneByEmail(email);
//   if (!Admin) throw new CE_BAD_REQUEST(`Admin doesn't exist`);
//   if (!Admin.password)
//     throw new CE_BAD_REQUEST(
//       `'Please use the link sent to your mail to add a password'`
//     );
//   return Admin;
// }

// export async function getAdminByEmail(email: string) {
//   const Admin = await AdminRepository.readOneByEmail(email);
//   if (!Admin) throw new CE_BAD_REQUEST(`Admin doesn't exist`);
//   if (!Admin.password)
//     throw new CE_BAD_REQUEST(
//       `'Please use the link sent to your mail to add a password'`
//     );
//   return Admin;
// }
