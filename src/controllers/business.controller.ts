import {
  getAdminById,
} from "../helpers/admin";
import { getBusinessById, validateIfBusinessExists } from "../helpers/business";
import AddressRepository from "../repository/AddressRepository";
import BusinessRepository from "../repository/BusinessRepository";
import BusinessResource from "../resource/business";
import { CREATED, OK } from "../utils/Response";

export async function createBusiness(data: any) {
  const { name, email, admin_id, street, state, country } = data;
  await getAdminById(admin_id);
  await validateIfBusinessExists(admin_id);
  const create = await BusinessRepository.create({ name, email, admin_id });
  const create_address = await AddressRepository.create({
    business_id: create.id,
    street,
    state,
    country,
  });
  const res = { ...BusinessResource({ ...create, address: create_address }) };
  return CREATED(`Business created successfully`, res);
}

export async function updateBusiness(data: any) {
  const { business_id, name, email, street, state, country, admin_id } = data;
  await getAdminById(admin_id);
  const business = await getBusinessById(business_id);
  let business_update: any;
  let address_update: any;
  if (name || email) {
    business_update = await BusinessRepository.updateModel(business.id, {
      name,
      email,
    });
  }
  if (street || state || country) {
    address_update = await AddressRepository.updateModel(business.address.id, {
      street,
      state,
      country,
    });
  }
  const res = {
    ...BusinessResource({ ...business_update, address: address_update }),
  };
  return OK(`Business updated successfully`, res);
}
