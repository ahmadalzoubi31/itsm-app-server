import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';

@Entity('ldap_config')
@Index(['server', 'port'], { unique: true })
export class LdapConfig extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  name: string;

  @Column({ length: 255, nullable: false })
  server: string;

  @Column({ type: 'int', nullable: false })
  port: number;

  @Column({ type: 'varchar', length: 10, default: 'ldap' })
  protocol: string;

  @Column({ length: 500, nullable: false })
  baseDN: string;

  @Column({ length: 500, nullable: false })
  bindDN: string;

  @Column({ nullable: false, select: false })
  bindPassword: string;

  @Column({ length: 500, nullable: false })
  userSearchBase: string;

  @Column({ length: 500, nullable: false, default: '(objectClass=user)' })
  userSearchFilter: string;

  @Column({ type: 'varchar', default: 'sub', nullable: false })
  userSearchScope: string;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ default: false })
  secureConnection: boolean;

  @Column({ default: false })
  allowSelfSignedCert: boolean;

  @Column({ type: 'json', nullable: true })
  groupMappings: Record<string, string[]>;

  @Column({ type: 'json', nullable: true })
  roleMappings: Record<string, string[]>;

  /**
   * Dynamic attributes mapping defined by admin
   * Maps logical user fields to LDAP attribute names
   *
   * Common mapping example:
   * {
   *   username: "sAMAccountName",
   *   email: "mail",
   *   displayName: "displayName",
   *   firstName: "givenName",
   *   lastName: "sn",
   *   phone: "telephoneNumber",
   *   mobile: "mobile",
   *   department: "department",
   *   title: "title",
   *   company: "company",
   *   manager: "manager",
   *   employeeId: "employeeNumber",
   *   location: "physicalDeliveryOfficeName"
   * }
   */
  @Column({ type: 'json', nullable: true })
  attributes: Record<string, string | string[]>;

  @Column({ type: 'int', default: 300 })
  syncIntervalMinutes: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextSyncAt?: Date;

  @Column({ default: true })
  autoSync: boolean;

  @Column({ default: false })
  deactivateRemovedUsers: boolean;

  @Column({ default: 5000 })
  connectionTimeout: number;

  @Column({ type: 'int', default: 1000 })
  pageSizeLimit: number;

  // Sync Schedule Settings
  @Column({ default: false })
  syncEnabled: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  syncFrequency: string; // HOURLY, DAILY, WEEKLY, MONTHLY

  @Column({ type: 'varchar', length: 10, nullable: true })
  syncTime: string; // HH:mm format

  @Column({ type: 'varchar', length: 100, nullable: true })
  syncTimezone: string;

  @Column({ type: 'int', default: 3 })
  syncRetryAttempts: number;

  @Column({ type: 'int', default: 30 })
  syncRetryInterval: number; // in minutes

  @Column({ type: 'int', default: 7 })
  syncFullSyncInterval: number; // in days

  // Frequency-specific fields
  @Column({ type: 'int', nullable: true })
  syncMinute: number; // For HOURLY (0-59)

  @Column({ type: 'json', nullable: true })
  syncDaysOfWeek: number[]; // For WEEKLY (0-6, Sunday = 0)

  @Column({ type: 'json', nullable: true })
  syncDaysOfMonth: number[]; // For MONTHLY (1-31)

  // Staging Mode Configuration
  @Column({
    type: 'varchar',
    length: 20,
    default: 'full',
    nullable: false,
  })
  stagingMode: 'full' | 'new-only' | 'disabled';
}
