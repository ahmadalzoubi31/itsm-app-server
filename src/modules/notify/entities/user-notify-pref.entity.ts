// src/modules/notify/entities/user-notify-pref.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';

@Entity('user_notify_pref')
@Index(['userId', 'eventKey', 'channel'], { unique: true })
export class UserNotifyPref {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column() eventKey!: string; // e.g., "case.comment.added"
  @Column() channel!: 'email' | 'webhook';
  @Column({ default: true }) enabled!: boolean;
}
