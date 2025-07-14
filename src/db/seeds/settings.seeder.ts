import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Settings } from '../../settings/entities/settings.entity';
import { SettingTypeEnum } from '../../settings/constants/type.constant';
import { 
  EmailProtocolEnum,
  NotificationTypeEnum 
} from '../../email/enums';

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
      // Email Settings (simplified structure)
      {
        id: '9a3b5c7d-1e2f-4a6b-8c9d-0e1f2a3b4c5d',
        type: SettingTypeEnum.EMAIL,
        jsonValue: {
          outgoing: {
            enabled: false,
            protocol: EmailProtocolEnum.SMTP,
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            username: '',
            password: '',
            fromEmail: 'noreply@company.com',
            fromName: 'ITSM System',
            replyTo: '',
            timeout: 30000,
            connectionTimeout: 30000,
            maxConnections: 5,
            rateLimitPerSecond: 14,
          },
          incoming: {
            enabled: false,
            protocol: EmailProtocolEnum.IMAP,
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            username: '',
            password: '',
            pollInterval: 5,
            autoProcessIncidents: false,
            autoAssignTo: '',
            defaultPriority: 'medium',
            emailToIncidentMapping: [
              {
                subjectRegex: '.*urgent.*|.*critical.*',
                bodyRegex: '',
                categoryMapping: 'SYSTEM',
                priorityMapping: 'HIGH',
              },
              {
                subjectRegex: '.*down.*|.*outage.*',
                bodyRegex: '',
                categoryMapping: 'SYSTEM',
                priorityMapping: 'CRITICAL',
              },
            ],
          },
          notifications: {
            enabled: false,
            notificationTypes: [
              NotificationTypeEnum.INCIDENT_CREATED,
              NotificationTypeEnum.INCIDENT_UPDATED,
              NotificationTypeEnum.INCIDENT_RESOLVED,
              NotificationTypeEnum.SERVICE_REQUEST_CREATED,
              NotificationTypeEnum.SERVICE_REQUEST_APPROVED,
              NotificationTypeEnum.SERVICE_REQUEST_REJECTED,
              NotificationTypeEnum.SYSTEM_ALERT,
            ],
            defaultRecipients: ['admin@company.com'],
            urgentRecipients: ['admin@company.com', 'manager@company.com'],
            ccRecipients: [],
            bccRecipients: [],
            subjectPrefix: '[ITSM]',
            includeAttachments: false,
            maxAttachmentSize: 10,
            retryAttempts: 3,
            retryDelay: 60,
            batchSize: 50,
            throttleLimit: 100,
          },
          templates: [],
          testEmail: '',
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
