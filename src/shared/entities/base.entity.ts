import { User } from 'src/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity('EntityBase', { orderBy: { createdAt: 'DESC' } })
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'createdById' })
  createdById: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updatedById' })
  updatedById: string;
}
