import SettingsResource from "./settings"
import SpreadSheetResource from "./sheet"

export function AddressResource(model: any) {
  return {
    street: model.street,
    state: model.state,
    country: model.country
  }
} 

export default function BusinessResource(model: any) {
  return {
    id: model.id,
    name: model.name,
    email: model.email,
    address: model.address ? AddressResource(model.address) : undefined,
    spreadsheet: model.spreadsheet ? SpreadSheetResource(model.spreadsheet) : undefined,
    settings: model.settings ? SettingsResource(model.settings) : undefined,
  }
}
