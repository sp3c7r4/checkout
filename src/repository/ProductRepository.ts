import BaseRepository from "./BaseRepository";
import { admin, product, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class ProductRepository extends BaseRepository {
  constructor() {
    super(product)
  }

  async readProductsByBusinessId(business_id: string) {
    try {
      const product = await db.query.product.findMany({
        where: (p, { eq }) => eq(p.business_id, business_id)
      })
      return product
    } catch(e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }
  
  async readProductsByBusinessIdAndProductId(business_id: string, product_id: string) {
    try {
      const product = await db.query.product.findFirst({
        where: (p, { eq, and }) => and(eq(p.business_id, business_id),eq(p.id, product_id))
      })
      return product
    } catch(e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }

  async readProductsByBusinessIdAndBarcode(business_id: string, barcode: string) {
    try {
      const product = await db.query.product.findFirst({
        where: (p, { eq, and }) => and(eq(p.business_id, business_id), eq(p.barcode, barcode))
      })
      return product
    } catch(e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }

  async readProductByBusinessIdAndProductName(business_id: string, product_name: string) {
    try {
      const product = await db.query.product.findFirst({
        where: (p, { eq, and }) => and(eq(p.business_id, business_id), eq(p.name, product_name))
      })
      return product
    } catch(e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }

  async readProductsByIds(product_ids: string[]) {
    try {
      const products = await db.query.product.findMany({
        where: (p, { inArray }) => inArray(p.id, product_ids)
      })
      return products
    } catch(e) {
      throw new CE_INTERNAL_SERVER(e.message);
    }
  }
}

export default new ProductRepository();