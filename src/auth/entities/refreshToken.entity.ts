// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  expiry: Date;

  @OneToOne(() => User, (user) => user.refreshToken, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
