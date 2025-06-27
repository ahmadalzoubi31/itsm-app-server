import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { IncidentStatusEnum } from '../constants/incident-status.constant';
import { PriorityEnum } from '../constants/priority.constant';
import { ImpactEnum } from '../constants/impact.constant';
import { UrgencyEnum } from '../constants/urgency.constant';
import { IncidentComment } from './incident-comment.entity';
import { IncidentHistory } from './incident-history.entity';

@Entity('incidents')
export class Incident extends BaseEntity {
  // Virtual getter for formatted ID
  // get incNumber(): string {
  //   return `INC${this.id.toString().padStart(6, '0')}`;
  // }

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentStatusEnum,
  })
  status: IncidentStatusEnum;

  @Column({
    type: 'enum',
    enum: PriorityEnum,
  })
  priority: PriorityEnum;

  @Column({
    type: 'enum',
    enum: ImpactEnum,
  })
  impact: ImpactEnum;

  @Column({
    type: 'enum',
    enum: UrgencyEnum,
  })
  urgency: UrgencyEnum;

  @Column()
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  resolution: string;

  //   assignedToId: text('assigned_to_id')
  //     .notNull()
  //     .references(() => user.id),
  //   assignmentGroup: text('assignment_group'),
  //   slaBreachTime: timestamp('sla_breach_time', { withTimezone: true }),

  @Column()
  businessService: string;

  @Column({ nullable: true })
  location: string;

  @OneToMany(() => IncidentComment, (comment) => comment.incident, {
    onDelete: 'CASCADE',
  })
  comments: IncidentComment[];

  @OneToMany(() => IncidentHistory, (history) => history.incident, {
    onDelete: 'CASCADE',
  })
  histories: IncidentHistory[];
}
