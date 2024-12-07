import ISystemSettings, {
  SystemSettingsModel,
} from '@database/models/SystemSettings';

export default class SystemRepo {
  public static async getSettings(): Promise<ISystemSettings> {
    const settings = await SystemSettingsModel.findOne({})
      .sort({ _id: -1 })
      .lean<ISystemSettings>()
      .exec();

    if (!settings) {
      const init = {
        riotApiKey: 'TEST',
      } as ISystemSettings;
      const createdSettings = await SystemSettingsModel.create(init);
      return createdSettings;
    }
    return settings;
  }
}
