import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog, SyncTrigger } from './entities/ldap-sync-log.entity';
import {
  CreateLdapConfigDto,
  UpdateLdapConfigDto,
  LdapSyncOptionsDto,
  LdapAuthenticateDto,
} from './dto/ldap.dto';
import { UsersService } from '@modules/iam/users/users.service';
import { User } from '@modules/iam/users/entities/user.entity';
import { LdapClientService } from './helpers/ldap-client.service';
import { LdapUserMapperService } from './helpers/ldap-user-mapper.service';
import { LdapSyncService } from './helpers/ldap-sync.service';
import { LdapEncryptionService } from './helpers/ldap-encryption.service';

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);
  private activeSyncs = new Map<string, boolean>();

  constructor(
    @InjectRepository(LdapConfig)
    private ldapConfigRepository: Repository<LdapConfig>,
    @InjectRepository(LdapSyncLog)
    private ldapSyncLogRepository: Repository<LdapSyncLog>,
    private usersService: UsersService,
    private ldapClientService: LdapClientService,
    private ldapUserMapperService: LdapUserMapperService,
    private ldapSyncService: LdapSyncService,
    private ldapEncryptionService: LdapEncryptionService,
  ) {}

  /**
   * Scheduled sync job - runs every 5 minutes to check for configs that need syncing
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleScheduledSync() {
    this.logger.debug('Checking for LDAP configs that need syncing...');

    const now = new Date();
    const configs = await this.ldapConfigRepository.find({
      where: {
        isEnabled: true,
        autoSync: true,
      },
    });

    for (const config of configs) {
      try {
        // Check if sync is needed
        if (config.nextSyncAt && config.nextSyncAt <= now) {
          this.logger.log(
            `Auto-sync triggered for config: ${config.name} (${config.id})`,
          );
          await this.startSync(config.id, 'scheduled');
        }
      } catch (error) {
        this.logger.error(
          `Failed to trigger scheduled sync for config ${config.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Create LDAP configuration
   */
  async createConfig(
    createLdapConfigDto: CreateLdapConfigDto,
  ): Promise<LdapConfig> {
    try {
      // Encrypt password before saving
      const encryptedPassword = this.ldapEncryptionService.encryptPassword(
        createLdapConfigDto.bindPassword,
      );

      // Ensure stagingMode defaults to 'full' if not provided
      const stagingMode = createLdapConfigDto.stagingMode || 'full';

      const config = this.ldapConfigRepository.create({
        ...createLdapConfigDto,
        bindPassword: encryptedPassword,
        stagingMode,
      });

      // Calculate next sync time if auto-sync is enabled
      if (config.autoSync) {
        config.nextSyncAt = this.calculateNextSyncTime(
          config.syncIntervalMinutes,
        );
      }

      const savedConfig = await this.ldapConfigRepository.save(config);
      this.logger.log(`Created LDAP config: ${savedConfig.name}`);

      return savedConfig;
    } catch (error) {
      this.logger.error(`Failed to create LDAP config: ${error.message}`);
      throw new InternalServerErrorException('Failed to create LDAP config');
    }
  }

  /**
   * Update LDAP configuration
   */
  async updateConfig(
    id: string,
    updateLdapConfigDto: UpdateLdapConfigDto,
  ): Promise<LdapConfig> {
    const config = await this.ldapConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('LDAP configuration not found');
    }

    try {
      // Handle password update
      if (updateLdapConfigDto.bindPassword) {
        updateLdapConfigDto.bindPassword =
          this.ldapEncryptionService.encryptPassword(
            updateLdapConfigDto.bindPassword,
          );
      } else {
        delete updateLdapConfigDto.bindPassword;
      }

      Object.assign(config, updateLdapConfigDto);

      // Update next sync time if sync interval changed
      if (
        updateLdapConfigDto.syncIntervalMinutes ||
        updateLdapConfigDto.autoSync !== undefined
      ) {
        if (config.autoSync) {
          config.nextSyncAt = this.calculateNextSyncTime(
            config.syncIntervalMinutes,
          );
        } else {
          config.nextSyncAt = undefined;
        }
      }

      const updated = await this.ldapConfigRepository.save(config);
      this.logger.log(`Updated LDAP config: ${updated.name}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update LDAP config: ${error.message}`);
      throw new InternalServerErrorException('Failed to update LDAP config');
    }
  }

  /**
   * Get LDAP configuration by ID
   */
  async getConfig(
    id: string,
    includePassword: boolean = false,
  ): Promise<LdapConfig> {
    const config = await this.ldapConfigRepository.findOne({
      where: { id },
      select: includePassword
        ? {
            id: true,
            name: true,
            server: true,
            port: true,
            protocol: true,
            baseDN: true,
            bindDN: true,
            bindPassword: true,
            userSearchBase: true,
            userSearchFilter: true,
            userSearchScope: true,
            attributes: true,
            isEnabled: true,
            secureConnection: true,
            allowSelfSignedCert: true,
            groupMappings: true,
            roleMappings: true,
            syncIntervalMinutes: true,
            lastSyncAt: true,
            nextSyncAt: true,
            autoSync: true,
            deactivateRemovedUsers: true,
            connectionTimeout: true,
            pageSizeLimit: true,
            stagingMode: true,
            createdAt: true,
            updatedAt: true,
          }
        : {
            id: true,
            name: true,
            server: true,
            port: true,
            protocol: true,
            baseDN: true,
            bindDN: true,
            userSearchBase: true,
            userSearchFilter: true,
            userSearchScope: true,
            attributes: true,
            isEnabled: true,
            secureConnection: true,
            allowSelfSignedCert: true,
            groupMappings: true,
            roleMappings: true,
            syncIntervalMinutes: true,
            lastSyncAt: true,
            nextSyncAt: true,
            autoSync: true,
            deactivateRemovedUsers: true,
            connectionTimeout: true,
            pageSizeLimit: true,
            stagingMode: true,
            createdAt: true,
            updatedAt: true,
          },
    });

    if (!config) {
      throw new NotFoundException('LDAP configuration not found');
    }

    // Decrypt password if requested
    if (includePassword && config.bindPassword) {
      config.bindPassword = this.ldapEncryptionService.decryptPassword(
        config.bindPassword,
      );
    }

    // Ensure stagingMode has a default value if not set
    if (!config.stagingMode) {
      config.stagingMode = 'full';
      this.logger.warn(
        `Config ${config.id} has no stagingMode, defaulting to 'full'`,
      );
    }

    return config;
  }

  /**
   * Get all LDAP configurations
   */
  async getAllConfigs(): Promise<LdapConfig[]> {
    return this.ldapConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete LDAP configuration
   */
  async deleteConfig(id: string): Promise<void> {
    const result = await this.ldapConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('LDAP configuration not found');
    }
    this.logger.log(`Deleted LDAP config: ${id}`);
  }

  /**
   * Test LDAP connection and authentication
   */
  async testConnection(
    id: string,
  ): Promise<{ success: boolean; message: string; userInfo?: any }> {
    const config = await this.getConfig(id, true);
    const client = this.ldapClientService.createLdapClient(config);

    try {
      // First bind with admin credentials
      await this.ldapClientService.bindUser(
        client,
        config.bindDN,
        config.bindPassword,
      );

      // Try to bind with user credentials
      await client.unbind();

      // Get user info
      const attributes = this.ldapUserMapperService.buildAttributeList(config);
      const entry = await this.ldapClientService.fetchUserInfo(
        client,
        config.bindDN,
        attributes,
      );

      const userInfo = entry
        ? this.ldapUserMapperService.mapLdapEntry(config, entry)
        : null;

      return {
        success: true,
        message: 'Authentication successful',
        userInfo,
      };
    } catch (error) {
      this.logger.error(
        `LDAP test connection failed: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: error.message || 'LDAP authentication failed',
      };
    } finally {
      await client.unbind().catch(() => {});
    }
  }

  /**
   * Authenticate user via LDAP
   */
  async authenticateUser(dto: LdapAuthenticateDto): Promise<User | null> {
    const configs = await this.ldapConfigRepository.find({
      where: { isEnabled: true },
    });

    if (configs.length === 0) {
      throw new NotFoundException('No active LDAP configuration found');
    }

    // Try each enabled config
    for (const config of configs) {
      try {
        // Decrypt password for use
        const decryptedPassword = this.ldapEncryptionService.decryptPassword(
          config.bindPassword,
        );
        const configWithDecryptedPassword = {
          ...config,
          bindPassword: decryptedPassword,
        };

        const user = await this.tryAuthenticateWithConfig(
          configWithDecryptedPassword,
          dto.username,
          dto.password,
        );
        if (user) {
          return user;
        }
      } catch (error) {
        this.logger.debug(
          `Auth failed for config ${config.name}: ${error.message}`,
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Start LDAP synchronization
   */
  async startSync(
    configId: string,
    trigger: SyncTrigger = 'manual',
    options?: LdapSyncOptionsDto,
  ): Promise<LdapSyncLog> {
    // Check if sync is already running for this config
    if (this.activeSyncs.get(configId)) {
      throw new BadRequestException(
        'Sync is already in progress for this configuration',
      );
    }

    const config = await this.getConfig(configId, true);

    if (!config.isEnabled) {
      throw new BadRequestException('LDAP configuration is disabled');
    }

    // Create sync log
    const syncLog = this.ldapSyncLogRepository.create({
      configId,
      syncStartTime: new Date(),
      status: 'in_progress',
      trigger,
      metadata: {
        serverUrl: `${config.protocol}://${config.server}:${config.port}`,
        userSearchBase: config.userSearchBase,
        userSearchFilter: config.userSearchFilter,
      },
    });

    await this.ldapSyncLogRepository.save(syncLog);

    // Mark sync as active
    this.activeSyncs.set(configId, true);

    // Start sync process asynchronously
    this.ldapSyncService
      .performSync(config, syncLog, options)
      .then(async () => {
        // Remove from active syncs when complete
        this.activeSyncs.delete(configId);

        // Update config last sync time
        if (!options?.dryRun) {
          const updateData: Partial<LdapConfig> = {
            lastSyncAt: new Date(),
          };

          if (config.autoSync) {
            updateData.nextSyncAt = this.calculateNextSyncTime(
              config.syncIntervalMinutes,
            );
          }

          await this.ldapConfigRepository.update(configId, updateData);
        }
      })
      .catch((error) => {
        this.logger.error(`Sync process failed: ${error.message}`, error.stack);
        this.activeSyncs.delete(configId);
      });

    return syncLog;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(syncId: string): Promise<LdapSyncLog> {
    const syncLog = await this.ldapSyncLogRepository.findOne({
      where: { id: syncId },
      relations: ['config'],
    });

    if (!syncLog) {
      throw new NotFoundException('Sync log not found');
    }

    return syncLog;
  }

  /**
   * Get sync history for a configuration
   */
  async getSyncHistory(
    configId: string,
    limit: number = 50,
  ): Promise<LdapSyncLog[]> {
    return this.ldapSyncLogRepository.find({
      where: { configId },
      order: { syncStartTime: 'DESC' },
      take: limit,
    });
  }

  /**
   * Cancel ongoing sync
   */
  async cancelSync(configId?: string): Promise<LdapSyncLog> {
    const whereClause: any = { status: 'in_progress' };
    if (configId) {
      whereClause.configId = configId;
    }

    const running = await this.ldapSyncLogRepository.findOne({
      where: whereClause,
      order: { syncStartTime: 'DESC' },
    });

    if (!running) {
      throw new NotFoundException('No running LDAP sync found');
    }

    running.status = 'cancelled';
    running.syncEndTime = new Date();
    running.durationMs =
      running.syncEndTime.getTime() - running.syncStartTime.getTime();
    running.metadata = {
      ...running.metadata,
      cancelledAt: new Date().toISOString(),
    };

    await this.ldapSyncLogRepository.save(running);

    // Remove from active syncs
    this.activeSyncs.delete(running.configId);

    this.logger.log(`Cancelled LDAP sync ${running.id}`);
    return running;
  }

  /**
   * Get sample LDAP users
   */
  async showSample(configId?: string): Promise<any[]> {
    let config: LdapConfig;

    if (configId) {
      config = await this.getConfig(configId, true);
    } else {
      const configs = await this.getAllConfigs();
      if (!configs || configs.length === 0) {
        throw new NotFoundException('No LDAP configuration found');
      }
      config = configs[0];
      // Decrypt password for use
      const decryptedPassword = this.ldapEncryptionService.decryptPassword(
        config.bindPassword,
      );
      config = { ...config, bindPassword: decryptedPassword };
    }

    const client = this.ldapClientService.createLdapClient(config);

    try {
      await this.ldapClientService.bindUser(
        client,
        config.bindDN,
        config.bindPassword,
      );

      const attributes = this.ldapUserMapperService.buildAttributeList(config);

      const { searchEntries } = await client.search(config.userSearchBase, {
        scope: 'sub',
        filter: config.userSearchFilter,
        attributes,
        sizeLimit: 10,
      });

      return searchEntries.map((entry) =>
        this.ldapUserMapperService.mapLdapEntry(config, entry),
      );
    } catch (err) {
      this.logger.error(`Failed to fetch sample LDAP users: ${err.message}`);
      throw new InternalServerErrorException(
        `Failed to fetch sample: ${err.message}`,
      );
    } finally {
      await client.unbind().catch(() => {});
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Try to authenticate with a specific config
   */
  private async tryAuthenticateWithConfig(
    config: LdapConfig,
    username: string,
    password: string,
  ): Promise<User | null> {
    const client = this.ldapClientService.createLdapClient(config);

    try {
      // Bind with admin to search for user
      await this.ldapClientService.bindUser(
        client,
        config.bindDN,
        config.bindPassword,
      );

      // Find user DN
      const usernameAttr = this.ldapUserMapperService.resolveAttribute(
        config,
        'username',
        ['sAMAccountName', 'uid', 'cn'],
      );
      const userDN = await this.ldapClientService.findUserDN(
        client,
        config,
        username,
        usernameAttr,
      );
      if (!userDN) {
        return null;
      }

      // Authenticate user
      await client.unbind();
      await this.ldapClientService.bindUser(client, userDN, password);

      // Get user details
      const attributes = this.ldapUserMapperService.buildAttributeList(config);
      attributes.push('objectGUID', 'objectSid', 'memberOf');

      const entry = await this.ldapClientService.fetchUserInfo(
        client,
        userDN,
        attributes,
      );

      if (!entry) {
        return null;
      }

      const ldapUser = this.ldapUserMapperService.mapLdapEntryToUser(
        config,
        entry,
      );

      if (!ldapUser) {
        return null;
      }

      // Find or create user in database
      let user = await this.usersService
        .listUsers({ externalId: ldapUser.externalId })
        .then((users) => users[0]);

      if (!user) {
        user = await this.usersService
          .listUsers({ username: ldapUser.username })
          .then((users) => users[0]);
      }

      if (user) {
        // Update last login
        await this.usersService.updateUser(user.id, {
          isActive: true,
        });
      } else {
        // Create new user
        user = await this.usersService.createUser({
          username: ldapUser.username,
          email: ldapUser.email,
          displayName: ldapUser.displayName,
          authSource: 'ldap',
          externalId: ldapUser.externalId,
          isActive: true,
          isLicensed: true,
          metadata: ldapUser.metadata,
        });
      }

      return user;
    } catch (error) {
      this.logger.debug(
        `Auth failed with config ${config.name}: ${error.message}`,
      );
      return null;
    } finally {
      await client.unbind().catch(() => {});
    }
  }

  /**
   * Calculate next sync time
   */
  private calculateNextSyncTime(intervalMinutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + intervalMinutes * 60 * 1000);
  }
}
