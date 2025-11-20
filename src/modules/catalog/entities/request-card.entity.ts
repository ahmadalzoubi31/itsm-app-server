// src/modules/catalog/entities/request-card.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Group } from '@modules/iam/groups/entities/group.entity';

import { Workflow } from '@modules/workflow/entities/workflow.entity';
import { Service } from './service.entity';
import { ApprovalSteps } from '@modules/approval/entities/approval-step.entity';

@Entity('request_card')
@Index(['key'], { unique: true })
export class RequestCard extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column()
  key!: string; // e.g., "new-laptop"

  @Column()
  name!: string;

  @Column({ type: 'jsonb' })
  jsonSchema!: any; // AJV schema

  @Column({ type: 'jsonb', nullable: true })
  uiSchema?: any;

  @Column({ type: 'jsonb', nullable: true })
  defaults?: any;

  @Column({ default: true })
  active!: boolean;

  // Optional: default assignment group (enforces ITIL rule at creation)
  @Column({ type: 'uuid' })
  defaultAssignmentGroupId!: string;
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'defaultAssignmentGroupId', referencedColumnName: 'id' })
  defaultAssignmentGroup!: Group;

  // Business Line (ITIL organizational context) - REQUIRED
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId', referencedColumnName: 'id' })
  businessLine!: BusinessLine;

  // Workflow - determines routing (Case, Incident, etc.)
  @Index()
  @Column({ type: 'uuid', nullable: true })
  workflowId?: string;

  @ManyToOne(() => Workflow, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'workflowId', referencedColumnName: 'id' })
  workflow?: Workflow | null;

  @Index() @Column({ type: 'uuid' }) serviceId!: string; // FK → service.id
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId', referencedColumnName: 'id' })
  service!: Service;

  @OneToMany(() => ApprovalSteps, (approvalSteps) => approvalSteps.requestCard)
  approvalSteps?: ApprovalSteps[];
}
