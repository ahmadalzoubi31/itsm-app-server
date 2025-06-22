import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Incident } from './incident.entity';

@Entity('incident_histories')
export class IncidentHistory extends BaseEntity {
  @Column()
  field: string;

  @Column({ nullable: true })
  oldValue: string;

  @Column({ nullable: true })
  newValue: string;

  @ManyToOne(() => Incident, (incident) => incident.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incidentId', referencedColumnName: 'id' })
  incident: Incident;

  @Column()
  incidentId: number;
}
