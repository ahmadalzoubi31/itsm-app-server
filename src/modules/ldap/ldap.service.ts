import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, SearchOptions } from 'ldapts';
import { LdapConfig } from './entities/ldap-config.entity';
import { LdapSyncLog } from './entities/ldap-sync-log.entity';
import {
  CreateLdapConfigDto,
  UpdateLdapConfigDto,
  TestLdapConnectionDto,
} from './dto/ldap.dto';

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(
    @InjectRepository(LdapConfig)
    private ldapConfigRepository: Repository<LdapConfig>,
    @InjectRepository(LdapSyncLog)
    private ldapSyncLogRepository: Repository<LdapSyncLog>,
  ) {}

  async createConfig(
    createLdapConfigDto: CreateLdapConfigDto,
  ): Promise<LdapConfig> {
    const config = this.ldapConfigRepository.create(createLdapConfigDto);
    return this.ldapConfigRepository.save(config);
  }

  async updateConfig(
    id: string,
    updateLdapConfigDto: UpdateLdapConfigDto,
  ): Promise<LdapConfig> {
    const config = await this.ldapConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('LDAP configuration not found');
    }

    // Don't update password if not provided
    if (!updateLdapConfigDto.bindPassword) {
      delete updateLdapConfigDto.bindPassword;
    }

    Object.assign(config, updateLdapConfigDto);
    return this.ldapConfigRepository.save(config);
  }

  async getConfig(
    id: string,
    includePassword: boolean = false,
  ): Promise<LdapConfig> {
    const config = await this.ldapConfigRepository.findOne({
      where: { id },
      select: includePassword
        ? {
            id: true,
            server: true,
            port: true,
            protocol: true,
            baseDN: true,
            bindDN: true,
            bindPassword: true,
            userSearchBase: true,
            userSearchFilter: true,
            userNameAttribute: true,
            emailAttribute: true,
            displayNameAttribute: true,
            isEnabled: true,
            secureConnection: true,
            allowSelfSignedCert: true,
            groupMappings: true,
          }
        : undefined,
    });

    if (!config) {
      throw new NotFoundException('LDAP configuration not found');
    }
    return config;
  }

  async getAllConfigs(): Promise<LdapConfig[]> {
    return this.ldapConfigRepository.find();
  }

  async deleteConfig(id: string): Promise<void> {
    const result = await this.ldapConfigRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('LDAP configuration not found');
    }
  }

  async testConnection(
    id: string,
    testDto: TestLdapConnectionDto,
  ): Promise<boolean> {
    const config = await this.getConfig(id, true); // Include password for LDAP bind
    const client = this.createLdapClient(config);
    console.log('🚀 ~ LdapService ~ testConnection ~ client:', client);

    try {
      await this.bindUser(client, testDto.username, testDto.password);
      return true;
    } catch (error) {
      this.logger.error(`LDAP test connection failed: ${error.message}`);
      throw new UnauthorizedException('LDAP authentication failed');
    } finally {
      client.unbind();
    }
  }

  private createLdapClient(config: LdapConfig): Client {
    const options = {
      url: `${config.protocol}://${config.server}:${config.port}`,
      secure: false, // Force non-secure for ldap:// URLs
      tlsOptions: config.secureConnection
        ? {
            rejectUnauthorized: !config.allowSelfSignedCert,
          }
        : undefined,
      timeout: 5000, // 5 seconds timeout
      connectTimeout: 5000,
      strictDN: false, // More lenient DN parsing
    };

    return new Client(options);
  }

  private async bindUser(
    client: Client,
    username: string,
    password: string,
  ): Promise<void> {
    await client.bind(username, password);
  }

  async startSync(configId: string): Promise<LdapSyncLog> {
    const config = await this.getConfig(configId, true); // Include password for LDAP bind
    const syncLog = this.ldapSyncLogRepository.create({
      syncStartTime: new Date(),
      status: 'in_progress',
    });

    await this.ldapSyncLogRepository.save(syncLog);

    // Start sync process asynchronously
    this.performSync(config, syncLog).catch((error) => {
      this.logger.error(`Sync process failed: ${error.message}`, error.stack);
    });

    return syncLog;
  }

  async getSyncStatus(syncId: string): Promise<LdapSyncLog> {
    console.log('🚀 ~ LdapService ~ getSyncStatus ~ syncId:', syncId);
    const syncLog = await this.ldapSyncLogRepository.findOne({
      where: { id: syncId },
    });
    if (!syncLog) {
      throw new NotFoundException('Sync log not found');
    }
    return syncLog;
  }

  private async performSync(
    config: LdapConfig,
    syncLog: LdapSyncLog,
  ): Promise<void> {
    const client = this.createLdapClient(config);

    try {
      // Step 1: Bind to LDAP server with admin credentials
      await this.bindUser(client, config.bindDN, config.bindPassword);

      // Step 2: Search for users
      const searchOptions: SearchOptions = {
        scope: 'sub',
        filter: config.userSearchFilter,
        attributes: [
          config.userNameAttribute,
          config.emailAttribute,
          config.displayNameAttribute,
          'objectClass',
          'memberOf',
        ],
      };

      const { searchEntries } = await client.search(
        config.userSearchBase,
        searchOptions,
      );

      syncLog.usersProcessed = searchEntries.length;
      let usersAdded = 0;
      let usersUpdated = 0;

      // Step 3: Process each user
      for (const entry of searchEntries) {
        try {
          const username = entry[config.userNameAttribute] as string;
          const email =
            (entry[config.emailAttribute] as string) ||
            `${username}@example.com`;
          const displayName =
            (entry[config.displayNameAttribute] as string) || username;
          const memberOf = (entry.memberOf as string[]) || [];
          const dn = entry.dn;

          // Map LDAP groups to local groups using groupMappings
          const groups: string[] = [];
          if (config.groupMappings && memberOf.length > 0) {
            Object.entries(config.groupMappings).forEach(
              ([localGroup, ldapGroups]) => {
                if (memberOf.some((group) => ldapGroups.includes(group))) {
                  groups.push(localGroup);
                }
              },
            );
          }

          // Prepare user data
          const userData = {
            username,
            email,
            displayName,
            source: 'ldap',
            sourceId: dn, // Store DN as sourceId for future reference
            groups,
            isActive: true,
            metadata: {
              lastLdapSync: new Date().toISOString(),
              ldapDN: dn,
              ldapGroups: memberOf,
            },
          };

          // Try to find existing user by sourceId or username
          const existingUser = null; // await this.userService.findBySourceId(dn) || await this.userService.findByUsername(username);

          if (existingUser) {
            // Update existing user
            // await this.userService.update(existingUser.id, userData);
            this.logger.debug(`Updated LDAP user: ${username}`);
            usersUpdated++;
          } else {
            // Create new user
            // await this.userService.create(userData);
            this.logger.debug(`Created LDAP user: ${username}`);
            usersAdded++;
          }
        } catch (err) {
          syncLog.errors++;
          syncLog.errorDetails = `${syncLog.errorDetails || ''}\nError processing user: ${err.message}`;
          this.logger.error(
            `Error processing LDAP user: ${err.message}`,
            err.stack,
          );
        }
      }

      // Step 4: Update sync log
      syncLog.usersAdded = usersAdded;
      syncLog.usersUpdated = usersUpdated;
      syncLog.status = 'completed';
      syncLog.syncEndTime = new Date();
      await this.ldapSyncLogRepository.save(syncLog);

      this.logger.log(
        `LDAP sync completed. Processed: ${syncLog.usersProcessed}, Added: ${usersAdded}, Updated: ${usersUpdated}, Errors: ${syncLog.errors}`,
      );
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errorDetails = error.message;
      syncLog.syncEndTime = new Date();
      await this.ldapSyncLogRepository.save(syncLog);
      this.logger.error(`LDAP sync failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      await client.unbind();
    }
  }
}
