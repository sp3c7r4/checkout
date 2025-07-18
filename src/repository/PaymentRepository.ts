import BaseRepository from "./BaseRepository";
import { admin, payment, product, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class PaymentRepository extends BaseRepository {
  constructor() {
    super(payment)
  }

  readPaymentsByBusinessId(business_id: string) {
    try {
      const query = db.query.payment.findMany({
        where: (payment, { eq }) => eq(payment.business_id, business_id),
        with: {
          user: true
        }
      });
      return query;
    } catch(e) {
      throw new CE_INTERNAL_SERVER('Error reading payments by business ID');
    }
  }
}

export default new PaymentRepository();