import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceCard } from 'src/service-cards/entities/service-card.entity';
import { Group } from 'src/groups/entities/group.entity';

@Entity('service_request')
export class ServiceRequest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  category: string;             

  @Column({ nullable: true })
  serviceCardId: string;

  

  @Column({ nullable: true })
  groupId: string;
}   