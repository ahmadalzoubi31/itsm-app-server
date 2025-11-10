// src/modules/iam/groups/entities/membership.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

export enum GroupMemberRoleEnum {
  MEMBER = 'MEMBER',
  LEADER = 'LEADER',
}

@Entity('membership')
@Index(['userId', 'groupId'], { unique: true })
@Index(['userId'])
@Index(['groupId'])
export class Membership extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' }) groupId!: string;
  @ManyToOne(() => Group, (g) => g.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @Column({
    type: 'enum',
    enum: GroupMemberRoleEnum,
    default: GroupMemberRoleEnum.MEMBER,
  })
  membershipRole!: GroupMemberRoleEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt!: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
