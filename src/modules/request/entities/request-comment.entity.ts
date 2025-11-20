import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Request } from './request.entity';
import { AuditableEntity } from '@shared/utils/auditable.entity';

@Entity('request_comment')
@Index(['requestId', 'createdAt'])
export class RequestComment extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column('uuid') requestId!: string;
  @ManyToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request!: Request;

  @Column('text') body!: string;

  @Column({ type: 'boolean', default: true })
  isPrivate!: boolean; // true = private (only visible to creator), false = shared with request
}

