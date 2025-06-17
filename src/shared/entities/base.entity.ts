import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @Column({ enum: ['active', 'inactive'], default: 'active' })
  status: string;
  
  @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})  
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User;
}
