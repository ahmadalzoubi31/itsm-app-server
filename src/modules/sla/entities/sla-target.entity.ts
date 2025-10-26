// src/modules/sla/entities/sla-target.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { ReferenceModule } from '@shared/constants';
import { SlaTargetRules } from '../interfaces';

@Entity('sla_target')
@Index(['key', 'businessLineId'], { unique: true })
export class SlaTarget extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() key!: string; // e.g., "respond", "resolve"
  @Column() name!: string; // e.g., "Respond in 4h"
  @Column({ type: 'int' }) goalMs!: number; // 4 * 60 * 60 * 1000

  @Column({ type: 'enum', enum: ReferenceModule })
  @IsEnum(ReferenceModule)
  @IsNotEmpty()
  referenceModule!: ReferenceModule; // e.g., ReferenceModule.CASE

  // Dynamic SLA Rules Configuration
  @Column({ type: 'jsonb' }) rules!: SlaTargetRules;

  // optional scoping
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;

  @Column({ default: true }) isActive!: boolean;
}
