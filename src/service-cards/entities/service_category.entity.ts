import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('service_category')
export class ServiceCategory extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;
}
