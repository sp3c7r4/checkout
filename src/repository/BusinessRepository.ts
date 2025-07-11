import BaseRepository from "./BaseRepository";
import { business } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";

class BusinessRepository extends BaseRepository {
  constructor() {
    super(business);
  }

  async readOneById(id: string): Promise<any> {
    try {
      const findOne = await db.query.business.findFirst({
        where: (b, { eq }) => eq(b.id, id),
        with: {
          address: true,
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readOneByAdminId(admin_id: string) {
    try {
      const findOne = await db.query.business.findFirst({
        where: (b, { eq }) => eq(b.admin_id, admin_id),
        with: {
          address: true,
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }

  async readOneByBusinessId(business_id: string) {
    try {
      const findOne = await db.query.business.findFirst({
        where: (b, { eq }) => eq(b.id, business_id),
        with: {
          address: true,
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }
}

export default new BusinessRepository();
