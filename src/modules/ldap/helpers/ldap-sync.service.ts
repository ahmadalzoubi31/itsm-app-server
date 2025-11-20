import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Entry } from 'ldapts';
import { LdapConfig } from '../entities/ldap-config.entity';
import { LdapSyncLog } from '../entities/ldap-sync-log.entity';
import { LdapClientService } from './ldap-client.service';
import { LdapUserMapperService, LdapUser } from './ldap-user-mapper.service';
import { UsersService } from '@modules/iam/users/users.service';
import { User } from '@modules/iam/users/entities/user.entity';
import { RolesService } from '@modules/iam/roles/roles.service';
import { LdapSyncOptionsDto } from '../dto/ldap.dto';
import { StagedUserService } from '../services/staged-user.service';

export interface SyncResult {
  success: boolean;
  usersProcessed: number;
  usersAdded: number;
  usersUpdated: number;
  usersDeactivated: number;
  usersSkipped: number;
  errors: string[];
}

/**
 * Service responsible for LDAP user synchronization logic
 */
@Injectable()
export class LdapSyncService {
  private readonly logger = new Logger(LdapSyncService.name);

  constructor(
    @InjectRepository(LdapSyncLog)
    private ldapSyncLogRepository: Repository<LdapSyncLog>,
    private ldapClientService: LdapClientService,
    private ldapUserMapperService: LdapUserMapperService,
    private usersService: UsersService,
    private rolesService: RolesService,
    private stagedUserService: StagedUserService,
  ) {}

  /**
   * Perform LDAP synchronization
   */
  async performSync(
    config: LdapConfig,
    syncLog: LdapSyncLog,
    options?: LdapSyncOptionsDto,
  ): Promise<void> {
    const startTime = Date.now();
    const client = this.ldapClientService.createLdapClient(config);

    try {
      // Bind with admin credentials
      await this.ldapClientService.bindUser(
        client,
        config.bindDN,
        config.bindPassword,
      );

      // Fetch all LDAP users
      const ldapUsers = await this.fetchAllLdapUsers(client, config);
      syncLog.usersProcessed = ldapUsers.length;

      this.logger.log(
        `Found ${ldapUsers.length} users in LDAP for config ${config.name} (fullSync: ${options?.fullSync ?? false})`,
      );

      const result: SyncResult = {
        success: true,
        usersProcessed: ldapUsers.length,
        usersAdded: 0,
        usersUpdated: 0,
        usersDeactivated: 0,
        usersSkipped: 0,
        errors: [],
      };

      // Process each user - write to staging table
      const externalIds: string[] = [];
      for (const ldapUser of ldapUsers) {
        // Check if sync was cancelled
        const currentLog = await this.ldapSyncLogRepository.findOne({
          where: { id: syncLog.id },
        });
        if (currentLog?.status === 'cancelled') {
          this.logger.log(`Sync ${syncLog.id} was cancelled`);
          return;
        }

        // Route user based on staging mode
        try {
          externalIds.push(ldapUser.externalId);

          // Ensure stagingMode is set (default to 'full' if not set)
          const stagingMode = config.stagingMode || 'full';

          // Log staging mode for debugging
          if (!config.stagingMode) {
            this.logger.warn(
              `Config ${config.id} has no stagingMode set, defaulting to 'full'`,
            );
          }

          this.logger.debug(
            `Processing LDAP user: ${ldapUser.username} (staging mode: ${stagingMode})`,
          );

          if (stagingMode === 'disabled') {
            // Direct sync - no staging
            await this.syncUserDirect(
              ldapUser,
              config,
              result,
              options?.dryRun,
              options?.fullSync ?? false,
            );
          } else if (stagingMode === 'new-only') {
            // Check if user exists
            let existingUser = await this.usersService
              .listUsers({ externalId: ldapUser.externalId })
              .then((users) => users[0]);

            if (!existingUser) {
              existingUser = await this.usersService
                .listUsers({ username: ldapUser.username.toLowerCase() })
                .then((users) => users[0]);
            }

            if (existingUser) {
              // Existing user - sync directly
              await this.syncUserDirect(
                ldapUser,
                config,
                result,
                options?.dryRun,
                options?.fullSync ?? false,
              );
            } else {
              // New user - go to staging
              await this.stageUser(
                ldapUser,
                config,
                syncLog.id,
                result,
                options?.dryRun,
                options?.fullSync ?? false,
              );
            }
          } else {
            // 'full' mode - all users go to staging
            await this.stageUser(
              ldapUser,
              config,
              syncLog.id,
              result,
              options?.dryRun,
              options?.fullSync ?? false,
            );
          }
        } catch (error) {
          result.errors.push(
            `Error syncing user ${ldapUser.username}: ${error.message}`,
          );
          this.logger.error(
            `Error syncing user ${ldapUser.username}: ${error.message}`,
          );
        }
      }

      // Mark users as disabled if removed from LDAP
      // Only mark as disabled in staging if staging mode is not 'disabled'
      if (
        config.deactivateRemovedUsers &&
        !options?.dryRun &&
        config.stagingMode !== 'disabled'
      ) {
        const disabledCount = await this.markRemovedUsersAsDisabled(
          syncLog.id,
          externalIds,
        );
        result.usersDeactivated = disabledCount;
      } else if (
        config.deactivateRemovedUsers &&
        !options?.dryRun &&
        config.stagingMode === 'disabled'
      ) {
        // Direct deactivation when staging is disabled
        result.usersDeactivated =
          await this.deactivateRemovedUsersDirect(externalIds);
      }

      // Update sync log
      syncLog.usersAdded = result.usersAdded;
      syncLog.usersUpdated = result.usersUpdated;
      syncLog.usersDeactivated = result.usersDeactivated;
      syncLog.usersSkipped = result.usersSkipped;
      syncLog.errors = result.errors.length;
      syncLog.errorDetails =
        result.errors.length > 0 ? result.errors.join('\n') : undefined;
      syncLog.status = result.errors.length > 0 ? 'failed' : 'completed';
      syncLog.syncEndTime = new Date();
      syncLog.durationMs = Date.now() - startTime;

      await this.ldapSyncLogRepository.save(syncLog);

      this.logger.log(
        `LDAP sync completed for ${config.name}. Added: ${result.usersAdded}, Updated: ${result.usersUpdated}, Skipped: ${result.usersSkipped}, Deactivated: ${result.usersDeactivated}, Errors: ${result.errors.length}`,
      );
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errorDetails = error.message;
      syncLog.syncEndTime = new Date();
      syncLog.durationMs = Date.now() - startTime;

      if (error.stack) {
        syncLog.metadata = {
          ...syncLog.metadata,
          errorStack: error.stack.split('\n').slice(0, 10),
        };
      }

      await this.ldapSyncLogRepository.save(syncLog);
      this.logger.error(`LDAP sync failed: ${error.message}`, error.stack);
    } finally {
      await client.unbind().catch(() => {});
    }
  }

