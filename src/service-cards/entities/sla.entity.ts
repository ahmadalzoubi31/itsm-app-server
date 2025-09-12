import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('sla')
export class SLA extends BaseEntity {
  @Column()
  name: string;

  @Column()
  targetResponseTime: string; // e.g. "4h"

  @Column()
  targetResolutionTime: string; // e.g. "2d"

  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;
}
