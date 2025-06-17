import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { Incident } from './incident.entity';

@Entity()
export class IncidentComment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  comment: string;

  @Column()
  isPrivate: boolean;

  @ManyToOne(() => Incident, (incident) => incident.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incidentId', referencedColumnName: 'id' })
  incident: Incident;

  @Column()
  incidentId: number;
}
