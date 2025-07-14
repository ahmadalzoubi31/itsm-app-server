import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('email_statistics')
export class EmailStatistics extends BaseEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 0 })
  totalSent: number;

  @Column({ default: 0 })
  totalFailed: number;

  @Column({ default: 0 })
  totalBounced: number;

  @Column({ default: 0 })
  totalDelivered: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deliveryRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageDeliveryTime: number;

  @Column({ type: 'jsonb', nullable: true })
  providerStats: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  hourlyBreakdown: Record<string, number>;
} 