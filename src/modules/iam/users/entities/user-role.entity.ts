// src/modules/iam/users/entities/user-role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Role } from '../../roles/entities/role.entity';
import { User } from './user.entity';

@Entity('user_role')
@Index(['userId', 'roleId'], { unique: true })
@Index(['userId'])
@Index(['roleId'])
export class UserRole extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' }) roleId!: string;
  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;
}
