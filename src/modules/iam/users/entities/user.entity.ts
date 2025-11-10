import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Role } from '@modules/iam/roles/entities/role.entity';
import { Permission } from '@modules/iam/permissions/entities/permission.entity';

export type AuthSource = 'local' | 'ldap';

@Entity('user')
@Index(['username'], { unique: true })
export class User extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ length: 80 })
  username!: string; // login key

  @Column({ length: 150, nullable: true })
  email?: string; // optional

  @Column({ length: 150 })
  displayName!: string;

  @Column({ type: 'varchar', length: 10, default: 'local' })
  authSource!: AuthSource; // 'local' | 'ldap'

  @Column({ nullable: true })
  externalId?: string; // AD GUID

  @Column({ nullable: true, select: false })
  passwordHash?: string; // only for 'local' users

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column({ default: false })
  isLicensed!: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_role',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles!: Role[];

  @ManyToMany(() => Permission, (permission) => permission.users)
  @JoinTable({
    name: 'user_permission',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions!: Permission[];
}
