import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client } from 'ldapts';
import { SettingsService } from '../settings/settings.service';
import { SettingTypeEnum } from '../settings/constants/type.constant';
import { LdapSettingDto } from './dto/ldap-settings.dto';
import { parseObjectGUID } from './helpers/objectGUIDtoString.helper';
import { In, Repository } from 'typeorm';
import { SyncHistory } from './entities/sync-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncHistoryDto } from './dto/sync-history.dto';
import { StagedUser } from './entities/staged-user.entity';
import { ProtocolEnum } from './constants/protocol.constant';
import { SyncStatusEnum } from './constants/sync-status.constant';
import { StagedUserStatusEnum } from './constants/staged-user-status.constant';
import { UsersService } from 'src/users/users.service';
import { RoleEnum } from 'src/users/constants/role.constant';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { StatusEnum } from 'src/shared/constants/status.constant';

@Injectable()
export class LdapService {
  constructor(
    @InjectRepository(SyncHistory)
    private readonly syncHistoryRepository: Repository<SyncHistory>,
    @InjectRepository(StagedUser)
    private readonly stagedUserRepository: Repository<StagedUser>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
  ) {}

  // Preview 5 users if exist
  async previewUsers() {
    const ldapSettings = await this.settingsService.getByType(
      SettingTypeEnum.LDAP,
    );

    const url =
      ldapSettings.protocol === ProtocolEnum.LDAPS.toLowerCase()
        ? `ldaps://${ldapSettings.server}:${ldapSettings.port}`
        : `ldap://${ldapSettings.server}:${ldapSettings.port}`;

    try {
      const client = new Client({ url });
      await client.bind(ldapSettings.bindDn, ldapSettings.bindPassword);

      // Add the default attributes if not provided
      ldapSettings.attributes = ldapSettings.attributes + ',objectGUID';
      const result = await client.search(ldapSettings.searchBase, {
        scope: ldapSettings.searchScope.toLowerCase(),
        filter: ldapSettings.searchFilter,
        attributes: ldapSettings.attributes.split(',').map((a) => a.trim()),
        paged: {
          pageSize: 500,
        },
      });

      await client.unbind();

      result.searchEntries.forEach((entry) => {
        if (typeof entry.objectGUID === 'string') {
          const parsedGUID = parseObjectGUID(entry.objectGUID);
          entry.objectGUID = parsedGUID!;
        }
      });

      return result.searchEntries.slice(0, 5);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Search users from LDAP and save to DB
  async searchUsers() {
    const ldapSettings = await this.settingsService.getByType(
      SettingTypeEnum.LDAP,
    );

    const url =
      ldapSettings.protocol === ProtocolEnum.LDAPS.toLowerCase()
        ? `ldaps://${ldapSettings.server}:${ldapSettings.port}`
        : `ldap://${ldapSettings.server}:${ldapSettings.port}`;

    try {
      const client = new Client({ url });
      await client.bind(ldapSettings.bindDn, ldapSettings.bindPassword);

      // Always include objectGUID for uniqueness
      ldapSettings.attributes = ldapSettings.attributes.includes('objectGUID')
        ? ldapSettings.attributes
        : ldapSettings.attributes + ',objectGUID';

      const attributes = ldapSettings.attributes
        .split(',')
        .map((a) => a.trim());

      const result = await client.search(ldapSettings.searchBase, {
        scope: ldapSettings.searchScope.toLowerCase(),
        filter: ldapSettings.searchFilter,
        attributes,
        paged: { pageSize: 500 },
      });

      await client.unbind();

      // List of your defined standard fields
      const standardFields = [
        'cn',
        'mail',
        'sAMAccountName',
        'displayName',
        'department',
        'givenName',
        'sn',
        'title',
        'mobile',
        'userPrincipalName',
        'objectGUID',
        'manager',
      ];

      // Map LDAP entries to StagedUser with additionalAttributes
      const stagedUsers = result.searchEntries.map((entry) => {
        // Ensure objectGUID is parsed correctly
        if (typeof entry.objectGUID === 'string') {
          entry.objectGUID =
            parseObjectGUID(entry.objectGUID) ?? entry.objectGUID;
        }

        // Map standard fields
        const base: any = {};
        standardFields.forEach((field) => {
          if (entry[field] !== undefined)
            base[field] = entry[field]?.toString?.() ?? '';
        });

        // Everything else is custom
        const additionalAttributes: Record<string, any> = {};
        Object.keys(entry).forEach((key) => {
          if (!standardFields.includes(key) && key !== 'dn') {
            additionalAttributes[key] = entry[key];
          }
        });

        return {
          ...base,
          additionalAttributes,
          status: StagedUserStatusEnum.NEW,
        };
      });

      // Upsert on objectGUID
      await this.stagedUserRepository.upsert(stagedUsers, {
        conflictPaths: ['objectGUID'],
      });

      return result.searchEntries;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async testConnection(body: LdapSettingDto) {
    const url =
      body.protocol === ProtocolEnum.LDAPS.toLowerCase()
        ? `ldaps://${body.server}:${body.port}`
        : `ldap://${body.server}:${body.port}`;

    try {
      const client = new Client({ url });
      await client.bind(body.bindDn, body.bindPassword);
      await client.unbind();
      return { success: true };
    } catch (error) {
      console.log('🚀 ~ LdapService ~ testConnection ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async syncUsers() {
    try {
      const start = Date.now();
      const users = await this.searchUsers();
      const duration = Date.now() - start;

      const syncHistoryDto: SyncHistoryDto = {
        timestamp: new Date(),
        status: SyncStatusEnum.SUCCESS,
        details: 'Sync completed successfully',
        usersFetched: users.length,
        duration,
      };

      await this.createSyncHistory(syncHistoryDto);

      return {
        users,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSyncHistory() {
    try {
      return await this.syncHistoryRepository.find({
        order: {
          timestamp: 'DESC',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createSyncHistory(body: SyncHistoryDto) {
    try {
      const syncHistory = this.syncHistoryRepository.create(body);
      return this.syncHistoryRepository.save(syncHistory);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getStagedUsers() {
    try {
      return await this.stagedUserRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async importStagedUsersIntoActualUsers(objectGUIDs: string[]) {
    try {
      const stagedUsersNeedToImport = await this.stagedUserRepository.find({
        where: {
          objectGUID: In(objectGUIDs),
        },
      });

      const actualUsers = await this.usersService.findByIds(objectGUIDs);

      const users: CreateUserDto[] = [];

      stagedUsersNeedToImport.forEach((user) => {
        const actualUser = actualUsers.find(
          (u) => u.objectGUID === user.objectGUID,
        );
        if (actualUser) {
          users.push({
            username: user.sAMAccountName,
            email: user.mail,
            password: '',
            firstName: user.givenName,
            lastName: user.sn,
            phone: user.mobile,
            address: user.additionalAttributes?.address,
            role: RoleEnum.USER,
            objectGUID: user.objectGUID,
            managerId: user.manager,
            status: StatusEnum.ACTIVE,
          });
        }
      });

      return users;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
