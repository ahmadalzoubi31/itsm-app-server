import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Client, SearchOptions, Entry } from 'ldapts';
import { LdapConfig } from '../entities/ldap-config.entity';

/**
 * Service responsible for LDAP client connections and operations
 */
@Injectable()
export class LdapClientService {
  private readonly logger = new Logger(LdapClientService.name);

  /**
   * Create LDAP client
   */
  createLdapClient(config: LdapConfig): Client {
    const url = `${config.protocol}://${config.server}:${config.port}`;

    const options: any = {
      url,
      timeout: config.connectionTimeout || 5000,
      connectTimeout: config.connectionTimeout || 5000,
      strictDN: false,
    };

    // LDAPS configuration
    if (config.protocol === 'ldaps' || config.secureConnection) {
      options.tlsOptions = {
        rejectUnauthorized: !config.allowSelfSignedCert,
      };
    }

    return new Client(options);
  }

  /**
   * Bind user to LDAP
   */
  async bindUser(client: Client, dn: string, password: string): Promise<void> {
    try {
      await client.bind(dn, password);
    } catch (error) {
      throw new UnauthorizedException(`LDAP bind failed: ${error.message}`);
    }
  }

  /**
   * Find user DN by username
   */
  async findUserDN(
    client: Client,
    config: LdapConfig,
    username: string,
    usernameAttr: string,
  ): Promise<string | null> {
    try {
      const filter = `(&${config.userSearchFilter}(${usernameAttr}=${username}))`;

      const { searchEntries } = await client.search(config.userSearchBase, {
        scope: 'sub',
        filter,
        attributes: ['dn'],
        sizeLimit: 1,
      });

      return searchEntries.length > 0 ? searchEntries[0].dn : null;
    } catch (error) {
      this.logger.error(`Failed to find user DN: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch user info from LDAP
   */
  async fetchUserInfo(
    client: Client,
    dn: string,
    attributes: string[],
  ): Promise<Entry | null> {
    const { searchEntries } = await client.search(dn, {
      scope: 'base',
      attributes,
    });

    return searchEntries.length > 0 ? searchEntries[0] : null;
  }

  /**
   * Fetch all LDAP users with pagination
   */
  async fetchAllLdapUsers(
    client: Client,
    config: LdapConfig,
    attributes: string[],
  ): Promise<Entry[]> {
    const searchOptions: SearchOptions = {
      scope: 'sub',
      filter: config.userSearchFilter,
      attributes,
      returnAttributeValues: true, // Explicitly request attribute values
      paged: {
        pageSize: config.pageSizeLimit || 1000,
      },
    };

    const { searchEntries } = await client.search(
      config.userSearchBase,
      searchOptions,
    );

    // Log first entry for debugging
    if (searchEntries.length > 0) {
      this.logger.debug(
        `Fetched ${searchEntries.length} LDAP entries. Sample entry attributes: ${Object.keys(searchEntries[0]).join(', ')}`,
      );
    }

    return searchEntries;
  }
}
