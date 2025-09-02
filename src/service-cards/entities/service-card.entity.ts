import { BaseEntity } from '../../shared/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { ServiceCardCategoryEnum } from '../constants/category.constant';

@Entity('service_card')
export class ServiceCard extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceCardCategoryEnum,
    default: ServiceCardCategoryEnum.IT,
  })
  category: ServiceCardCategoryEnum;

  @Column({ nullable: true })
  estimatedTime: string;

  @Column()
  price: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  // @Column({ type: 'json', nullable: true })
  // config: any;
}
