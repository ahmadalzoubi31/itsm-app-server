// src/modules/email/entities/notification-template.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';

@Entity('notification_template')
@Index(['businessLineId', 'key'], { unique: true })
export class NotificationTemplate extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;

  @Column() key!: string; // e.g., "case.created"
  @Column() subject!: string; // e.g., "Case {{case.number}} created"
  @Column('text') bodyHtml!: string; // Handlebars
}
