// src/modules/sla/entities/sla-timer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { SlaTarget } from './sla-target.entity';
import { Case } from '@modules/case/entities/case.entity';

@Entity('sla_timer')
@Index(['caseId', 'targetId'], { unique: true })
export class SlaTimer {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' })
  caseId!: string;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: Case;

  @Index()
  @Column({ type: 'uuid' })
  targetId!: string;
  @ManyToOne(() => SlaTarget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetId' })
  target!: SlaTarget;

  @CreateDateColumn() createdAt!: Date;

  @Column({ type: 'timestamptz' }) startedAt!: Date;
  @Column({ type: 'timestamptz', nullable: true }) stoppedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) breachedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true }) lastTickAt?: Date;
  @Column({ type: 'int' }) remainingMs!: number; // countdown
  @Column({ default: 'Running' }) status!:
    | 'Running'
    | 'Stopped'
    | 'Breached'
    | 'Paused'
    | 'Met';

  // Pause/Resume tracking
  @Column({ type: 'timestamptz', nullable: true }) pausedAt?: Date;
  @Column({ type: 'timestamptz', nullable: true }) resumedAt?: Date;
  @Column({ type: 'int', default: 0 }) totalPausedMs!: number; // Total time paused
}
