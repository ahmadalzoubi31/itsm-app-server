import { RefreshToken } from 'src/auth/entities/refreshToken.entity';
import { BaseEntity } from 'src/shared/entities/base.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../enums/role.enum';
import { Permission } from 'src/permissions/entities/permission.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fullName: string;

  @Column({ unique: true, update: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @OneToMany(() => Permission, (permission) => permission.userId)
  @JoinColumn({ name: 'permissionId' })
  permissions: Permission[];

  @Column({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

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
