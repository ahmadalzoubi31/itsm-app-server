// src/modules/user-preferences/entities/user-table-preference.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';

@Entity('user_table_preference')
@Index(['userId', 'preferenceKey'], { unique: true })
export class UserTablePreference {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  preferenceKey!: string; // e.g., "cases-table-columns"

  @Column({ type: 'jsonb' })
  preferences!: Record<string, any>; // Column visibility state

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
