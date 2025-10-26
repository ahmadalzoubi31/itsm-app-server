// src/modules/catalog/entities/service.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';

@Entity('service')
@Index(['key'], { unique: true })
export class Service extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() key!: string; // e.g., "it-helpdesk"
  @Column() name!: string;
  @Column({ nullable: true }) description?: string;

  // Business Line (ITIL organizational context) - REQUIRED
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;
}
