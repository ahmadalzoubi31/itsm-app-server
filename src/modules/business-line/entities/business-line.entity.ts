// src/modules/business-line/entities/business-line.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';

@Entity('business_line')
@Index(['key'], { unique: true })
export class BusinessLine extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() key!: string; // e.g., "it", "hr", "finance"
  @Column() name!: string;
  @Column({ nullable: true }) description?: string;
  @Column({ default: true }) active!: boolean;
}
