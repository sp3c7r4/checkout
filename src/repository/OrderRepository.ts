import BaseRepository from "./BaseRepository";
import { admin, order, payment, product, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class OrderRepository extends BaseRepository {
  constructor() {
    super(order)
  }
}

export default new OrderRepository();