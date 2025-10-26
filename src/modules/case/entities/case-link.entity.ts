import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Case } from './case.entity';

@Entity('case_link')
@Index(['caseId'])
@Index(['targetCaseId'])
export class CaseLink {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @Column() caseId!: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetCaseId' })
  targetCase!: Case;

  @Column() targetCaseId!: string;

  @Column({ length: 30 }) type!: string; // e.g., related, duplicate, parent
}
