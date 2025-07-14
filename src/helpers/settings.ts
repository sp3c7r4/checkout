import SettingsRepository from "../repository/SettingsRepository";
import { CE_BAD_REQUEST } from "../utils/Error";

export async function getSettingsByBusinessId(business_id) {
  const res = SettingsRepository.readOneByBusinessID(business_id)
  if(!res) throw new CE_BAD_REQUEST('Settings not found')
  return res
}

export async function getSettingsById(settings_id: string) {
  const res = SettingsRepository.readOneById(settings_id)
  if(!res) throw new CE_BAD_REQUEST('Settings not found')
  return res
}

export async function toggleNotifications(settings_id: string, state: boolean) {
  console.log('Toggling notifications for settings:', settings_id, 'to state:', state);
}