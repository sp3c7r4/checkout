import { getAdminById } from "../helpers/admin";
import ProductRepository from "../repository/ProductRepository";
import { CREATED, OK } from "../utils/Response";
import { getBusinessById } from "../helpers/business";
import { getProductById } from "../helpers/product";

export async function getProducts(data: any) {
  const { business_id, admin_id } = data;
  await Promise.all([getAdminById(admin_id), getBusinessById(business_id)]);
  const res = await ProductRepository.readProductsByBusinessId(business_id);
  return OK("Products fetched successfully", res);
}

export async function getSingleProduct(
  business_id: string,
  product_id: string
) {
  const res = await ProductRepository.readProductsByBusinessIdAndProductId(
    business_id,
    product_id
  );
  return OK("Product fetched successfully", res || {});
}

export async function createProduct(product: any) {
  const {
    name,
    image,
    price,
    kg,
    description,
    quantity,
    business_id,
    admin_id,
  } = product;
  // Validations
  await Promise.all([getAdminById(admin_id), getBusinessById(business_id)]);

  const res = await ProductRepository.create({
    name,
    description,
    image,
    price,
    kg,
    quantity,
    business_id,
  });
  return CREATED("Product created successfully", res);
}

export async function updateProduct(data: any) {
  const {
    product_id,
    business_id,
    admin_id,
    name,
    image,
    price,
    kg,
    description,
    quantity,
  } = data;
  await Promise.all([
    getAdminById(admin_id),
    getBusinessById(business_id),
    getProductById(product_id),
  ]);
  if (!name || !image || !price || !kg || !description || !quantity)
    return OK("Product updated successfully", {});
  const update_product = await ProductRepository.updateModel(product_id, {
    name,
    image,
    price,
    kg,
    description,
    quantity,
  });
  return OK("Product updated successfully", update_product);
}

export async function deleteProduct(data: any) {
  const { business_id, product_id, admin_id } = data;
  await Promise.all([
    getAdminById(admin_id),
    getBusinessById(business_id),
    getProductById(product_id),
  ]);
  const res = await ProductRepository.deleteModel(product_id);
  return OK("Product deleted successfully", res);
}
