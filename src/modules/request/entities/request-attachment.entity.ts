import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from './request.entity';

@Entity('request_attachment')
export class RequestAttachment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index()
  @Column('uuid')
  requestId!: string;
  @ManyToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestId' })
  request!: Request;
  @Column() filename!: string;
  @Column() originalName!: string;
  @Column() mimeType!: string;
  @Column() size!: number;
  @CreateDateColumn() createdAt!: Date;
  @Column() createdById!: string;
  @Column() createdByName!: string;
  @Column() storagePath!: string; // local disk path
}

