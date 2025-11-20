import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StagedUser, StagedUserStatus } from '../entities/staged-user.entity';
import { UsersService } from '@modules/iam/users/users.service';
import { RolesService } from '@modules/iam/roles/roles.service';
import { LdapConfig } from '../entities/ldap-config.entity';
import { User } from '@modules/iam/users/entities/user.entity';

@Injectable()
export class StagedUserService {
  private readonly logger = new Logger(StagedUserService.name);

  constructor(
    @InjectRepository(StagedUser)
    private stagedUserRepository: Repository<StagedUser>,
    private usersService: UsersService,
    private rolesService: RolesService,
  ) {}

  /**
   * Get all staged users, optionally filtered by status
   */
  async findAll(status?: StagedUserStatus): Promise<StagedUser[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.stagedUserRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get staged user by ID
   */
  async findOne(id: string): Promise<StagedUser> {
    const stagedUser = await this.stagedUserRepository.findOne({
      where: { id },
    });
    if (!stagedUser) {
      throw new NotFoundException(`Staged user with ID ${id} not found`);
    }
    return stagedUser;
  }

  /**
   * Create or update staged user
   * Uses objectGUID as the unique identifier (primary key between staged and production users)
   * Handles race conditions by catching duplicate key errors and retrying with update
   */
  async createOrUpdate(
    syncLogId: string,
    ldapUser: {
      objectGUID: string;
      username: string;
      email: string;
      displayName: string;
      metadata?: Record<string, any>;
    },
    existingUser?: User,
  ): Promise<StagedUser> {
    // Check if staged user already exists by objectGUID (unique identifier)
    // This ensures we update existing staged users even if they come from a different sync
    let stagedUser = await this.stagedUserRepository.findOne({
      where: {
        objectGUID: ldapUser.objectGUID,
      },
    });

    // Determine status based on whether user exists in production
    let status: StagedUserStatus;
    if (existingUser) {
      // Check if data has changed
      const hasChanged =
        existingUser.email !== ldapUser.email ||
        existingUser.displayName !== ldapUser.displayName;
      status = hasChanged ? StagedUserStatus.UPDATED : StagedUserStatus.NEW;
    } else {
      status = StagedUserStatus.NEW;
    }

    // If staged user exists but was previously imported/rejected, reset status
    if (stagedUser) {
      if (
        stagedUser.status === StagedUserStatus.IMPORTED ||
        stagedUser.status === StagedUserStatus.REJECTED
      ) {
        // Reset to NEW/UPDATED status if user is being synced again
        stagedUser.status = status;
        stagedUser.importedAt = undefined;
        stagedUser.importedById = undefined;
        stagedUser.importedByName = undefined;
        stagedUser.rejectedAt = undefined;
        stagedUser.rejectedById = undefined;
        stagedUser.rejectedByName = undefined;
        stagedUser.rejectionReason = undefined;
      } else {
        // Keep existing status if it's NEW or UPDATED, but update it if needed
        if (status === StagedUserStatus.UPDATED) {
          stagedUser.status = StagedUserStatus.UPDATED;
        }
      }
    }

    // Extract attributes from metadata
    const metadata = ldapUser.metadata || {};
    const stagedData = {
      syncLogId, // Update syncLogId to track which sync last updated this user
      objectGUID: ldapUser.objectGUID,
      cn: metadata.cn || metadata.displayName || ldapUser.displayName,
      mail: ldapUser.email,
      sAMAccountName: ldapUser.username,
      displayName: ldapUser.displayName,
      department: metadata.department,
      givenName: metadata.firstName || metadata.givenName,
      sn: metadata.lastName || metadata.sn,
      title: metadata.title,
      mobile: metadata.mobile || metadata.phone,
      userPrincipalName: metadata.userPrincipalName,
      manager: metadata.manager,
      additionalAttributes: metadata,
      status: stagedUser?.status || status,
      userId: existingUser?.id,
    };

    console.log('stagedUser', stagedUser);
    if (stagedUser) {
      console.log('stagedUser exists, updating');
      // Update existing staged user
      Object.assign(stagedUser, stagedData);
      return this.stagedUserRepository.save(stagedUser);
    } else {
      console.log('stagedUser does not exist, creating');
      // Try to create new staged user
      // Handle race condition: if another process creates it between findOne and save,
      // catch the duplicate key error and retry with update
      try {
        stagedUser = this.stagedUserRepository.create(stagedData);
        return await this.stagedUserRepository.save(stagedUser);
      } catch (error: any) {
        // Check if it's a duplicate key error on objectGUID
        // PostgreSQL error code 23505 = unique_violation
        const isDuplicateKeyError =
          error.code === '23505' ||
          error.code === 23505 ||
          (error.message &&
            (error.message.includes('duplicate key value') ||
              error.message.includes('unique constraint')) &&
            (error.message.includes('objectGUID') ||
              error.message.includes('IDX_staged_user_objectGUID')));

        if (isDuplicateKeyError) {
          // Race condition: another process created it, fetch and update
          this.logger.debug(
            `Race condition detected for objectGUID ${ldapUser.objectGUID}, retrying with update`,
          );
          stagedUser = await this.stagedUserRepository.findOne({
            where: {
              objectGUID: ldapUser.objectGUID,
            },
          });

          if (!stagedUser) {
            // This shouldn't happen, but handle it gracefully
            throw new Error(
              `Failed to find staged user with objectGUID ${ldapUser.objectGUID} after duplicate key error`,
            );
          }

          // Update the existing record
          Object.assign(stagedUser, stagedData);
          return this.stagedUserRepository.save(stagedUser);
        }
        // Re-throw if it's a different error
        throw error;
      }
    }
  }

  /**
   * Import staged users to main user table
   */
  async importUsers(
    ids: string[],
    userId: string,
    userName: string,
    config?: LdapConfig,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    // First, find all staged users with the provided IDs (regardless of status)
    const allStagedUsers = await this.stagedUserRepository.find({
      where: {
        id: In(ids),
      },
    });

    if (allStagedUsers.length === 0) {
      throw new BadRequestException(
        `No staged users found with the provided IDs. Requested IDs: ${ids.join(', ')}`,
      );
    }

    // Filter to only NEW and UPDATED status
    const stagedUsers = allStagedUsers.filter(
      (user) =>
        user.status === StagedUserStatus.NEW ||
        user.status === StagedUserStatus.UPDATED,
    );

    if (stagedUsers.length === 0) {
      const invalidStatuses = allStagedUsers.map(
        (u) => `${u.sAMAccountName || u.id} (${u.status})`,
      );
      throw new BadRequestException(
        `No valid staged users found to import. All selected users have invalid statuses: ${invalidStatuses.join(', ')}. Only users with status NEW or UPDATED can be imported.`,
      );
    }

    // Log if some IDs were filtered out
    if (stagedUsers.length < allStagedUsers.length) {
      const filteredOut = allStagedUsers.filter(
        (u) =>
          u.status !== StagedUserStatus.NEW &&
          u.status !== StagedUserStatus.UPDATED,
      );
      this.logger.warn(
        `Filtered out ${filteredOut.length} users with invalid statuses: ${filteredOut.map((u) => `${u.sAMAccountName} (${u.status})`).join(', ')}`,
      );
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const stagedUser of stagedUsers) {
      try {
        await this.importUser(stagedUser, userId, userName, config);
        imported++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import ${stagedUser.sAMAccountName}: ${error.message}`,
        );
        this.logger.error(
          `Failed to import staged user ${stagedUser.id}: ${error.message}`,
        );
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Import a single staged user
   */
  private async importUser(
    stagedUser: StagedUser,
    userId: string,
    userName: string,
    config?: LdapConfig,
  ): Promise<void> {
    // Check if user already exists
    let user = await this.usersService
      .listUsers({ externalId: stagedUser.objectGUID })
      .then((users) => users[0]);

    if (!user) {
      user = await this.usersService
        .listUsers({ username: stagedUser.sAMAccountName?.toLowerCase() })
        .then((users) => users[0]);
    }

    const userData = {
      username: stagedUser.sAMAccountName?.toLowerCase() || '',
      email: stagedUser.mail || '',
      displayName: stagedUser.displayName || stagedUser.sAMAccountName || '',
      authSource: 'ldap' as const,
      externalId: stagedUser.objectGUID,
      isActive: true,
      isLicensed: true,
      metadata: {
        ...stagedUser.additionalAttributes,
        department: stagedUser.department,
        title: stagedUser.title,
        mobile: stagedUser.mobile,
        userPrincipalName: stagedUser.userPrincipalName,
        manager: stagedUser.manager,
        firstName: stagedUser.givenName,
        lastName: stagedUser.sn,
        lastLdapSync: new Date().toISOString(),
      },
    };

    if (user) {
      // Update existing user
      await this.usersService.updateUser(user.id, userData);

      // Update roles if mapping exists
      if (config?.roleMappings && stagedUser.additionalAttributes?.roles) {
        await this.updateUserRoles(
          user.id,
          stagedUser.additionalAttributes.roles,
        );
      }
    } else {
      // Create new user
      user = await this.usersService.createUser(userData);

      // Assign roles if mapping exists
      if (config?.roleMappings && stagedUser.additionalAttributes?.roles) {
        await this.updateUserRoles(
          user.id,
          stagedUser.additionalAttributes.roles,
        );
      }
    }

    // Update staged user status
    stagedUser.status = StagedUserStatus.IMPORTED;
    stagedUser.importedAt = new Date();
    stagedUser.importedById = userId;
    stagedUser.importedByName = userName;
    stagedUser.userId = user.id;
    await this.stagedUserRepository.save(stagedUser);
  }

  /**
   * Reject staged users
   */
  async rejectUsers(
    ids: string[],
    userId: string,
    userName: string,
    reason?: string,
  ): Promise<{ rejected: number; failed: number; errors: string[] }> {
    const stagedUsers = await this.stagedUserRepository.find({
      where: {
        id: In(ids),
        status: In([StagedUserStatus.NEW, StagedUserStatus.UPDATED]),
      },
    });

    if (stagedUsers.length === 0) {
      throw new BadRequestException('No valid staged users found to reject');
    }

    let rejected = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const stagedUser of stagedUsers) {
      try {
        stagedUser.status = StagedUserStatus.REJECTED;
        stagedUser.rejectedAt = new Date();
        stagedUser.rejectedById = userId;
        stagedUser.rejectedByName = userName;
        stagedUser.rejectionReason = reason;
        await this.stagedUserRepository.save(stagedUser);
        rejected++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to reject ${stagedUser.sAMAccountName}: ${error.message}`,
        );
        this.logger.error(
          `Failed to reject staged user ${stagedUser.id}: ${error.message}`,
        );
      }
    }

    return { rejected, failed, errors };
  }

  /**
   * Mark users as disabled (removed from LDAP)
   * Uses objectGUID as the unique identifier
   */
  async markAsDisabled(
    syncLogId: string,
    objectGUIDs: string[],
  ): Promise<void> {
    await this.stagedUserRepository.update(
      {
        objectGUID: In(objectGUIDs),
        status: In([StagedUserStatus.NEW, StagedUserStatus.UPDATED]),
      },
      {
        status: StagedUserStatus.DISABLED,
        syncLogId, // Update syncLogId to track which sync marked this user as disabled
      },
    );
  }

  /**
   * Update user roles based on LDAP groups
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

  /**
   * Clean up old staged users (auto-reject after X days)
   */
  async cleanupOldStagedUsers(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.stagedUserRepository
      .createQueryBuilder()
      .update(StagedUser)
      .set({
        status: StagedUserStatus.REJECTED,
        rejectionReason: 'Auto-rejected after expiration period',
      })
      .where('status IN (:...statuses)', {
        statuses: [StagedUserStatus.NEW, StagedUserStatus.UPDATED],
      })
      .andWhere('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
