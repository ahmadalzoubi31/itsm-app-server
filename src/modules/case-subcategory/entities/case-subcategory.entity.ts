// src/modules/case-subcategory/entities/case-subcategory.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { CaseCategory } from '@modules/case-category/entities/case-category.entity';

@Entity('case_subcategory')
@Index(['key', 'categoryId'], { unique: true })
export class CaseSubcategory extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() key!: string; // e.g., "hardware", "software", "network"
  @Column() name!: string;
  @Column({ nullable: true }) description?: string;
  @Column({ default: true }) active!: boolean;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CaseCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: CaseCategory;
}

