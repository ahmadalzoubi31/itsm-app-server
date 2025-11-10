import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';

@Entity('ldap_sync_log')
export class LdapSyncLog extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  syncStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  syncEndTime: Date;

  @Column({ default: 0 })
  usersProcessed: number;

  @Column({ default: 0 })
  usersAdded: number;

  @Column({ default: 0 })
  usersUpdated: number;

  @Column({ default: 0 })
  errors: number;

  @Column({ type: 'text', nullable: true })
  errorDetails: string;

  @Column({ default: 'in_progress' })
  status: 'in_progress' | 'completed' | 'failed';
}