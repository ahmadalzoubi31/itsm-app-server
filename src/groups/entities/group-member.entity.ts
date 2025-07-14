import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../shared/entities/base.entity';

export enum GroupMemberRoleEnum {
  MEMBER = "MEMBER",
  LEADER = "LEADER",
}

@Entity('group_members')
export class GroupMember extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  groupId: string;

  @ManyToOne('Group', 'members')
  @JoinColumn({ name: 'groupId' })
  group: any;

  @Column({
    type: 'enum',
    enum: GroupMemberRoleEnum,
    default: GroupMemberRoleEnum.MEMBER,
  })
  role: GroupMemberRoleEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
} 