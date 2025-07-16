import {
  getAdminById,
} from "../helpers/admin";
import { getBusinessById, validateIfBusinessExists } from "../helpers/business";
import { getSheetById, validateIfSheetExists } from "../helpers/sheet";
import AddressRepository from "../repository/AddressRepository";
import BusinessRepository from "../repository/BusinessRepository";
import SettingsRepository from "../repository/SettingsRepository";
import SpreadSheetRepository from "../repository/SpreadSheetRepository";
import BusinessResource from "../resource/business";
import SpreadSheetResource from "../resource/sheet";
import cloudinary from "../utils/cloudinary";
import checkoutGoogleSheetsService, { addProductsToDatabase } from "../utils/GoogleSheetsService";
import { CREATED, OK } from "../utils/Response";

export async function createBusiness(data: any) {
  const { name, email, admin_id, street, state, country } = data;
  await Promise.all([
    getAdminById(admin_id),
    validateIfBusinessExists(admin_id)
  ]);
  const create = await BusinessRepository.create({ name, email, admin_id });
  const [create_address ] = await Promise.all([
    await AddressRepository.create({ business_id: create.id, street, state, country, }),
    await SettingsRepository.create({ business_id: create.id })
  ])
  const res = { ...BusinessResource({ ...create, address: create_address }) };
  return CREATED(`Business created successfully`, res);
}

export async function updateBusiness(data: any) {
  const { business_id, admin_id, name, image } = data;
  await Promise.all([
    getAdminById(admin_id),
    getBusinessById(business_id)
  ])
  const upload = image && await cloudinary.upload_image(image)
  const update = await BusinessRepository.updateModel(business_id, { name, image: upload })
  const res = BusinessResource(update)
  return OK(`Business updated successfully`, res);
}

// export async function updateBusiness(data: any) {
//   const { business_id, name, email, street, state, country, admin_id } = data;
//   await getAdminById(admin_id);
//   const business = await getBusinessById(business_id);
//   let business_update: any;
//   let address_update: any;
//   if (name || email) {
//     business_update = await BusinessRepository.updateModel(business.id, {
//       name,
//       email,
//     });
//   }
//   if (street || state || country) {
//     address_update = await AddressRepository.updateModel(business.address.id, {
//       street,
//       state,
//       country,
//     });
//   }
//   const res = {
//     ...BusinessResource({ ...business_update, address: address_update }),
//   };
//   return OK(`Business updated successfully`, res);
// }

export async function requestSpreadSheet(data: any) {
  const { admin_id, business_id } = data;
  const [ _, { name, email } ] = await Promise.all([ getAdminById(admin_id), getBusinessById(business_id), validateIfSheetExists(business_id) ]);
  console.time('Creating sheet')
  const sheet = await checkoutGoogleSheetsService.createSpreadsheetWithTemplate(
    `Business - ${name}`, checkoutGoogleSheetsService.getTemplate('store'),
  );
  console.timeEnd('Creating sheet')
  console.time('Getting Sheet')
  await checkoutGoogleSheetsService.shareWithSpecificUsers(sheet.spreadsheetId, [ email ]);
  console.timeEnd('Getting Sheet')
  console.time('Saving sheet to db')
  const db = await SpreadSheetRepository.create({
    name: `Business - ${name}`,
    spreadsheet_id: sheet.spreadsheetId,
    url: sheet.spreadsheetUrl,
    business_id,
  });
  console.timeEnd('Saving sheet to db')
  const res = SpreadSheetResource(db)
  return CREATED(`Spreadsheet created successfully`, res);
}

export async function syncSheet(data: any) {
  const { admin_id, business_id, spreadsheet_id } = data;
  console.log({ admin_id, business_id, spreadsheet_id })
  const [ a, b, sheet ] = await Promise.all([ getAdminById(admin_id), getBusinessById(business_id), getSheetById(spreadsheet_id) ]);
  console.log({ admin_id, business_id, sheet })
  const sync = await addProductsToDatabase(sheet.spreadsheet_id, business_id);
  return OK(`Products synced successfully`, sync);
}