// src/shared/utils/auditable.entity.ts
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class AuditableEntity {
  @CreateDateColumn() createdAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  @Column({ nullable: true })
  createdByName?: string;

  @UpdateDateColumn() updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedById?: string;

  @Column({ nullable: true })
  updatedByName?: string;
}
