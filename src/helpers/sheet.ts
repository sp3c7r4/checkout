import { db } from "../db";
import { CE_BAD_REQUEST } from "../utils/Error";
import checkoutGoogleSheetsService from "../utils/GoogleSheetsService";

export async function getSheeetByBusinessId(business_id: string) {
  const sheet = await db.query.spreadsheet.findFirst({
    where: (spreadsheet, { eq }) => eq(spreadsheet.business_id, business_id),
  });
  if(!sheet) throw new CE_BAD_REQUEST(`Sheet doesn't exist`);
  return sheet;
}

export async function getSheetById(spreadsheet_id: string) {
  const sheet = await db.query.spreadsheet.findFirst({
    where: (spreadsheet, { eq }) => eq(spreadsheet.id, spreadsheet_id),
  });
  if(!sheet) throw new CE_BAD_REQUEST(`Sheet doesn't exist`);
  return sheet;
}

export async function validateIfSheetExists(business_id: string) {
  const sheet = await db.query.spreadsheet.findFirst({
    where: (spreadsheet, { eq }) => eq(spreadsheet.business_id, business_id),
  });
  if(sheet) throw new CE_BAD_REQUEST(`Sheet exists already`);
  return false;
}

export async function toggleVisibility(spreadsheet_id: string, state: boolean) {
  console.log('Toggling visibility for sheet:', spreadsheet_id, 'to state:', state);
  await checkoutGoogleSheetsService.togglePublicVisibility(spreadsheet_id, state);
}