import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';

export enum GroupTypeEnum {
  SUPPORT = 'SUPPORT',
  TECHNICAL = 'TECHNICAL',
  MANAGEMENT = 'MANAGEMENT',
  ESCALATION = 'ESCALATION',
  SPECIALIST = 'SPECIALIST',
  GENERAL = 'GENERAL',
}

export enum GroupStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('groups')
export class Group extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: GroupTypeEnum,
    default: GroupTypeEnum.GENERAL,
  })
  type: GroupTypeEnum;

  @Column({
    type: 'enum',
    enum: GroupStatusEnum,
    default: GroupStatusEnum.ACTIVE,
  })
  status: GroupStatusEnum;

  @Column({ nullable: true })
  leaderId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'leaderId' })
  leader?: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @OneToMany('GroupMember', 'group')
  members: any[];

  @ManyToMany(() => Permission, (permission) => permission.groups)
  @JoinTable({
    name: 'group_permissions',
    joinColumn: {
      name: 'group_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Permission[];
}
