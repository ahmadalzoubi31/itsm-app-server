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
import { CaseStatus } from '@shared/constants';
import { CasePriority } from '@shared/constants';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Service } from '@modules/catalog/entities/service.entity';
import { RequestTemplate } from '@modules/catalog/entities/request-template.entity';

@Entity('case')
@Index(['number'], { unique: true })
// @Index(['status'])
// @Index(['priority'])
// @Index(['requesterId'])
// @Index(['assigneeId'])
// @Index(['assignmentGroupId'])
// @Index(['createdAt'])
export class Case extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ length: 30 }) number!: string;

  @Column({ length: 200 }) title!: string;

  @Column({ type: 'text', nullable: true }) description?: string;

  @Column({ type: 'varchar', length: 20, default: CaseStatus.NEW })
  status!: CaseStatus;

  @Column({ type: 'varchar', length: 20, default: CasePriority.MEDIUM })
  priority!: CasePriority;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requesterId' })
  requester?: User | null;

  @Column({ type: 'uuid', nullable: true })
  requesterId?: string;

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
  assignmentGroupId!: string;

  // Business Line (ITIL organizational context) - REQUIRED
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;

  @JoinColumn({ name: 'businessLineId' })
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  businessLine!: BusinessLine;

  // Affected Service (for incidents) - ITIL standard
  @Index()
  @Column({ type: 'uuid', nullable: true })
  affectedServiceId?: string;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'affectedServiceId' })
  affectedService?: Service | null;

  // Request Template Origin (for service requests from catalog)
  @Index()
  @Column({ type: 'uuid', nullable: true })
  requestTemplateId?: string;

  @ManyToOne(() => RequestTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestTemplateId' })
  requestTemplate?: RequestTemplate | null;
}
