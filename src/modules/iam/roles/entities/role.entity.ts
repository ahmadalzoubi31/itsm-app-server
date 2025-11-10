// src/modules/iam/roles/entities/role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { Permission } from '@modules/iam/permissions/entities/permission.entity';

@Entity('role')
@Index(['key'], { unique: true })
export class Role extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column() key!: string; // e.g., "admin", "agent", "requester"
  @Column() name!: string;
  @Column({ nullable: true }) description?: string;

  @Column({ default: 0 })
  permissionCount!: number;

  @Column({ default: 0 })
  userCount!: number;

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permission',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions!: Permission[];
}
