import BaseRepository from "./BaseRepository";
import { admin } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class AdminRepository extends BaseRepository {
  constructor() {
    super(admin);
  }

  
  async readOneById(id: string): Promise<any> {
    try {
      const findOne = await db.query.admin.findFirst({
        where: (a, { eq }) => eq(a.id, id),
        with: {
          business: true,
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readOneByEmail(email: string): Promise<any> {
    try {
      const findOne = await db.query.admin.findFirst({
        where: (a, { eq }) => eq(a.email, email),
        with: {
          business: {
            with: {
              address: true,
            },
          },
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readAdminWithBusiness(id: string) {
    try {
      const result = await db.query.admin.findFirst({
        where: eq(admin.id, id),
        with: {
          business: true,
        },
      });
      return result;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async getUsers(business_id: string) {
    try {
      const findOne = await db.query.userBusiness.findMany({
        where: (ub, { eq }) => eq(ub.business_id, business_id),
        with: {
          user: true
        }})
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }
}

export default new AdminRepository();
