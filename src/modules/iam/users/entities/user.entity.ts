// src/modules/iam/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';

export type AuthSource = 'local' | 'ldap' | 'sso';

@Entity('user')
@Index(['username'], { unique: true })
export class User extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ length: 80 }) username!: string; // login key
  @Column({ length: 150, nullable: true }) email?: string; // optional
  @Column({ length: 150 }) displayName!: string;

  @Column({ type: 'varchar', length: 10, default: 'local' })
  authSource!: AuthSource; // 'local' | 'ldap'

  @Column({ nullable: true }) externalId?: string; // AD GUID / SSO subject

  @Column({ nullable: true, select: false })
  passwordHash?: string; // only for 'local' users

  @Column({ default: true }) isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @OneToMany('Membership', 'user')
  memberships!: any[];
}
