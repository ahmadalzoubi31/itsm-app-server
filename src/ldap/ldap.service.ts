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
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../users/constants/role.constant';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { StatusEnum } from '../shared/constants/status.constant';

@Injectable()
export class LdapService {
  private isSyncInProgress = false;
  private shouldCancelSync = false;
  private currentSyncAbortController: AbortController | null = null;

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

    // Validate required LDAP settings
    if (!ldapSettings.bindDn || !ldapSettings.bindPassword) {
      throw new InternalServerErrorException(
        'LDAP bind credentials are not configured. Please configure bindDn and bindPassword in settings.',
      );
    }

    if (!ldapSettings.server || !ldapSettings.port) {
      throw new InternalServerErrorException(
        'LDAP server configuration is incomplete. Please configure server and port in settings.',
      );
    }

    const url =
      ldapSettings.protocol === ProtocolEnum.LDAPS.toLowerCase()
        ? `ldaps://${ldapSettings.server}:${ldapSettings.port}`
        : `ldap://${ldapSettings.server}:${ldapSettings.port}`;

    console.log('🔍 LDAP Connection Details:', {
      url,
      bindDn: ldapSettings.bindDn,
      server: ldapSettings.server,
      port: ldapSettings.port,
      protocol: ldapSettings.protocol,
      searchBase: ldapSettings.searchBase,
    });

