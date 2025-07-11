import BusinessRepository from "../repository/BusinessRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function validateIfAddressExists(business_id: string) {
  const business = await BusinessRepository.readOneByBusinessId(business_id);
  if(business?.address) throw new CE_BAD_REQUEST('Address registered already')
  return false
}