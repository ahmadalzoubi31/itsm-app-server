import { Injectable } from '@nestjs/common';
import { Client } from 'ldapts';
import { SettingsService } from '../settings/settings.service';
import { SettingTypeEnum } from '../settings/constants/type.constant';

@Injectable()
export class LdapService {
  constructor(private readonly settingsService: SettingsService) {}

  // Uses settings from DB
  async searchUsers() {
    const ldapSettings = await this.settingsService.getByType(
      SettingTypeEnum.LDAP,
    );

    const url =
      ldapSettings.protocol === 'ldaps'
        ? `ldaps://${ldapSettings.server}:${ldapSettings.port}`
        : `ldap://${ldapSettings.server}:${ldapSettings.port}`;

    const client = new Client({ url });
    await client.bind(ldapSettings.bindDn, ldapSettings.bindPassword);

    const { searchEntries } = await client.search(ldapSettings.baseDn, {
      scope: 'sub',
      filter: ldapSettings.searchFilter,
      attributes: ldapSettings.attributes.split(',').map((a) => a.trim()),
    });

    await client.unbind();
    return searchEntries;
  }

  async testConnection() {
    const ldapSettings = await this.settingsService.getByType(
      SettingTypeEnum.LDAP,
    );
    const url =
      ldapSettings.protocol === 'ldaps'
        ? `ldaps://${ldapSettings.server}:${ldapSettings.port}`
        : `ldap://${ldapSettings.server}:${ldapSettings.port}`;
    const client = new Client({ url });
    await client.bind(ldapSettings.bindDn, ldapSettings.bindPassword);
    await client.unbind();
    return { success: true };
  }

  async syncUsers() {
    // 1. Get sync settings from DB
    const syncSettings = await this.settingsService.getByType(
      SettingTypeEnum.SYNC,
    );

    // 2. Get LDAP settings from DB (if needed)
    const ldapSettings = await this.settingsService.getByType(
      SettingTypeEnum.LDAP,
    );

    // 3. Connect and sync logic here (dummy for now)
    //    (You might re-use searchUsers, then sync with your local DB, etc.)

    // Example: Just returns the sync settings for now
    return {
      message: 'Sync triggered!',
      syncSettings,
      // Optionally, return results or logs here
    };
  }
}
