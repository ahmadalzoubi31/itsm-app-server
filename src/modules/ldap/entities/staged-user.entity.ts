import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';
import { LdapSyncLog } from './ldap-sync-log.entity';

export enum StagedUserStatus {
  NEW = 'NEW',
  UPDATED = 'UPDATED',
  IMPORTED = 'IMPORTED',
  DISABLED = 'DISABLED',
  REJECTED = 'REJECTED',
}

@Entity('staged_user')
@Index(['objectGUID'], { unique: true })
@Index(['syncLogId'])
@Index(['status'])
@Index(['sAMAccountName'])
export class StagedUser extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  syncLogId!: string;

  @ManyToOne(() => LdapSyncLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'syncLogId' })
  syncLog!: LdapSyncLog;

  @Column({ type: 'varchar', length: 255 })
  objectGUID!: string; // Unique identifier from LDAP (externalId)

  @Column({ type: 'varchar', length: 255, nullable: true })
  cn?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mail?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sAMAccountName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  givenName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sn?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mobile?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userPrincipalName?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  manager?: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalAttributes?: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 20,
    default: StagedUserStatus.NEW,
  })
  status!: StagedUserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  importedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  importedById?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  importedByName?: string;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  rejectedById?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rejectedByName?: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string; // Reference to User table if imported

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;
}

