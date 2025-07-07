import BaseRepository from "./BaseRepository";
import { address, business } from "../db/schema";
import BusinessRepository from "./BusinessRepository";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { CE_INTERNAL_SERVER } from "../utils/Error";

class AddressRepository extends BaseRepository {
  constructor() {
    super(address)
  }

  async createAndAttachAddress(business_id: string, data: any) {
    const { id } = await this.create(data)
    const attach = BusinessRepository.updateModel(business_id, { address_id: id })
    return attach
  }

  async readOneByBusinessId(business_id: string) {
    try {
      const findOne = await db.select().from(business).where(eq(this.model.admin_id, business_id));
      return findOne[0]
    } catch (err) {
      throw new CE_INTERNAL_SERVER(err.message);
    }
  }
}

export default new AddressRepository();