import ProductRepository from "../repository/ProductRepository";
import { CREATED, OK } from "../utils/Response";

export async function getProducts(business_id: string) {
  console.log(business_id)
  const res = await ProductRepository.readProductsByBusinessId(business_id);
  console.log("Fetch Products", res)
  return OK("Products fetched successfully", res);
}

export async function getSingleProduct(business_id: string, product_id: string) {
  const res = await ProductRepository.readProductsByBusinessIdAndProductId(business_id, product_id);
  return OK("Product fetched successfully", res || {});
}

export async function createProduct(product: any) {
  const {name, image, price, kg, business_id } = product;
  console.log({name, image, price, kg, business_id })
  const res = await ProductRepository.create({name: name?.toLowerCase(), image, price, kg, business_id });
  return CREATED("Product created successfully", res);
}