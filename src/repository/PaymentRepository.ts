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
}

export default new PaymentRepository();