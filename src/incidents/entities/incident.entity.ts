import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { IncidentStatus } from '../enums/incident-status.enum';
import { Priority } from '../enums/priority.enum';
import { Impact } from '../enums/impact.enum';
import { Urgency } from '../enums/urgency.enum';
import { IncidentComment } from './comment.entity';
import { IncidentHistory } from './history.entity';

@Entity()
export class Incident extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    enum: IncidentStatus,
    default: IncidentStatus.NEW,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: Priority,
  })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: Impact,
  })
  impact: Impact;

  @Column({
    type: 'enum',
    enum: Urgency,
  })
  urgency: Urgency;

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