  /**
   * Fetch all LDAP users with pagination
   */
  private async fetchAllLdapUsers(
    client: Client,
    config: LdapConfig,
  ): Promise<LdapUser[]> {
    const attributes = this.ldapUserMapperService.buildAttributeList(config);

    const ldapUsers: LdapUser[] = [];

    try {
      const entries = await this.ldapClientService.fetchAllLdapUsers(
        client,
        config,
        attributes,
      );

      for (const entry of entries) {
        try {
          const mappedUser = this.ldapUserMapperService.mapLdapEntryToUser(
            config,
            entry,
          );
          if (mappedUser) {
            ldapUsers.push(mappedUser);
          }
        } catch (error) {
          this.logger.warn(
            `Failed to map LDAP entry: ${entry.dn} - ${error.message}`,
          );
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch LDAP users: ${error.message}`,
      );
    }

    return ldapUsers;
  }

  /**
   * Sync user directly to main table (bypass staging)
   * Used when stagingMode is 'disabled' or 'new-only' for existing users
   */
  private async syncUserDirect(
    ldapUser: LdapUser,
    config: LdapConfig,
    result: SyncResult,
    dryRun: boolean = false,
    fullSync: boolean = false,
  ): Promise<void> {
    try {
      // Find existing user
      let existingUser = await this.usersService
        .listUsers({ externalId: ldapUser.externalId })
        .then((users) => users[0]);

      if (!existingUser) {
        existingUser = await this.usersService
          .listUsers({ username: ldapUser.username.toLowerCase() })
          .then((users) => users[0]);
      }

      if (dryRun) {
        if (existingUser) {
          result.usersUpdated++;
        } else {
          result.usersAdded++;
        }
        return;
      }

      // Check if user data has changed (only when fullSync=false)
      if (
        existingUser &&
        !fullSync &&
        !this.hasUserDataChanged(ldapUser, existingUser, config)
      ) {
        result.usersSkipped++;
        this.logger.debug(`Skipped unchanged user: ${ldapUser.username}`);
        return;
      }

      if (existingUser) {
        // Update existing user with metadata
        await this.usersService.updateUser(existingUser.id, {
          email: ldapUser.email,
          displayName: ldapUser.displayName,
          isActive: ldapUser.isActive,
          metadata: {
            ...existingUser.metadata,
            ...ldapUser.metadata,
            lastLdapSync: new Date().toISOString(),
          },
        });

        // Update roles if mapping exists
        if (config.roleMappings && ldapUser.roles.length > 0) {
          await this.updateUserRoles(existingUser.id, ldapUser.roles);
        }

        result.usersUpdated++;
        this.logger.debug(`Updated user directly: ${ldapUser.username}`);
      } else {
        // Create new user with metadata
        const newUser = await this.usersService.createUser({
          username: ldapUser.username.toLowerCase(),
          email: ldapUser.email,
          displayName: ldapUser.displayName,
          authSource: 'ldap',
          externalId: ldapUser.externalId,
          isActive: ldapUser.isActive,
          isLicensed: true,
          metadata: {
            ...ldapUser.metadata,
            lastLdapSync: new Date().toISOString(),
          },
        });

        // Assign roles if mapping exists
        if (config.roleMappings && ldapUser.roles.length > 0) {
          await this.updateUserRoles(newUser.id, ldapUser.roles);
        }

        result.usersAdded++;
        this.logger.debug(`Created user directly: ${ldapUser.username}`);
      }
    } catch (error) {
      result.errors.push(
        `Failed to sync user ${ldapUser.username}: ${error.message}`,
      );
      result.usersSkipped++;
    }
  }

  /**
   * Stage individual user (write to staging table instead of directly creating/updating)
   */
  private async stageUser(
    ldapUser: LdapUser,
    config: LdapConfig,
    syncLogId: string,
    result: SyncResult,
    dryRun: boolean = false,
    fullSync: boolean = false,
  ): Promise<void> {
    try {
      // Find existing user to determine status
      let existingUser = await this.usersService
        .listUsers({ externalId: ldapUser.externalId })
        .then((users) => users[0]);

      if (!existingUser) {
        existingUser = await this.usersService
          .listUsers({ username: ldapUser.username.toLowerCase() })
          .then((users) => users[0]);
      }

      if (dryRun) {
        if (existingUser) {
          result.usersUpdated++;
        } else {
          result.usersAdded++;
        }
        return;
      }

      // Check if user data has changed (only when fullSync=false)
      if (
        existingUser &&
        !fullSync &&
        !this.hasUserDataChanged(ldapUser, existingUser, config)
      ) {
        result.usersSkipped++;
        this.logger.debug(`Skipped unchanged user: ${ldapUser.username}`);
        return;
      }

      // Add roles to metadata for later import
      const metadataWithRoles = {
        ...ldapUser.metadata,
        roles: ldapUser.roles,
      };

      // Stage the user
      await this.stagedUserService.createOrUpdate(
        syncLogId,
        {
          objectGUID: ldapUser.externalId,
          username: ldapUser.username,
          email: ldapUser.email,
          displayName: ldapUser.displayName,
          metadata: metadataWithRoles,
        },
        existingUser,
      );

      if (existingUser) {
        result.usersUpdated++;
        this.logger.debug(`Staged updated user: ${ldapUser.username}`);
      } else {
        result.usersAdded++;
        this.logger.debug(`Staged new user: ${ldapUser.username}`);
      }
    } catch (error) {
      result.errors.push(
        `Failed to stage user ${ldapUser.username}: ${error.message}`,
      );
      result.usersSkipped++;
    }
  }

  /**
   * Check if user data has changed compared to LDAP data
   */
  private hasUserDataChanged(
    ldapUser: LdapUser,
    existingUser: User,
    config: LdapConfig,
  ): boolean {
    // Check basic fields
    if (
      existingUser.email !== ldapUser.email ||
      existingUser.displayName !== ldapUser.displayName ||
      existingUser.isActive !== ldapUser.isActive
    ) {
      return true;
    }

    // Check roles if role mappings exist
    if (config.roleMappings) {
      const existingRoleNames = (existingUser.roles || []).map((r) => r.name);
      const ldapRoleNames = ldapUser.roles || [];

      // Sort arrays for comparison
      const sortedExisting = [...existingRoleNames].sort().join(',');
      const sortedLdap = [...ldapRoleNames].sort().join(',');

      if (sortedExisting !== sortedLdap) {
        return true;
      }
    }

    // Check metadata changes (deep comparison)
    if (this.hasMetadataChanged(ldapUser.metadata, existingUser.metadata)) {
      return true;
    }

    return false;
  }

  /**
   * Check if metadata has changed
   */
  private hasMetadataChanged(
    ldapMetadata?: Record<string, any>,
    existingMetadata?: Record<string, any>,
  ): boolean {
    // If both are undefined or null, no change
    if (!ldapMetadata && !existingMetadata) {
      return false;
    }

    // If one is undefined/null and the other isn't, there's a change
    if (!ldapMetadata || !existingMetadata) {
      return true;
    }

    // Compare each key in LDAP metadata
    for (const key in ldapMetadata) {
      if (key === 'lastLdapSync') {
        // Skip lastLdapSync as it's updated on every sync
        continue;
      }

      const ldapValue = ldapMetadata[key];
      const existingValue = existingMetadata[key];

      // Handle null/undefined comparison
      if (ldapValue !== existingValue) {
        // Deep comparison for objects/arrays
        if (
          typeof ldapValue === 'object' &&
          typeof existingValue === 'object' &&
          ldapValue !== null &&
          existingValue !== null
        ) {
          if (JSON.stringify(ldapValue) !== JSON.stringify(existingValue)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    // Check if any keys were removed from LDAP
    for (const key in existingMetadata) {
      if (key === 'lastLdapSync') {
        continue;
      }
      if (!(key in ldapMetadata)) {
        // Key exists in existing but not in LDAP - consider it a change
        // (LDAP might have removed the attribute)
        return true;
      }
    }

    return false;
  }

  /**
   * Deactivate users directly (when staging is disabled)
   */
  private async deactivateRemovedUsersDirect(
    activeExternalIds: string[],
  ): Promise<number> {
    try {
      const ldapUsers = await this.usersService.listUsers({
        authSource: 'ldap',
        isActive: true,
      });

      let deactivatedCount = 0;

      for (const user of ldapUsers) {
        if (user.externalId && !activeExternalIds.includes(user.externalId)) {
          await this.usersService.updateUser(user.id, { isActive: false });
          deactivatedCount++;
          this.logger.debug(`Deactivated removed user: ${user.username}`);
        }
      }

      return deactivatedCount;
    } catch (error) {
      this.logger.error(`Failed to deactivate removed users: ${error.message}`);
      return 0;
    }
  }

  /**
   * Mark users as disabled in staging if removed from LDAP
   */
  private async markRemovedUsersAsDisabled(
    syncLogId: string,
    activeExternalIds: string[],
  ): Promise<number> {
    try {
      // Get all LDAP users from main table
      const ldapUsers = await this.usersService.listUsers({
        authSource: 'ldap',
        isActive: true,
      });

      const removedExternalIds: string[] = [];
      for (const user of ldapUsers) {
        if (user.externalId && !activeExternalIds.includes(user.externalId)) {
          removedExternalIds.push(user.externalId);
        }
      }

      if (removedExternalIds.length > 0) {
        await this.stagedUserService.markAsDisabled(
          syncLogId,
          removedExternalIds,
        );
        this.logger.debug(
          `Marked ${removedExternalIds.length} users as disabled in staging`,
        );
      }

      return removedExternalIds.length;
    } catch (error) {
      this.logger.error(
        `Failed to mark removed users as disabled: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Update user roles
   */
  private async updateUserRoles(
    userId: string,
    roleNames: string[],
  ): Promise<void> {
    try {
      const roles = await this.rolesService.listRoles();
      const roleIds = roles
        .filter((r) => roleNames.includes(r.name))
        .map((r) => r.id);

      if (roleIds.length > 0) {
        await this.rolesService.assignRolesToUser(userId, {
          roleIds,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to update user roles: ${error.message}`);
    }
  }
}
