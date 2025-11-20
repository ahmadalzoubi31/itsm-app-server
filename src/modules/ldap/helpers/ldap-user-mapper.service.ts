import { Injectable, Logger } from '@nestjs/common';
import { Entry } from 'ldapts';
import { LdapConfig } from '../entities/ldap-config.entity';
import * as crypto from 'crypto';

export interface LdapUser {
  dn: string;
  username: string;
  email: string;
  displayName: string;
  externalId: string;
  groups: string[];
  roles: string[];
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Service responsible for mapping LDAP entries to application user objects
 */
@Injectable()
export class LdapUserMapperService {
  private readonly logger = new Logger(LdapUserMapperService.name);

  /**
   * Build attribute list for LDAP query
   */
  buildAttributeList(config: LdapConfig): string[] {
    const attributeSet = new Set<string>([
      'dn',
      'objectClass',
      'cn',
      'sAMAccountName',
      'uid',
      'mail',
      'userPrincipalName',
      'displayName',
      'givenName',
      'sn',
      'memberOf',
      'objectGUID',
      'objectSid',
      'entryUUID',
    ]);

    // Add custom attributes
    if (config.attributes) {
      Object.values(config.attributes).forEach((attr) => {
        if (Array.isArray(attr)) {
          attr.forEach((a) => attributeSet.add(a));
        } else {
          attributeSet.add(attr);
        }
      });
    }

    return Array.from(attributeSet);
  }

  /**
   * Resolve attribute name
   */
  resolveAttribute(
    config: LdapConfig,
    logicalName: string,
    defaults: string[],
  ): string {
    if (config.attributes && config.attributes[logicalName]) {
      const attr = config.attributes[logicalName];
      return Array.isArray(attr) ? attr[0] : attr;
    }
    return defaults[0];
  }

  /**
   * Get attribute value from entry
   */
  getAttributeValue(
    config: LdapConfig,
    entry: Entry,
    logicalName: string,
    defaults: string[],
  ): string | null {
    // Try custom mapping first
    if (config.attributes && config.attributes[logicalName]) {
      const attrs = Array.isArray(config.attributes[logicalName])
        ? (config.attributes[logicalName] as string[])
        : [config.attributes[logicalName] as string];

      for (const attr of attrs) {
        const value = entry[attr];
        if (value && (!Array.isArray(value) || value.length > 0)) {
          const stringValue = Array.isArray(value) ? value[0] : value;
          if (stringValue) {
            return this.bufferToString(stringValue);
          }
        }
      }
    }

    // Try defaults
    for (const attr of defaults) {
      const value = entry[attr];
      if (value && (!Array.isArray(value) || value.length > 0)) {
        const stringValue = Array.isArray(value) ? value[0] : value;
        if (stringValue) {
          return this.bufferToString(stringValue);
        }
      }
    }

    return null;
  }

