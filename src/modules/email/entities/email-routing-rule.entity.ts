// src/modules/email/entities/email-routing-rule.entity.ts
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { EmailChannel } from './email-channel.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('email_routing_rule')
@Index(['businessLineId'])
export class EmailRoutingRule {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;
  @Column({ type: 'uuid' }) businessLineId!: string;

  @ManyToOne(() => EmailChannel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel!: EmailChannel;
  @Column({ type: 'uuid' }) channelId!: string;

  // matchers (all provided must match)
  @Column({ nullable: true }) toContains?: string;
  @Column({ nullable: true }) subjectIncludes?: string;
  @Column({ nullable: true }) fromDomain?: string;

  // actions
  @Column({ type: 'uuid' }) assignGroupId!: string;
  @Column({ type: 'uuid', nullable: true }) templateId?: string;
  @Column({ nullable: true }) priority?: string;
  @Column({ nullable: true }) label?: string;
}
