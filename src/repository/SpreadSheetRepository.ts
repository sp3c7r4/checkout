import BaseRepository from "./BaseRepository";
import { business, spreadsheet } from "../db/schema";
import { CE_INTERNAL_SERVER } from "../utils/Error";
import { db } from "../db";

class SpreadSheetRepository extends BaseRepository {
  constructor() {
    super(spreadsheet);
  }
}

export default new SpreadSheetRepository();
