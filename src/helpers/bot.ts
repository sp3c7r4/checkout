import { recommendationAgent } from "../mastra/agents";
import ProductRepository from "../repository/ProductRepository";

export function MarkDownizeProducts(products) {
  return `${products.map((product, index) => `
${index + 1}. <b>${product.name}</b> - ₦${product.price} - <a href="${product.image}">Click to view image</a>`).join("\n")}`}

// export function MarkDownizeProducts(products) {
//   return `${products.map((product, index) => `
// ${index + 1}. <b>${product.name}</b> - ₦${product.price}
// <b>QUANTITY</b>: ${product.quantity} pcs
// <b>ID</b>: ${product.id}
// <b>Description</b>: ${product.description || 'No description available'}
// <b>Image</b>: <a href="${product.image}">Click to view image</a>`).join("\n")}`}

export function MutateProduct(product: any) {
  return `
1. <b>${product.name}</b> - ₦${product.price}
<b>QUANTITY</b>: ${product.quantity} pcs
<b>ID</b>: ${product.id}
<b>Description</b>: ${product.description || 'No description available'}
<b>Image</b>: <a href="${product.image}">Click to view image</a>\n\nDo you want to add this product to your cart?`;
}

export async function getProductByBusinessIdAndProductName(business_id: string, product_name: string) {
  const resp = await ProductRepository.readProductByBusinessIdAndProductName(
    business_id,
    product_name.toLowerCase()
  );
  return resp;
}

export async function getProductByBusinessIdAndProductNameNext(business_id: string, product_name: string) {
  const resp = await ProductRepository.readProductByBusinessIdAndProductNameNext(
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

export function createProductsKeyboard(products) {
  const keyboard: any[] = [];
  
  for (let i = 0; i < products.length; i += 2) {
    const row: any[] = [];
    
    // Add first product in the row
    row.push({ text: `${products[i].name.toUpperCase()}`, callback_data: `view_product:${products[i].id}` });
    
    // Add second product if it exists
    if (i + 1 < products.length) {
      row.push({ text: `${products[i + 1].name.toUpperCase()}`, callback_data: `view_product:${products[i + 1].id}` });
    }
    
    keyboard.push(row);
  }
  
  return { inline_keyboard: keyboard };
}

// export function getSmartRecommendations(cartItems: any[], availableProducts: any[]) {
//   const recommendations: any[] = [];
//   const maxRecommendations = 6;
  
//   // Define product combinations/complements
//   const productCombos = {
//     // Beverages & Snacks
//     'milk': ['cereal', 'cookie', 'biscuit', 'tea', 'coffee', 'chocolate'],
//     'coffee': ['milk', 'sugar', 'biscuit', 'cookie'],
//     'tea': ['milk', 'sugar', 'biscuit', 'honey'],
//     'juice': ['biscuit', 'cookie', 'bread'],
    
//     // Baking & Cooking
//     'flour': ['sugar', 'egg', 'milk', 'baking powder', 'butter'],
//     'sugar': ['flour', 'egg', 'milk', 'baking powder'],
//     'egg': ['flour', 'milk', 'bread', 'butter'],
//     'butter': ['bread', 'flour', 'milk'],
    
//     // Breakfast items
//     'bread': ['butter', 'jam', 'peanut butter', 'cheese', 'egg'],
//     'cereal': ['milk', 'banana', 'honey'],
//     'oats': ['milk', 'banana', 'honey', 'nuts'],
    
//     // Fruits & Health
//     'banana': ['milk', 'cereal', 'oats', 'peanut butter'],
//     'apple': ['peanut butter', 'cheese', 'nuts'],
    
//     // Snacks
//     'biscuit': ['milk', 'tea', 'coffee', 'juice'],
//     'cookie': ['milk', 'tea', 'coffee'],
//     'chips': ['soda', 'juice', 'dip'],
//     'nuts': ['fruit', 'chocolate', 'milk'],
    
//     // Condiments & Spreads
//     'peanut butter': ['bread', 'banana', 'apple', 'crackers'],
//     'jam': ['bread', 'butter', 'crackers'],
//     'honey': ['tea', 'oats', 'bread'],
    
//     // Dairy
//     'cheese': ['bread', 'crackers', 'apple', 'wine'],
//     'yogurt': ['fruit', 'honey', 'nuts', 'cereal'],
//   };

//   // Get recommendations based on cart items
//   for (const cartItem of cartItems) {
//     const itemName = cartItem.name.toLowerCase();
    
//     // Find direct matches
//     for (const [baseProduct, complements] of Object.entries(productCombos)) {
//       if (itemName.includes(baseProduct)) {
//         for (const complement of complements) {
//           const matchingProducts: any = availableProducts.filter(p => 
//             p.name.toLowerCase().includes(complement) && 
//             !recommendations.some((r: any) => r.id === p.id)
//           );
//           recommendations.push(...matchingProducts.slice(0, 2));
//         }
//       }
//     }

//     // Also check if cart item is a complement to available products
//     for (const [baseProduct, complements] of Object.entries(productCombos)) {
//       if (complements.some(comp => itemName.includes(comp))) {
//         const matchingProducts: any = availableProducts.filter(p => 
//           p.name.toLowerCase().includes(baseProduct) && 
//           !recommendations.some((r: any) => r.id === p.id)
//         );
//         recommendations.push(...matchingProducts.slice(0, 1));
//       }
//     }
//   }

//   // Add some popular/trending items if we don't have enough recommendations
//   if (recommendations.length < maxRecommendations) {
//     const popularKeywords = ['milk', 'bread', 'egg', 'sugar', 'rice', 'oil'];
//     for (const keyword of popularKeywords) {
//       const popularItems = availableProducts.filter(p => 
//         p.name.toLowerCase().includes(keyword) && 
//         !recommendations.some(r => r.id === p.id)
//       );
//       recommendations.push(...popularItems.slice(0, 1));
//       if (recommendations.length >= maxRecommendations) break;
//     }
//   }

//   // Remove duplicates and limit results
//   const uniqueRecommendations = recommendations.filter((product, index, self) => 
//     index === self.findIndex(p => p.id === product.id)
//   );

//   return uniqueRecommendations.slice(0, maxRecommendations);
// }

export async function getSmartRecommendations(cartItems: any[], availableProducts: any[]) {
  console.log("Cart Items:", cartItems);
  console.log("Available Products:", availableProducts);
  const prompt = `
    Based on the following shopping cart items, provide product recommendations in two categories:

    Cart Items:
    ${cartItems.map(item => `- ${item.name} (₦${item.price}) x${item.quantity}`).join('\n')}

    Available Store Products:
    ${availableProducts.map(product => `- ${product.name} (₦${product.price}) - ${product.description}`).join('\n')}

    Please provide recommendations in this format:

    **AVAILABLE IN STORE:**
    [List 2-4 products from the available store products that complement the cart items]

    **GENERAL RECOMMENDATIONS:**
    [List 3-5 products that typically go well with the cart items, regardless of store availability. For example: if someone buys doughnuts, suggest items like coffee, coca-cola, milk, etc. that pair well]

    Guidelines:
    1. For available products: Choose items that complement what's in the cart
    2. For general recommendations: Think about what customers typically buy together or what enhances the experience
    3. Be specific about why certain items go well together
    4. If no available products match well, focus more on general recommendations

    Return the response exactly in the format shown above with the two sections clearly marked.
    `;

  const recommendations = await recommendationAgent.generate([
    {
      role: "user",
      content: prompt
    }
  ]);
  console.log("Recommendations", recommendations);

  return recommendations?.text
}