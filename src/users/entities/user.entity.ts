import { RefreshToken } from '../../auth/entities/refreshToken.entity';
import { BaseEntity } from '../../shared/entities/base.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEnum } from '../constants/role.constant';
import { Permission } from '../../permissions/entities/permission.entity';
import { hash } from 'bcrypt';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fullName: string;

  @Column({ unique: true, update: false })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: RoleEnum,
  })
  role: RoleEnum;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @ManyToMany(() => Permission, (permission) => permission.users)
  @JoinTable({
    name: 'user_permissions',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Permission[];

  @Column({ nullable: true, unique: true })
  objectGUID: string;

  @ManyToOne(() => User, (user) => user.manager, { nullable: true })
  @JoinColumn({ name: 'manager_id', referencedColumnName: 'id' })
  manager: User;

  @Column({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setFullName() {
    // Set the full name before saving it to the database
    this.fullName = `${this.firstName} ${this.lastName}`;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setSmallCaps() {
    // Set the username and email to lowerincident before saving it to the database
    this.username = this.username.toLowerCase();
    this.email = this.email.toLowerCase();
  }
}
