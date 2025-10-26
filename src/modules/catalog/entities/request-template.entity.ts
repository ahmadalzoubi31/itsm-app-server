// src/modules/catalog/entities/request-template.entity.ts
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

@Entity('request_template')
@Index(['key'], { unique: true })
export class RequestTemplate extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index() @Column({ type: 'uuid' }) serviceId!: string; // FK → service.id

  @Column() key!: string; // e.g., "new-laptop"
  @Column() name!: string;
  @Column({ type: 'jsonb' }) jsonSchema!: any; // AJV schema
  @Column({ type: 'jsonb', nullable: true }) uiSchema?: any;
  @Column({ type: 'jsonb', nullable: true }) defaults?: any;

  @Column({ default: true }) active!: boolean;

  // Optional: default assignment group (enforces ITIL rule at creation)
  @Column({ type: 'uuid', nullable: true }) defaultAssignmentGroupId?: string;

  // Business Line (ITIL organizational context) - REQUIRED
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;
}
