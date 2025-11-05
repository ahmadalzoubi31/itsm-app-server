// src/modules/iam/roles/entities/role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';

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
}

