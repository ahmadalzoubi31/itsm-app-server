import { Group } from '@modules/iam/groups/entities/group.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RequestStatus } from '@shared/constants';
import { CasePriority } from '@shared/constants';
import { RequestType } from '@shared/constants';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Service } from '@modules/catalog/entities/service.entity';
import { RequestTemplate } from '@modules/catalog/entities/request-template.entity';
import { Case } from '@modules/case/entities/case.entity';

@Entity('request')
@Index(['number'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['requesterId'])
@Index(['createdAt'])
export class Request extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ length: 30 }) number!: string;

  @Column({ length: 200 }) title!: string;

  @Column({ type: 'text', nullable: true }) description?: string;

  @Column({ type: 'varchar', length: 20, default: RequestStatus.SUBMITTED })
  status!: RequestStatus;

  @Column({ type: 'varchar', length: 20 })
  type!: RequestType;

  @Column({ type: 'varchar', length: 20, default: CasePriority.MEDIUM })
  priority!: CasePriority;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requesterId' })
  requester?: User | null;

  @Column({ type: 'uuid' })
  requesterId!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User | null;

  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignmentGroupId' })
  assignmentGroup?: Group | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignmentGroupId?: string;

  // Business Line (ITIL organizational context)
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;

  @JoinColumn({ name: 'businessLineId' })
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  businessLine!: BusinessLine;

  // Affected Service (for incidents/service requests)
  @Index()
  @Column({ type: 'uuid', nullable: true })
  affectedServiceId?: string;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'affectedServiceId' })
  affectedService?: Service | null;

  // Request Template Origin (from catalog)
  @Index()
  @Column({ type: 'uuid', nullable: true })
  requestTemplateId?: string;

  @ManyToOne(() => RequestTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestTemplateId' })
  requestTemplate?: RequestTemplate | null;

  // Linked Case (after routing)
  @Index()
  @Column({ type: 'uuid', nullable: true })
  linkedCaseId?: string;

  @ManyToOne(() => Case, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'linkedCaseId' })
  linkedCase?: Case | null;

  // Additional metadata for routing and tracking
  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  // Resolution information
  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;
}
