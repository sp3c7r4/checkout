export default function SpreadSheetResource(model: any) {
  return {
    id: model.id,
    name: model.name,
    spreadsheet_id: model.spreadsheet_id,
    spreadsheet_url: model.url,
  }
}