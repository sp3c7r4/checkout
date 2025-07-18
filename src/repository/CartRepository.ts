import BaseRepository from "./BaseRepository";
import { cart } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import {CartProduct} from './../types/product';
// interface CartProduct {
//   id: string;
//   price: number;
//   quantity: number;
//   kg?: number;
//   type?: 'reduce' | 'increase';
// }

class CartRepository extends BaseRepository {
  constructor() {
    super(cart)
  }

  async readCartByUserAndBusiness(user_id: string, business_id: string): Promise<any> {
    try {
      const cart = await db.query.cart.findFirst({
        where: (c, { eq, and }) => and(
          eq(c.user_id, Number(user_id)),
          eq(c.business_id, business_id)
        )
      });
      return cart;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readCartByBusiness(business_id: string) {
    try {
      const cart = await db.query.cart.findMany({
        where: (c, { eq, and }) => eq(c.business_id, business_id)
      });
      return cart;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async storeProductInCart(user_id: string, business_id: string, prods: any[]) {
    try {
      const newProducts = [...prods];
      const existingCart = await this.readCartByUserAndBusiness(user_id, business_id);
      
      let mergedProducts: any[];
      
      if (existingCart && existingCart.products) {
        // Merge existing products with new ones
        const existingProducts = existingCart.products as any[];
        mergedProducts = [...existingProducts];
        
        // For each new product, either update existing or add new
        newProducts.forEach(newProduct => {
          const existingIndex = mergedProducts.findIndex(existing => existing.id === newProduct.id);
          
          if (existingIndex !== -1) {
            // Product exists, update it based on type
            const existingProduct = mergedProducts[existingIndex];
            let newQuantity: number;
            
            if (newProduct.type === 'reduce') {
              newQuantity = Math.max(0, existingProduct.quantity - newProduct.quantity);
            } else {
              // Default to 'increase'
              newQuantity = existingProduct.quantity + newProduct.quantity;
            }
            
            // If quantity becomes 0, remove the product
            if (newQuantity === 0) {
              mergedProducts.splice(existingIndex, 1);
            } else {
              mergedProducts[existingIndex] = {
                ...existingProduct,
                price: newProduct.price, // Update price
                quantity: newQuantity,
                kg: newProduct.kg || existingProduct.kg // Keep existing kg if not provided
              };
            }
          } else {
            // Product doesn't exist, add it only if it's not a reduce operation
            if (newProduct.type !== 'reduce') {
              const { type, ...productWithoutType } = newProduct;
              mergedProducts.push(productWithoutType);
            }
          }
        });
      } else {
        // No existing cart or products, use new products (only increase operations)
        mergedProducts = newProducts
          .filter(product => product.type !== 'reduce')
          .map(product => {
            const { type, ...productWithoutType } = product;
            return productWithoutType;
          });
      }
      
      const total_price: number = mergedProducts.reduce((sum, product) => {
        const itemTotal = Number(product.price) * Number(product.quantity);
        return sum + itemTotal;
      }, 0);
      
      const total_kg: number = mergedProducts.reduce((totalWeight, product) => {
        const itemWeight = Number(product.kg || 0) * Number(product.quantity);
        return totalWeight + itemWeight;
      }, 0);
      
      if (existingCart) {
        const updatedCart = await db.update(this.model).set({
          products: mergedProducts, // Store merged products without type
          total_price,
          total_kg
        }).where(eq(this.model.id, existingCart.id)).returning();
        return updatedCart;
      } else {
        // Create new cart (only if there are products to add)
        if (mergedProducts.length > 0) {
          const newCart = await db.insert(this.model).values({
            user_id: Number(user_id),
            business_id,
            products: mergedProducts, // Store products without type
            total_price,
            total_kg
          }).returning();
          return newCart;
        }
        return null;
      }
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  // async removeProductFromCart(user_id: string, business_id: string, product_id: string) {
    // try {
    //   const existingCart = await this.readCartByUserAndBusiness(user_id, business_id);
    //   if (!existingCart || !existingCart.products) {
    //     throw new CE_INTERNAL_SERVER("Cart not found or empty");
    //   }

    //   const products = existingCart.products as CartProduct[];
    //   const updatedProducts = products.filter(product => product.id !== product_id);

    //   if (updatedProducts.length === products.length) {
    //     throw new CE_INTERNAL_SERVER("Product not found in cart");
    //   }

    //   const total_price: number = updatedProducts.reduce((sum, product) => {
    //     return sum + (Number(product.price) * Number(product.quantity));
    //   }, 0);

    //   const total_kg: number = updatedProducts.reduce((totalWeight, product) => {
    //     return totalWeight + (Number(product.kg || 0) * Number(product.quantity));
    //   }, 0);

    //   const updatedCart = await db.update(this.model).set({
    //     products: updatedProducts,
    //     total_price,
    //     total_kg
    //   }).where(eq(this.model.id, existingCart.id)).returning();

    //   return updatedCart;
    // } catch (err) {
    //   throw new CE_INTERNAL_SERVER(err.message);
    // }
  // }
  async removeProductFromCart(user_id: string, business_id: string, product_id: string) {
    try {
      const existingCart = await this.readCartByUserAndBusiness(user_id, business_id);
      if(!existingCart || !existingCart.products) throw new CE_INTERNAL_SERVER("Cart not found or empty");
      const products = existingCart.products as CartProduct[];
      const updatedProducts = products.filter(product => product.id !== product_id);
      if (updatedProducts.length === products.length) throw new CE_INTERNAL_SERVER("Product not found in cart");

      const total_price: number = updatedProducts.reduce((sum, product) => {
        return sum + (Number(product.price) * Number(product.quantity));
      }, 0);
      const total_kg: number = updatedProducts.reduce((totalWeight, product) => {
        return totalWeight + (Number(product.kg || 0) * Number(product.quantity));
      }, 0);

      const updatedCart = await db.update(this.model).set({
        products: updatedProducts,
        total_price,
        total_kg: 0
      }).where(eq(this.model.id, existingCart.id)).returning();
      return updatedCart;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async storeOneProductInCart(user_id: string, business_id: string, product: any) {
    try {
      const existingCart = await this.readCartByUserAndBusiness(user_id, business_id);
      if (!existingCart) throw new CE_INTERNAL_SERVER("Cart not found");

      const existingProducts = existingCart.products || [];
      
      // Find if product already exists in cart
      const existingProductIndex = existingProducts.findIndex(
        (p: any) => p.id === product.id && p.name === product.name
      );

      let updatedProducts: any[];

      if (existingProductIndex !== -1) {
        // Product exists, merge quantities
        updatedProducts = [...existingProducts];
        const existingProduct = updatedProducts[existingProductIndex];
        
        updatedProducts[existingProductIndex] = {
          ...existingProduct,
          quantity: existingProduct.quantity + product.quantity,
          price: product.price, // Update to latest price
          kg: product.kg || existingProduct.kg // Keep existing kg if not provided
        };
      } else {
        // Product doesn't exist, add it to cart
        updatedProducts = [...existingProducts, product];
      }

      // Recalculate totals
      const total_price = updatedProducts.reduce((sum, p) => {
        return sum + (Number(p.price) * Number(p.quantity));
      }, 0);
      
      const total_kg = updatedProducts.reduce((sum, p) => {
        return sum + (Number(p.kg || 0) * Number(p.quantity));
      }, 0);

      const updatedCart = await db.update(this.model).set({
        products: updatedProducts,
        total_price,
        total_kg: 0
      }).where(eq(this.model.id, existingCart.id)).returning();

      return updatedCart;
    } catch (e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }

  async updateProductInCart(user_id: string, business_id: string, product_id: string, new_quantity: number): Promise<boolean> {
    try {
      const existingCart = await this.readCartByUserAndBusiness(user_id, business_id);
      if (!existingCart?.products) return false;

      const products = existingCart.products as CartProduct[];
      const productExists = products.some(p => p.id === product_id);
      
      if (!productExists) return false;

      // Filter out the product if quantity <= 0, otherwise update it
      const updatedProducts = new_quantity <= 0 
        ? products.filter(p => p.id !== product_id)
        : products.map(p => p.id === product_id ? { ...p, quantity: new_quantity } : p);

      // Recalculate totals
      const total_price = updatedProducts.reduce((sum, p) => 
        sum + (Number(p.price) * Number(p.quantity)), 0);
      
      const total_kg = updatedProducts.reduce((sum, p) => 
        sum + (Number(p.kg || 0) * Number(p.quantity)), 0);

      const result = await db.update(this.model)
        .set({ products: updatedProducts, total_price, total_kg })
        .where(eq(this.model.id, existingCart.id))
        .returning();

      return result.length > 0;
    } catch (err) {
      console.error('Error updating product in cart:', err);
      return false;
    }
  }

  async getCartItem(user_id: string, business_id: string, product_id: string): Promise<CartProduct | null> {
    try {
        const cart = await this.readCartByUserAndBusiness(user_id, business_id);
        const products = cart?.products as CartProduct[] || [];
        return products.find(p => p.id === product_id) || null;
      } catch (err) {
        console.error('Error getting cart item:', err);
        return null;
      }
  }
}

export default new CartRepository();