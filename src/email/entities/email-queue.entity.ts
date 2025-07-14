import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { EmailQueueStatusEnum, EmailPriorityEnum } from '../enums';
import { EmailTemplate } from './email-template.entity';

@Entity('email_queue')
export class EmailQueue extends BaseEntity {
  @Column('simple-array')
  recipients: string[];

  @Column({ nullable: true })
  cc: string;

  @Column({ nullable: true })
  bcc: string;

  @Column()
  subject: string;

  @Column('text')
  htmlBody: string;

  @Column('text', { nullable: true })
  textBody: string;

  @Column({
    type: 'enum',
    enum: EmailQueueStatusEnum,
    default: EmailQueueStatusEnum.PENDING,
  })
  status: EmailQueueStatusEnum;

  @Column({
    type: 'enum',
    enum: EmailPriorityEnum,
    default: EmailPriorityEnum.MEDIUM,
  })
  priority: EmailPriorityEnum;

  @Column({ nullable: true })
  templateId: string;

  @ManyToOne(() => EmailTemplate, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: EmailTemplate;

  @Column({ type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ nullable: true })
  lastAttemptAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  providerResponse: Record<string, any>;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  scheduledAt: Date;
} 