import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { encryptDataPassword, validateDataCheck } from "../helpers";
import { db } from "../db";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { eq } from "drizzle-orm";

export default class BaseRepository {
  model: any;

  constructor(model: PgTableWithColumns<any>) {
    this.model = model;
    // this.model = model;
  }

  async create(data: object) {
    validateDataCheck(data);
    try {
      const encrypted_data = await encryptDataPassword(data);
      const result = await db
        .insert(this.model)
        .values(encrypted_data)
        .returning();
      return result[0];
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async createMany(data: Array<object>) {
    validateDataCheck(data);
    try {
      const encrypted_data = data.map((val) => encryptDataPassword(val));
      return await db.insert(this.model).values(encrypted_data);
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readOneById(id: string) {
    try {
      const findOne = await db
        .select()
        .from(this.model)
        .where(eq(this.model.id, id));
      return findOne?.[0];
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readOneByEmail(email: string) {
    try {
      const findOne = await db
        .select()
        .from(this.model)
        .where(eq(this.model.email, email));
      return findOne[0];
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readAll() {
    try {
      const findOne = await db.select().from(this.model);
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async updateModel(id: string, data: any) {
    validateDataCheck(data);
    try {
      const encrypted_data = await encryptDataPassword(data);
      const update = await db
        .update(this.model)
        .set(encrypted_data)
        .where(eq(this.model.id, id))
        .returning();
      return update[0];
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  // Delete user data
  async deleteModel(id: string) {
    try {
      await db.delete(this.model).where(eq(this.model.id, id));
      return { success: true, id };
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }
}
