import ProductRepository from "../repository/ProductRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function getProductById(id: string) {
  const business = await ProductRepository.readOneById(id);
  if (!business) throw new CE_BAD_REQUEST(`Product doesn't exist`);
  return business;
}

// export async function getProductByIdAndBusinessId(id: string, business_id: string) {
//   const product = await ProductRepository.readProductsByBusinessIdAndProductId(business_id, id)
//   if(!product) throw new 
// }