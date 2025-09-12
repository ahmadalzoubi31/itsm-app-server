import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { ServiceCategory } from './service_category.entity';
import { Group } from '../../groups/entities/group.entity';
import { ApprovalWorkflow } from './approval_workflow.entity';
import { SLA } from './sla.entity';

export enum ServiceCardStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  RETIRED = 'retired',
}

export enum ServiceCardVisibility {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
}

@Entity('service_card')
export class ServiceCard extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @ManyToOne(() => ServiceCategory, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: ServiceCategory;

  @Column({
    type: 'enum',
    enum: ServiceCardStatus,
    default: ServiceCardStatus.DRAFT,
  })
  status: ServiceCardStatus;

  @Column({
    type: 'enum',
    enum: ServiceCardVisibility,
    default: ServiceCardVisibility.INTERNAL,
  })
  visibility: ServiceCardVisibility;

  @Column({ nullable: true })
  estimatedTime: string;

  @Column({ nullable: true })
  price: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  displayOrder: number;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  requestFormSchema: any;

  @ManyToOne(() => ApprovalWorkflow, { nullable: true, eager: true })
  @JoinColumn({ name: 'approvalWorkflowId' })
  approvalWorkflow: ApprovalWorkflow;

  @ManyToOne(() => SLA, { nullable: true, eager: true })
  @JoinColumn({ name: 'slaId' })
  sla: SLA;

  @ManyToOne(() => Group, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedGroupId' })
  assignedGroup: Group;

  @Column({ nullable: true })
  supportContact: string; // optional: email/phone
}
