import { validateIfAddressExists } from "../helpers/address";
import { getAdminByEmail, getAdminById, validateAdminByEmail } from "../helpers/admin";
import { getBusinessById, validateIfBusinessExists } from "../helpers/business";
import AddressRepository from "../repository/AddressRepository";
import BusinessRepository from "../repository/BusinessRepository";
import { verifyToken } from "../utils/Hashing";
import { BAD_REQUEST, CREATED, OK } from "../utils/Response";

export async function createBusiness(data: any) {
  const { name, email, admin_id } = data
  console.log({ name, email, admin_id })
  await getAdminById(admin_id)
  await validateIfBusinessExists(admin_id)
  const create = await BusinessRepository.create({ name, email, admin_id })
  return CREATED(`Business created successfully`,create)
}

export async function addAddress(business_id: string, data: any) {
  await getBusinessById(business_id)
  await validateIfAddressExists(business_id)
  const { street, state, country } = data;
  const create = await AddressRepository.createAndAttachAddress(business_id, { street, state, country })
  return CREATED(`Address created successful`, create)

}

export async function loginAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email)
  const decrypt_pass = await verifyToken(password, admin.password)
  if(!decrypt_pass) return BAD_REQUEST(`Incorrect credentials 😔`)

  return OK(`Admin login successfully`,admin)
}