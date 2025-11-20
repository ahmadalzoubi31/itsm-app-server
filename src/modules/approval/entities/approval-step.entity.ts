// src/modules/approval/entities/approval-step.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { Group } from '@modules/iam/groups/entities/group.entity';

export enum ApprovalStepsType {
  MANAGER = 'manager',
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('approval_steps')
@Index(['requestCardId', 'order'])
export class ApprovalSteps extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  requestCardId!: string;

  @ManyToOne(() => RequestCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestCardId' })
  requestCard!: RequestCard;

  @Column({ type: 'int' })
  order!: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type!: ApprovalStepsType;

  // For direct approval
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  // For group approval
  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group?: Group | null;

  // For group approval: true = all must approve, false = one must approve
  @Column({ type: 'boolean', nullable: true, default: false })
  requireAll?: boolean;
}
