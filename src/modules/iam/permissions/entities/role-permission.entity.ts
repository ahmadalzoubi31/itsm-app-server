// src/modules/iam/entities/role-permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permission')
@Index(['roleId', 'permissionId'], { unique: true })
@Index(['roleId'])
@Index(['permissionId'])
export class RolePermission extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) roleId!: string; // FK → role.id (ON DELETE CASCADE via migration)
  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @Column({ type: 'uuid' }) permissionId!: string; // FK → permission.id
  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission!: Permission;
}
