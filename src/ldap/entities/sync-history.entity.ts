import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SyncStatusEnum } from '../constants/sync-status.constant';

@Entity()
export class SyncHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'enum', enum: SyncStatusEnum })
  status: SyncStatusEnum;

  @Column({ type: 'text' })
  details: string;

  @Column({ nullable: true })
  usersFetched?: number;

  @Column({ nullable: true })
  duration?: number;
}