    try {
      const client = new Client({ url });

      console.log('🔐 Attempting LDAP bind...');
      await client.bind(ldapSettings.bindDn, ldapSettings.bindPassword);
      console.log('✅ LDAP bind successful');

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
      console.error('❌ LDAP Error:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      throw new InternalServerErrorException(
        `LDAP connection failed: ${error.message}`,
      );
    }
  }

  // Search users from LDAP and save to DB
  async searchUsers(isManualSync: boolean = false) {
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

      // Check for cancellation after LDAP bind
      if (this.shouldCancelSync) {
        await client.unbind();
        throw new Error('Sync was cancelled');
      }

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

      // Check for cancellation after search
      if (this.shouldCancelSync) {
        throw new Error('Sync was cancelled');
      }

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
      const stagedUsers: StagedUser[] = result.searchEntries.map((entry) => {
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
          createdById: '0745bd13-92f2-474e-8544-5018383c7b75',
          updatedById: '0745bd13-92f2-474e-8544-5018383c7b75',
        };
      });

      // Check for cancellation before database operations
      if (this.shouldCancelSync) {
        throw new Error('Sync was cancelled');
      }

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
    // Validate required fields
    if (!body.bindDn || !body.bindPassword) {
      throw new InternalServerErrorException(
        'bindDn and bindPassword are required for LDAP connection test',
      );
    }

    if (!body.server || !body.port) {
      throw new InternalServerErrorException(
        'server and port are required for LDAP connection test',
      );
    }

    const url =
      body.protocol === ProtocolEnum.LDAPS.toLowerCase()
        ? `ldaps://${body.server}:${body.port}`
        : `ldap://${body.server}:${body.port}`;

    console.log('🔍 Testing LDAP Connection:', {
      url,
      bindDn: body.bindDn,
      server: body.server,
      port: body.port,
      protocol: body.protocol,
    });

    try {
      const client = new Client({ url });
      console.log('🔐 Attempting LDAP bind...');
      await client.bind(body.bindDn, body.bindPassword);
      console.log('✅ LDAP bind successful');
      await client.unbind();
      return { success: true, message: 'LDAP connection test successful' };
    } catch (error) {
      console.error('❌ LDAP Test Connection Error:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      throw new InternalServerErrorException(
        `LDAP connection test failed: ${error.message}`,
      );
    }
  }

  async syncUsers(isManualSync: boolean = false) {
    // Check if sync is already in progress
    if (this.isSyncInProgress) {
      throw new InternalServerErrorException('Sync is already in progress');
    }

    try {
      this.isSyncInProgress = true;
      this.shouldCancelSync = false;
      this.currentSyncAbortController = new AbortController();

      const start = Date.now();

      // Check for cancellation before starting
      if (this.shouldCancelSync) {
        throw new Error('Sync was cancelled');
      }

      const users = await this.searchUsers(isManualSync);

      // Check for cancellation after search
      if (this.shouldCancelSync) {
        throw new Error('Sync was cancelled');
      }

      const duration = Date.now() - start;

      const syncHistoryDto: SyncHistoryDto = {
        timestamp: new Date(),
        status: SyncStatusEnum.SUCCESS,
        details: 'Sync completed successfully',
        usersFetched: Array.isArray(users) ? users.length : 0,
        duration,
      };

      await this.createSyncHistory(syncHistoryDto);

      return {
        users,
      };
    } catch (error) {
      // Create error history entry
      const syncHistoryDto: SyncHistoryDto = {
        timestamp: new Date(),
        status: SyncStatusEnum.ERROR,
        details: error.message || 'Sync failed',
        usersFetched: 0,
        duration: 0,
      };

      await this.createSyncHistory(syncHistoryDto);
      throw new InternalServerErrorException(error.message);
    } finally {
      this.isSyncInProgress = false;
      this.shouldCancelSync = false;
      this.currentSyncAbortController = null;
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
      return await this.stagedUserRepository.find({
        relations: ['createdBy', 'updatedBy'],
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async importStagedUsersIntoActualUsers(objectGUIDs: string[]) {
    console.log(
      '🚀 ~ LdapService ~ importStagedUsersIntoActualUsers ~ objectGUIDs:',
      objectGUIDs,
    );
    try {
      const stagedUsersNeedToImport = await this.stagedUserRepository.find({
        where: {
          objectGUID: In(objectGUIDs),
        },
      });
      console.log(
        '🚀 ~ LdapService ~ importStagedUsersIntoActualUsers ~ stagedUsersNeedToImport:',
        stagedUsersNeedToImport,
      );

      // Find existing users by objectGUID
      const existingUsers = await this.usersService.findAll();
      const existingUserMap = new Map(
        existingUsers.map((user) => [user.objectGUID, user]),
      );

      const results = {
        created: [] as any[],
        updated: [] as any[],
        errors: [] as any[],
      };

      for (const stagedUser of stagedUsersNeedToImport) {
        try {
          const existingUser = existingUserMap.get(stagedUser.objectGUID);

          if (existingUser) {
            // Update existing user
            const updateData = {
              firstName: stagedUser.givenName || existingUser.firstName,
              lastName: stagedUser.sn || existingUser.lastName,
              email: stagedUser.mail || existingUser.email,
              phone: stagedUser.mobile || existingUser.phone,
              address:
                stagedUser.additionalAttributes?.address ||
                existingUser.address,
            };

            const updatedUser = await this.usersService.update(
              existingUser.id,
              updateData,
            );
            results.updated.push(updatedUser);
          } else {
            // Create new user
            const createUserDto: CreateUserDto = {
              username: stagedUser.sAMAccountName,
              email: stagedUser.mail,
              password: '', // Temporary password - user will need to change
              firstName: stagedUser.givenName,
              lastName: stagedUser.sn,
              phone: stagedUser.mobile,
              address: stagedUser.additionalAttributes?.address,
              role: RoleEnum.USER,
              objectGUID: stagedUser.objectGUID,
              managerId: stagedUser.manager,
              status: StatusEnum.ACTIVE,
              createdById: '0745bd13-92f2-474e-8544-5018383c7b75',
              updatedById: '0745bd13-92f2-474e-8544-5018383c7b75',
            };

            const newUser = await this.usersService.create(createUserDto);
            results.created.push(newUser);
          }

          // Check if the user is imported
          const isImported = results.created.some(
            (user) => user.objectGUID === stagedUser.objectGUID,
          );

          await this.stagedUserRepository.update(
            { objectGUID: stagedUser.objectGUID },
            {
              status: isImported
                ? StagedUserStatusEnum.IMPORTED
                : StagedUserStatusEnum.UPDATED,
            },
          );
        } catch (error) {
          throw error;
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Import Staged Users Error:', error);
      throw new InternalServerErrorException(
        `Failed to import staged users: ${error.message}`,
      );
    }
  }

  async rejectStagedUsers(objectGUIDs: string[]) {
    try {
      await this.stagedUserRepository.update(
        { objectGUID: In(objectGUIDs) },
        {
          status: StagedUserStatusEnum.REJECTED,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async cancelSync() {
    try {
      if (!this.isSyncInProgress) {
        return {
          success: false,
          message: 'No sync operation is currently in progress',
        };
      }

      // Set the cancellation flag
      this.shouldCancelSync = true;

      // Abort the current sync operation if there's an abort controller
      if (this.currentSyncAbortController) {
        this.currentSyncAbortController.abort();
      }

      // Create a sync history entry for the cancellation
      const syncHistoryDto: SyncHistoryDto = {
        timestamp: new Date(),
        status: SyncStatusEnum.CANCELLED,
        details: 'Sync operation was cancelled by user',
        usersFetched: 0,
        duration: 0,
      };

      await this.createSyncHistory(syncHistoryDto);

      return {
        success: true,
        message:
          'Sync cancellation requested. The operation will stop at the next safe point.',
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Get current sync status
  async getSyncStatus() {
    return {
      isInProgress: this.isSyncInProgress,
      canCancel: this.isSyncInProgress && !this.shouldCancelSync,
    };
  }
}
