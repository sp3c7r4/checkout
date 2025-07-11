import BaseRepository from "./BaseRepository";
import { user } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";

class UserRepository extends BaseRepository {
  constructor() {
    super(user);
  }

  async readAllUserWithBusiness(business_id: string): Promise<any[]> {
    try {
      const findOne = await db.query.userBusiness.findMany({
        where: (u, { eq }) => eq(u.business_id, business_id),
        with: {
          user: true,
        },
      });
      return findOne;
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }
}

export default new UserRepository();
