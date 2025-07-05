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
      },
    ];

    try {
      await repository.upsert(defaultSettings, {
        conflictPaths: ['type', 'id'],
      });
      console.log('✅ Default settings have been successfully seeded.');
    } catch (error) {
      console.error('❌ Failed to seed default settings:', error);
      throw error;
    }
  }
}
