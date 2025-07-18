import { getAdminById } from "../helpers/admin";
import { getBusinessById } from "../helpers/business";
import OrderRepository from "../repository/OrderRepository";
import OrderResource from "../resource/order";
import { OK } from "../utils/Response";

export async function getUserOrders(admin_id: string, business_id: string) {
  await Promise.all([ getAdminById(admin_id), getBusinessById(business_id) ]);
  const orders = await OrderRepository.readOrderByBusinessId(business_id);
  return OK(`Orders fetched successfully`, orders.map(order => OrderResource(order)));
}