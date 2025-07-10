import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Settings } from '../../settings/entities/settings.entity';
import { SettingTypeEnum } from '../../settings/constants/type.constant';

export default class SettingsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Settings);

    const defaultSettings = [
      {
        id: 'f6c299bc-b8ab-4bd9-a795-fb45c3326c6b',
        type: SettingTypeEnum.LDAP,
        jsonValue: {
          server: '',
          port: 389,
          protocol: 'LDAP',
          searchBase: '',
          bindDn: '',
          bindPassword: '',
          searchScope: 'SUB',
          searchFilter: '(objectClass=user)',
          attributes:
            'cn,mail,displayName,givenName,sn,userPrincipalName,department,title,mobile,sAMAccountName,distinguishedName',
          useSSL: false,
          validateCert: true,
        },
        createdById: '0745bd13-92f2-474e-8544-5018383c7b75',
        updatedById: '0745bd13-92f2-474e-8544-5018383c7b75',
      },
      {
        id: '56237d9a-cad8-4a4c-b1d4-2c890c17dfeb',
        type: SettingTypeEnum.SYNC,
        jsonValue: {
          enabled: false,
          frequency: 'DAILY',
          syncTime: '02:00',
          timezone: 'UTC',
          retryAttempts: 3,
          retryInterval: 30,
          fullSyncInterval: 7,
        },
        createdById: '0745bd13-92f2-474e-8544-5018383c7b75',
        updatedById: '0745bd13-92f2-474e-8544-5018383c7b75',
      },
    ];

    try {
      // Check which settings already exist
      const existingSettings = await repository.find({
        where: defaultSettings.map((setting) => ({ id: setting.id })),
      });

      const existingIds = existingSettings.map((setting) => setting.id);
      const settingsToInsert = defaultSettings.filter(
        (setting) => !existingIds.includes(setting.id),
      );

      if (settingsToInsert.length > 0) {
        await repository.insert(settingsToInsert as any);
        console.log(
          `Settings seeded successfully: ${settingsToInsert.length} new settings added`,
        );
      } else {
        console.log('All settings already exist, skipping seeding');
      }
    } catch (error) {
      console.error('Error seeding settings:', error);
      throw error;
    }
  }
}
