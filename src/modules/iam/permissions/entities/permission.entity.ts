// src/modules/iam/entities/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';

@Entity('permission')
@Index(['key'], { unique: true })
export class Permission extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() key!: string; // e.g., "case:read:own"
  @Column() subject!: string; // e.g., "Case" or "all"
  @Column() action!: string; // e.g., "read", "update", "manage"

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>;

  @Column({ nullable: true })
  description?: string;
}
