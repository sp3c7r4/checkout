import BusinessRepository from "../repository/BusinessRepository";
import { CE_BAD_REQUEST } from "../utils/Error";


export async function validateIfAddressExists(business_id: string) {
  const address = await BusinessRepository.readOneByBusinessId(business_id);
  if(address?.address_id) throw new CE_BAD_REQUEST('Address registered already')
  return false
}