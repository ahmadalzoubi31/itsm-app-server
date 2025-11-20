import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';
import { LdapConfig } from './ldap-config.entity';

export type SyncStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type SyncTrigger = 'manual' | 'scheduled' | 'automatic';

@Entity('ldap_sync_log')
@Index(['configId', 'syncStartTime'])
@Index(['status'])
export class LdapSyncLog extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  configId: string;

  @ManyToOne(() => LdapConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'configId' })
  config: LdapConfig;

  @Column({ type: 'timestamptz' })
  syncStartTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  syncEndTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  trigger: SyncTrigger;

  @Column({ default: 0 })
  usersProcessed: number;

  @Column({ default: 0 })
  usersAdded: number;

  @Column({ default: 0 })
  usersUpdated: number;

  @Column({ default: 0 })
  usersDeactivated: number;

  @Column({ default: 0 })
  usersSkipped: number;

  @Column({ default: 0 })
  errors: number;

  @Column({ type: 'text', nullable: true })
  errorDetails?: string;

  @Column({ type: 'varchar', length: 20, default: 'in_progress' })
  status: SyncStatus;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    serverUrl?: string;
    userSearchBase?: string;
    userSearchFilter?: string;
    cancelledBy?: string;
    cancelledAt?: string;
    errorStack?: string[];
  };
}
