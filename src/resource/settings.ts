export default function SettingsResource(model: any) {
  return {
    id: model.id,
    mass_view: model.mass_view,
    notifications: model.notifications,
    weekly_reports: model.weekly_reports,
  }
}