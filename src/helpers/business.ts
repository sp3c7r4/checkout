import BusinessRepository from "../repository/BusinessRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function validateIfBusinessExists(admin_id: string) {
  const business = await BusinessRepository.readOneByAdminId(admin_id);
  if(business) throw new CE_BAD_REQUEST('Business registered already')
  return false
}

export async function getBusinessById(id: string) {
  const business = await BusinessRepository.readOneById(id);
  if (!business) throw new CE_BAD_REQUEST(`Business doesn't exist`);
  return business;
}
