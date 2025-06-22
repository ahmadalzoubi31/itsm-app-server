import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  expiry: Date;

  @OneToOne(() => User, (user) => user.refreshToken, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
