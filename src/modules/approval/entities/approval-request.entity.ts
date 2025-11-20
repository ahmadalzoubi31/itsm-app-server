// src/modules/approval/entities/approval.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Request } from '@modules/request/entities/request.entity';
import { User } from '@modules/iam/users/entities/user.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('approval_request')
@Index(['status'])
@Index(['requestId', 'approverId'], { unique: true })
export class ApprovalRequest extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  requestId!: string;

  @ManyToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request!: Request;

  @Index()
  @Column({ type: 'uuid' })
  approverId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approverId' })
  approver!: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'text', nullable: true })
  justification?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;
}
