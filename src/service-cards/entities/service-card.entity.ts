import { BaseEntity } from '../../shared/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceCardCategoryEnum } from '../constants/categort.constant';

@Entity('service_card')
export class ServiceCard extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

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

  @Column()
  icon: any;

  @Column({ default: true })
  isActive: boolean;
}
