import { AuditableEntity } from '@shared/utils/auditable.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { Group } from '@modules/iam/groups/entities/group.entity';

export enum WorkflowTargetType {
  CASE = 'Case',
  INCIDENT = 'Incident',
  PROBLEM = 'Problem',
  CHANGE = 'Change',
}

export const WORKFLOW_TARGET_TYPE_OPTIONS = [
  { value: WorkflowTargetType.CASE, label: 'Case' },
  { value: WorkflowTargetType.INCIDENT, label: 'Incident' },
  { value: WorkflowTargetType.PROBLEM, label: 'Problem' },
  { value: WorkflowTargetType.CHANGE, label: 'Change' },
];

@Entity('workflow')
@Index(['key'], { unique: true })
export class Workflow extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ length: 50 }) key!: string; // e.g., "it-support-workflow"
  @Column({ length: 200 }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;

  // Target fulfillment entity type
  @Column({ type: 'varchar', length: 20 })
  targetType!: WorkflowTargetType; // Case, Incident, etc.

  // Business Line context (which department this workflow applies to)
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;

  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId', referencedColumnName: 'id' })
  businessLine!: BusinessLine;

  // Active status
  @Column({ default: true }) active!: boolean;

  // Priority mapping (optional - allows automatic priority assignment)
  @Column({ type: 'jsonb', nullable: true })
  priorityRules?: Record<string, string>; // { "High": "Critical", "Medium": "High" }

  // Routing conditions (if workflow should be selected based on request data)
  @Column({ type: 'jsonb', nullable: true })
  conditions?: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  }[];

  // Order in which workflows are evaluated (lower = first)
  @Column({ default: 100 }) evaluationOrder!: number;
}
