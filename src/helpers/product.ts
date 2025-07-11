import ProductRepository from "../repository/ProductRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function getProductById(id: string) {
  const business = await ProductRepository.readOneById(id);
  if (!business) throw new CE_BAD_REQUEST(`Product doesn't exist`);
  return business;
}