  /**
   * Map LDAP entry to user object
   */
  mapLdapEntryToUser(config: LdapConfig, entry: Entry): LdapUser | null {
    try {
      const username = this.getAttributeValue(config, entry, 'username', [
        'sAMAccountName',
        'uid',
        'cn',
      ]);

      if (!username) {
        this.logger.warn(`No username found for entry: ${entry.dn}`);
        return null;
      }

      const email =
        this.getAttributeValue(config, entry, 'email', [
          'mail',
          'userPrincipalName',
        ]) || `${username}@domain.local`;

      const displayName =
        this.getAttributeValue(config, entry, 'displayName', [
          'displayName',
          'cn',
          'name',
        ]) || username;

      // Generate external ID from objectGUID or objectSid
      let externalId: string;

      const guid = entry.entryUUID;

      if (guid) {
        if (Array.isArray(guid)) {
          externalId = this.bufferToString(guid[0]);
        } else {
          externalId = this.bufferToString(guid);
        }
      } else {
        // Fallback to hash of DN
        externalId = crypto.createHash('md5').update(entry.dn).digest('hex');
      }

      // Extract groups
      const memberOf = entry.memberOf || [];
      const groups: string[] = Array.isArray(memberOf)
        ? memberOf.map((g) => this.bufferToString(g))
        : [this.bufferToString(memberOf)];

      // Map roles
      const roles: string[] = [];
      if (config.roleMappings) {
        Object.entries(config.roleMappings).forEach(
          ([roleName, ldapGroups]) => {
            if (groups.some((g) => ldapGroups.includes(g))) {
              roles.push(roleName);
            }
          },
        );
      }

      // Extract additional metadata from configured attributes
      const metadata = this.extractMetadata(config, entry);

      return {
        dn: entry.dn,
        username,
        email,
        displayName,
        externalId,
        groups,
        roles,
        isActive: true,
        metadata,
      };
    } catch (error) {
      this.logger.error(
        `Failed to map LDAP entry ${entry.dn}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Map LDAP entry for display purposes
   * Returns only the attributes configured in config.attributes mapping
   */
  mapLdapEntry(config: LdapConfig, entry: Entry): any {
    const result: any = {};

    // Only return attributes that are configured in the attribute mapping
    if (!config.attributes || Object.keys(config.attributes).length === 0) {
      // If no attributes configured, return empty result
      return result;
    }

    // Iterate through configured attributes and return only those
    Object.entries(config.attributes).forEach(([logicalName, ldapAttr]) => {
      // Get the LDAP attribute name(s)
      const attrs = Array.isArray(ldapAttr) ? ldapAttr : [ldapAttr];

      // Try each attribute until we find a value
      let found = false;
      for (const attr of attrs) {
        // Try exact match first
        let value = entry[attr];

        // If not found, try case-insensitive match
        if (value === undefined || value === null) {
          const entryKeys = Object.keys(entry);
          const matchedKey = entryKeys.find(
            (key) => key.toLowerCase() === attr.toLowerCase(),
          );
          if (matchedKey) {
            value = entry[matchedKey];
          }
        }

        // Check if we have a valid value
        if (value !== undefined && value !== null) {
          // Handle array values - return direct value if single, array if multiple
          if (Array.isArray(value)) {
            if (value.length > 0) {
              result[logicalName] =
                value.length > 1
                  ? value.map((v) => this.bufferToString(v))
                  : this.bufferToString(value[0]);
              found = true;
            }
          } else {
            result[logicalName] = this.bufferToString(value);
            found = true;
          }
          break; // Found value, move to next logical name
        }
      }

      // If no value found, set to null to indicate the attribute was checked
      if (!found) {
        result[logicalName] = null;
      }
    });

    return result;
  }

  /**
   * Extract metadata from LDAP entry based on configured attributes
   * This allows flexible attribute mapping without changing the User entity
   */
  private extractMetadata(
    config: LdapConfig,
    entry: Entry,
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (!config.attributes) {
      return metadata;
    }

    // Common attribute mappings
    const metadataFields = [
      'firstName',
      'lastName',
      'middleName',
      'phone',
      'mobile',
      'fax',
      'department',
      'title',
      'company',
      'manager',
      'employeeId',
      'employeeType',
      'location',
      'office',
      'city',
      'state',
      'country',
      'zipCode',
      'address',
      'description',
      'userPrincipalName',
      'thumbnailPhoto',
      'homePhone',
      'pager',
      'webPage',
      'initials',
      'division',
      'costCenter',
    ];

    // Extract each configured metadata field
    for (const field of metadataFields) {
      if (config.attributes[field]) {
        const attrs = Array.isArray(config.attributes[field])
          ? (config.attributes[field] as string[])
          : [config.attributes[field] as string];

        for (const attr of attrs) {
          const value = entry[attr];
          if (value) {
            const stringValue = Array.isArray(value) ? value[0] : value;
            metadata[field] = this.bufferToString(stringValue);
            break; // Found value, move to next field
          }
        }
      }
    }

    // Also extract any custom attributes not in the predefined list
    if (config.attributes) {
      Object.keys(config.attributes).forEach((logicalName) => {
        // Skip if already processed or if it's a core field (username, email, displayName)
        if (
          metadataFields.includes(logicalName) ||
          ['username', 'email', 'displayName'].includes(logicalName)
        ) {
          return;
        }

        const attrs = Array.isArray(config.attributes[logicalName])
          ? (config.attributes[logicalName] as string[])
          : [config.attributes[logicalName] as string];

        for (const attr of attrs) {
          const value = entry[attr];
          if (value) {
            const stringValue = Array.isArray(value) ? value[0] : value;
            metadata[logicalName] = this.bufferToString(stringValue);
            break;
          }
        }
      });
    }

    return metadata;
  }

  /**
   * Convert Buffer to string if needed
   */
  private bufferToString(value: any): string {
    if (Buffer.isBuffer(value)) {
      return value.toString('utf-8');
    }
    return String(value);
  }
}
