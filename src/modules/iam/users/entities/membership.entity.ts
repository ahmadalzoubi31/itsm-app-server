// src/modules/iam/users/entities/membership.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { User } from './user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('membership')
@Index(['userId', 'groupId'], { unique: true })
@Index(['userId'])
@Index(['groupId'])
export class Membership extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, (u) => u.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' }) groupId!: string;
  @ManyToOne(() => Group, (g) => g.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Group;
}
