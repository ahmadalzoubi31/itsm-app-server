import { RefreshToken } from 'src/auth/entities/refreshToken.entity';
import { BaseEntity } from 'src/shared/entities/base.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column()
  fullName: string;

  @Column({ unique: true, nullable: false, update: true, })  
  username: string;

  @Column({ unique: true, nullable: false })
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

  @BeforeInsert()
  @BeforeUpdate()
  async setFullName() {
    // Set the full name before saving it to the database
    this.fullName = `${this.firstName} ${this.lastName}`;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setSmallCaps() {
    // Set the username and email to lowercase before saving it to the database
    this.username = this.username.toLowerCase();
    this.email = this.email.toLowerCase();
  }
}
