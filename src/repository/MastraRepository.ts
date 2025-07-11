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
}

export default new ProductRepository();