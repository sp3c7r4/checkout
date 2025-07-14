import ProductRepository from "../repository/ProductRepository";

export function MarkDownizeProducts(products) {
  return `${products.map((product, index) => `
${index + 1}. <b>${product.name}</b> - ₦${product.price}
<b>QUANTITY</b>: ${product.quantity} pcs
<b>ID</b>: ${product.id}
<b>Description</b>: ${product.description || 'No description available'}
<b>Image</b>: <a href="${product.image}">Click to view image</a>`).join("\n")}`}

export function MutateProduct(product: any) {
  return `
1. <b>${product.name}</b> - ₦${product.price}
<b>QUANTITY</b>: ${product.quantity} pcs
<b>ID</b>: ${product.id}
<b>Description</b>: ${product.description || 'No description available'}
<b>Image</b>: <a href="${product.image}">Click to view image</a>\n\nDo you want to add this product to your cart?`;
}

export function getProductByBusinessIdAndProductName(business_id: string, product_name: string) {
  const resp = ProductRepository.readProductByBusinessIdAndProductName(
    business_id,
    product_name.toLowerCase()
  );
  return resp;
}

export function MutateCartProducts(products: any[]) {
  return `${products.map((product, index) => `
${index + 1}. <b>${product.name[0].toUpperCase()}${product.name.slice(1).toLowerCase()}</b> - ₦${product.price} | ${product.quantity} pcs`).join("\n")}`}

export function MutateCartProduct(product: any) {
  return `<b>₦${product.price}</b> | ${product.quantity} pcs\n`;
}