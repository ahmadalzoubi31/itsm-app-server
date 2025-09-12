import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('approval_workflow')
export class ApprovalWorkflow extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  steps: any; // e.g. [{ order: 1, approverType: 'user', approverId: 'uuid' }]

  @Column({ default: true })
  isActive: boolean;
}
