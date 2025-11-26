// src/modules/case-category/entities/case-category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { CaseSubcategory } from '@modules/case-subcategory/entities/case-subcategory.entity';

@Entity('case_category')
@Index(['key'], { unique: true })
export class CaseCategory extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() key!: string; // e.g., "incident", "service-request", "change-request"
  @Column() name!: string;
  @Column({ nullable: true }) description?: string;
  @Column({ default: true }) active!: boolean;

  @OneToMany(() => CaseSubcategory, (subcategory) => subcategory.category)
  subcategories!: CaseSubcategory[];
}
