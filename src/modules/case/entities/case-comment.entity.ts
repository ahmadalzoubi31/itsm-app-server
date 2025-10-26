import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Case } from './case.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { AuditableEntity } from '@shared/utils/auditable.entity';

@Entity('case_comment')
@Index(['caseId', 'createdAt'])
export class CaseComment extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column('uuid') caseId!: string;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @Column('text') body!: string;

  // @CreateDateColumn() createdAt!: Date;
  // (No updatedAt; comments are append-only in v1)
}
