// src/modules/email/entities/email-inbound-state.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailChannel } from './email-channel.entity';

@Entity('email_inbound_state')
@Index(['channelId'], { unique: true })
export class EmailInboundState {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => EmailChannel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel!: EmailChannel;
  @Column({ type: 'uuid' }) channelId!: string; // FK -> email_channel.id

  @Column({ nullable: true }) lastUid?: string;
  @Column({ nullable: true }) lastUidValidity?: string;
  @Column({ nullable: true }) lastMsgId?: string;
  @Column({ type: 'timestamptz', nullable: true }) lastPolledAt?: Date;
}
