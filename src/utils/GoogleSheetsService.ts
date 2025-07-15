import { drive_v3, google, sheets_v4 } from 'googleapis';
import fs from 'fs';
import path from 'path';
import ProductRepository from '../repository/ProductRepository';
import { it } from 'zod/v4/locales';
import { db } from '../db';
import { checkoutStates } from '../db/schema';
import env from '../config/env';
import { CE_INTERNAL_SERVER } from './Error';

const scope = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

const TOKEN_PATH = env.TOKEN_PATH || path.resolve(process.cwd(), 'token.json');

async function authorize() {
  const credentialsPath = env.GOOGLE_CREDENTIALS_PATH || path.resolve(process.cwd(), 'credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // If no token, get new token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      resolve(code);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);

  return oAuth2Client;
}


class GoogleSheetsService {
  private auth: any;
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private checkoutStoresFolderName = 'checkout_stores';
  private sheetName = 'Checkout Store Data';

  async initialize() {
    this.auth = await authorize();
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async getOrCreateCheckoutStoresFolder(): Promise<string> {
    // Check if folder exists
    const listResponse = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${this.checkoutStoresFolderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (listResponse.data.files && listResponse.data.files.length > 0) {
      return listResponse.data.files[0].id!;
    }

    // Create folder if it does not exist
    const createResponse = await this.drive.files.create({
      requestBody: {
        name: this.checkoutStoresFolderName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id',
    });

    return createResponse.data.id!;
  }

  async createSpreadsheetWithTemplate(title: string, headers: string[] = [], makePublic = false) {
    try {
      let folderId;
      console.time("Getting Folder ID")
      console.time("Getting Folder ID From DB")
      const getFolderId = await db.query.checkoutStates.findFirst({ 
        where: (c, { eq }) => eq(c.name, 'checkout_stores_sheet')
      })
      console.timeEnd("Getting Folder ID From DB")
      if(!getFolderId) {
        console.time('Fetching or Creating Folder ID')
        folderId = await this.getOrCreateCheckoutStoresFolder();
        console.timeEnd('Fetching or Creating Folder ID')
        await db.insert(checkoutStates).values({ name: 'checkout_stores_sheet', value: folderId });
      }
      folderId = getFolderId?.value;
      console.timeEnd("Getting Folder ID")

      // Create spreadsheet
      console.time("Create Spreadsheet")
      const createResponse = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [{
            properties: { title: this.sheetName }
          }]
        }
      });
      console.timeEnd("Create Spreadsheet")

      const spreadsheetId = createResponse.data.spreadsheetId!;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      const sheetId = createResponse.data.sheets?.[0].properties?.sheetId!;

      const actions: Promise<any>[] = [];

      // Move to checkout_stores folder
      actions.push(this.drive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: 'root',
      }));

      // Add headers if provided
      if (headers.length > 0) actions.push(this.addHeaders(spreadsheetId, headers, sheetId))

      // Make public if requested
      if (makePublic) actions.push(this.makePublicEditable(spreadsheetId));
      console.time("Using Promise.all")
      await Promise.all(actions);
      console.timeEnd("Using Promise.all")

      return {
        spreadsheetId,
        spreadsheetUrl,
        success: true
      };

    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async addHeaders(spreadsheetId: string, headers: string[], sheetId: number) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${this.sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
      requests: [{
        repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 6
        },
        cell: {
          userEnteredFormat: {
          textFormat: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } },
          backgroundColor: { red: 0.92, green: 0.57, blue: 0.12 }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      }, {
        repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 6,
          endColumnIndex: headers.length
        },
        cell: {
          userEnteredFormat: {
          textFormat: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } },
          backgroundColor: { red: 0.98, green: 0.84, blue: 0.25 }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      }]
      }
    });
  }

  async makePublicEditable(spreadsheetId: string) {
    await this.drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });
  }

  async togglePublicVisibility(spreadsheetId: string, makeVisible: boolean = false) {
    if (makeVisible) {
      // Make publicly visible (readable)
      await this.drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } else {
      // Remove public visibility
      const permissions = await this.drive.permissions.list({
        fileId: spreadsheetId,
        fields: 'permissions(id,type,role)'
      });
      
      const publicPermission = permissions.data.permissions?.find(
        p => p.type === 'anyone'
      );
      
      if (publicPermission?.id) {
        await this.drive.permissions.delete({
          fileId: spreadsheetId,
          permissionId: publicPermission.id
        });
      }
    }
  }

  async shareWithSpecificUsers(spreadsheetId: string, emails: string[], role: 'reader' | 'writer' | 'owner' = 'writer') {
    const permissions = emails.map(email => ({
      fileId: spreadsheetId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: email
      }
    }));

    await Promise.all(permissions.map(permission =>
      this.drive.permissions.create(permission)
    ));
  }

  getTemplate(templateName: 'basic' | 'inventory' | 'employee' | 'sales' | 'project' | 'store') {
    const templates = {
      basic: ['Name', 'Email', 'Phone', 'Date Created'],
      inventory: ['Item Name', 'SKU', 'Quantity', 'Price', 'Category', 'Last Updated'],
      employee: ['Employee ID', 'Name', 'Department', 'Position', 'Start Date', 'Salary'],
      sales: ['Date', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total', 'Status'],
      project: ['Task', 'Assigned To', 'Due Date', 'Status', 'Priority', 'Notes'],
      store: ['Product Name', 'Image Link', 'Price', 'KG', 'Stock Quantity', 'Barcode', 'Description', 'Category'],
    };
    return templates[templateName] || [];
  }

  async getSheetData(spreadsheetId: string, range?: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${this.sheetName}!${range || 'A1:Z100'}`, // adjust range as needed
    });

    // console.log(response.data.values);
    return response.data.values
  }
}

export async function getSheetDataAndMutate(spreadsheetId: string, business_id: string) {
  const response: any = await checkoutGoogleSheetsService.getSheetData(
    spreadsheetId
  );
  console.log("Response fetching data...", response)
    let cleanData: any = [];
    let updateResults: any = [];
    for (const item of response.slice(1)) {
      const check = item[0] && item[1] && item[2] && item[3] && item[4] && item[5] ? true : false;
      console.log(item[5])
      if(item.length >= 5 && item.filter((i: any) => i !== "").length >= 5 && check) {
        const product = { name: item[0].toString().toLowerCase(), image: item[1].toString(), price: item[2].toString(), kg: item[3].toString(), quantity: Number(item[4] || 0), barcode: item[5].toString() || '', description: item[6]?.toString() || '', category: item[7]?.toString()?.toLowerCase() || 'general' };
        const find_product_in_db = await ProductRepository.readProductsByBusinessIdAndBarcode(business_id, item[5]?.toString() || '');
        console.log("Product found: \n",find_product_in_db)
        if (find_product_in_db) {
          // Check if any field is different and update if needed
          const updates: any = {};
          if (find_product_in_db.name !== product.name) updates.name = product.name;
          if (find_product_in_db.image !== product.image) updates.image = product.image;
          if (find_product_in_db.price !== product.price) updates.price = product.price;
          if (find_product_in_db.kg !== product.kg) updates.kg = product.kg;
          if (find_product_in_db.quantity !== product.quantity) updates.quantity = product.quantity;
          if (find_product_in_db.description !== product.description) updates.description = product.description;
          if (find_product_in_db.category !== product.category) updates.category = product.category;
          
          if (Object.keys(updates).length > 0) {
            const res = await ProductRepository.updateModel(find_product_in_db.id, updates);
            updateResults.push(res)
          }
        } else {
          cleanData.push(product);
        }
      }
    }
    console.log("Clean data", cleanData);
    console.log('Updates', updateResults);
    return cleanData;
}

export async function run() {
  const checkoutGoogleSheetsService = new GoogleSheetsService();
  await checkoutGoogleSheetsService.initialize();
  const response: any = await checkoutGoogleSheetsService.createSpreadsheetWithTemplate(
    'Test Spreadsheet',
    checkoutGoogleSheetsService.getTemplate('store'),
  );
  console.log(response);
}

export async function addProductsToDatabase(spreadsheetId: string, businessId: string) {
  try {
    console.log('Adding products to database from spreadsheet:', spreadsheetId, businessId);
    const response: any = await getSheetDataAndMutate(spreadsheetId, businessId);
    console.log('Response from Google Sheets:', response);
    const mutateProducts = response.map((item: any) => ({ ...item, business_id: businessId }));
    const createdProducts = await ProductRepository.createMany(mutateProducts);
    console.log('Created Products:', createdProducts);
    return createdProducts;
  } catch(e) {
    throw new CE_INTERNAL_SERVER(`Error syncing sheets: ${e.message}`);
  }
}

const checkoutGoogleSheetsService = new GoogleSheetsService();
await checkoutGoogleSheetsService.initialize();

export default checkoutGoogleSheetsService;

// 0,1,2,3,4,5,6,


// run()