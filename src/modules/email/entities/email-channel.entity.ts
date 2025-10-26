// src/modules/email/entities/email-channel.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';

import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
@Entity('email_channel')
@Index(['businessLineId', 'kind', 'isDefault'])
export class EmailChannel extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine; // FK -> business_line.id
  @Column({ type: 'uuid' }) businessLineId!: string;

  @Column({ type: 'varchar' }) kind!: 'smtp' | 'imap' | 'pop3';

  @Column() name!: string;
  @Column() fromAddress!: string;
  @Column({ nullable: true }) replyTo?: string;

  @Column() host!: string;
  @Column('int') port!: number;
  @Column({ default: false }) secure!: boolean;

  @Column({ nullable: true }) username?: string;
  @Column({ nullable: true }) password?: string; // TODO: encrypt

  // (optional future OAuth)
  @Column({ nullable: true }) oauthType?: 'microsoft' | 'google';
  @Column({ nullable: true }) oauthClientId?: string;
  @Column({ nullable: true }) oauthClientSecret?: string;
  @Column({ nullable: true }) oauthTenant?: string;
  @Column({ nullable: true }) oauthRefreshToken?: string;

  @Column({ default: true }) enabled!: boolean;
  @Column({ default: false }) isDefault!: boolean;

  @Column({ nullable: true }) lastStatus?: string;
  @Column({ nullable: true }) lastError?: string;
}
