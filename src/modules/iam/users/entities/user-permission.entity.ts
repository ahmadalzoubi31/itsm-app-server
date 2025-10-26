// src/modules/iam/users/entities/user-permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from './user.entity';

@Entity('user_permission')
@Index(['userId', 'permissionId'], { unique: true })
@Index(['userId'])
@Index(['permissionId'])
export class UserPermission extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' }) permissionId!: string;
  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission!: Permission;
}
