// src/modules/iam/groups/entities/group-role.entity.ts
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
import { Group } from './group.entity';

@Entity('group_role')
@Index(['groupId', 'roleId'], { unique: true })
@Index(['groupId'])
@Index(['roleId'])
export class GroupRole extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) groupId!: string;
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @Column({ type: 'uuid' }) roleId!: string;
  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role!: Role;
}
