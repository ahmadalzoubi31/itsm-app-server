// src/modules/email/entities/email-message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailChannel } from './email-channel.entity';
import { Case } from '@modules/case/entities/case.entity';

@Entity('email_message')
@Index(['messageId'], { unique: true })
export class EmailMessage {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => EmailChannel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel!: EmailChannel;
  @Index() @Column({ type: 'uuid' }) channelId!: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: Case;
  @Index() @Column({ type: 'uuid', nullable: true }) caseId?: string;

  @Column() messageId!: string;
  @Column({ nullable: true }) inReplyTo?: string;
  @Column({ type: 'jsonb', nullable: true }) references?: string[];

  @Column({ nullable: true }) fromAddr?: string;
  @Column({ type: 'jsonb', nullable: true }) toAddrs?: string[];

  @Column({ nullable: true }) subject?: string;
  @Column({ type: 'text', nullable: true }) textBody?: string;
  @Column({ type: 'text', nullable: true }) htmlBody?: string;

  @Column({ default: 'inbound' }) direction!: 'inbound' | 'outbound';

  @CreateDateColumn() createdAt!: Date;
}
