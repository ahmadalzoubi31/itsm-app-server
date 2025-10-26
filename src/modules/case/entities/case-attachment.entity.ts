// src/modules/case/entities/case-attachment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';
@Entity('case_attachment')
export class CaseAttachment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index()
  @Column('uuid')
  caseId!: string;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: Case;
  @Column() filename!: string;
  @Column() originalName!: string;
  @Column() mimeType!: string;
  @Column() size!: number;
  @CreateDateColumn() createdAt!: Date;
  @Column() createdById!: string;
  @Column() createdByName!: string;
  @Column() storagePath!: string; // local disk path
}
