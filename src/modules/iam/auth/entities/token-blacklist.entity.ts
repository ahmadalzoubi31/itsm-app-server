// src/modules/iam/entities/token-blacklist.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('token_blacklist')
@Index(['jti'], { unique: true })
@Index(['expiresAt'])
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  jti!: string; // JWT ID - unique identifier for the token

  @Column({ type: 'uuid' }) userId!: string;
  @ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 50, default: 'logout' })
  reason!: string; // 'logout' | 'admin_revoke' | 'security' | 'password_reset'

  @CreateDateColumn({ type: 'timestamptz' })
  revokedAt!: Date;
}
