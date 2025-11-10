// src/modules/iam/entities/permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { Role } from '@modules/iam/roles/entities/role.entity';

@Entity('permission')
@Index(['key'], { unique: true })
export class Permission extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() key!: string; // e.g., "case:read:own"
  @Column() subject!: string; // e.g., "Case" or "all"
  @Column() action!: string; // e.g., "read", "update", "manage"

  @Column({ type: 'jsonb', nullable: true })
  conditions?: Record<string, any>;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => User, (user) => user.permissions)
  users!: User[];

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];
}
