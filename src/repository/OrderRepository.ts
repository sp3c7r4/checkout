import BaseRepository from "./BaseRepository";
import { admin, order, payment, product, user } from "../db/schema";
import { db } from "../db";
// import { eq } from "drizzle-orm";
import { z } from "zod";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class OrderRepository extends BaseRepository {
  constructor() {
    super(order)
  }

  readOrderByBusinessId(business_id: string) {
    try {
      const query = db.query.order.findMany({
        where: (order, { eq }) => eq(order.business_id, business_id),
        with: {
          user: true 
        },
      });
      return query;
    } catch(e) {
      throw new CE_INTERNAL_SERVER('Error reading order by business ID');
    }
  }
}

export default new OrderRepository();