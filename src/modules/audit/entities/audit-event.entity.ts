// src/modules/audit/entities/audit-event.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_event')
@Index(['type', 'happenedAt'])
@Index(['aggregateType', 'aggregateId'])
@Index(['actorId', 'happenedAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() type!: string; // e.g. 'case.created'
  @Column() aggregateType!: string; // e.g. 'Case'
  @Column('uuid') aggregateId!: string;

  @Column({ nullable: true }) actorId?: string;
  @Column({ nullable: true }) actorName?: string;

  @Column({ default: 'bus' }) source!: 'bus' | 'outbox';
  @CreateDateColumn() happenedAt!: Date;

  @Column('jsonb', { nullable: true }) data?: any; // small, scrubbed payload
  @Column({ nullable: true }) requestId?: string;
  @Column({ nullable: true }) ip?: string;
  @Column({ nullable: true }) userAgent?: string;
}
