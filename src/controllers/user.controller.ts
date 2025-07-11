import {
  getAdminById,
} from "../helpers/admin";
import { getBusinessById } from "../helpers/business";
import UserRepository from "../repository/UserRepository";
import UserResource from "../resource/user";
import { CREATED, OK } from "../utils/Response";

export async function getUsers(data: any) {
  const { admin_id, business_id } = data;
  await Promise.all([getAdminById(admin_id), getBusinessById(business_id)]);
  const users = await UserRepository.readAllUserWithBusiness(business_id);
  return OK(
    `Users fetched successfully`,
    users.map((user) => UserResource(user))
  );
}

export async function createUser(data: any) {
  const { business_id, name } = data;
  const create = await UserRepository.create({ business_id, name });
  return CREATED("User created successfully", create);
}
