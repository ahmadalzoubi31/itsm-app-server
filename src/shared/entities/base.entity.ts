import { User } from '../../users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('EntityBase', { orderBy: { createdAt: 'ASC' } })
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'createdById' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updatedById' })
  updatedById: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
