import { getAdminById } from "../helpers/admin";
import { getSettingsById, getSettingsByBusinessId as gByBId, toggleNotifications } from "../helpers/settings";
import { getSheeetByBusinessId, toggleVisibility } from "../helpers/sheet";
import SettingsRepository from "../repository/SettingsRepository";
import SettingsResource from "../resource/settings";
import { BAD_REQUEST, CREATED, OK } from "../utils/Response";

export async function getSettings(data: any) {
  const { admin_id, settings_id } = data;
  const [_, settings] = await Promise.all([getAdminById(admin_id), getSettingsById(settings_id)])
  return OK('Settings fetched successfully', SettingsResource(settings));
}

export async function getSettingsByBusinessId(data: any) {
  const { admin_id, business_id } = data;
  const [_, settings] = await Promise.all([getAdminById(admin_id), gByBId(business_id)])
  return OK('Settings fetched successfully', SettingsResource(settings));
}

export async function updateSettings(data: any) {
  const { admin_id, settings_id, mass_view, notifications, weekly_reports } = data;
  console.log(mass_view, notifications, weekly_reports)
  const [_, settings] = await Promise.all([getAdminById(admin_id), getSettingsById(settings_id)]);
  const spreadsheet = await getSheeetByBusinessId(settings.business_id);
  // if ( !mass_view && !notifications && !weekly_reports ) return BAD_REQUEST('No setting to update')
  mass_view !== undefined && await toggleVisibility(spreadsheet.spreadsheet_id, mass_view);
  notifications !== undefined && await toggleNotifications(settings.id, notifications);
  const update = await SettingsRepository.updateModel(settings.id, {
    mass_view: { ...settings.mass_view, state: mass_view !== undefined ? mass_view : settings.mass_view.state },
    notifications: { ...settings.notifications, state: notifications !== undefined ? notifications : settings.notifications.state },
    weekly_reports: { ...settings.weekly_reports, state: weekly_reports !== undefined ? weekly_reports : settings.weekly_reports.state }
  });
  return CREATED('Settings updated successfully', update)
}