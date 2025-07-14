import BaseRepository from "./BaseRepository";
import { business, settings, spreadsheet } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";

class SettingsRepository extends BaseRepository {
  constructor() {
    super(settings);
  }

  async readOneByBusinessID(business_id: string) {
    try {
      const settings = db.query.settings.findFirst({
        where: (s, {eq}) => eq(s.business_id, business_id)
      })
      return settings
    } catch(e) {
      throw new CE_INTERNAL_SERVER('Settings not found')
    }
  }
}

export default new SettingsRepository();
