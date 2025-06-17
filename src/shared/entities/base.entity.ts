import { User } from 'src/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

@Entity('EntityBase', { orderBy: { createdAt: 'DESC' } })
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'createdById' })
  createdById: string;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updatedById' })
  updatedById: string;
}
