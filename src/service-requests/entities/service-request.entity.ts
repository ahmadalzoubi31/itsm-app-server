// import { User } from 'src/users/entities/user.entity';
// import { BaseEntity } from '../../shared/entities/base.entity';
// import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
// import { ServiceCard } from 'src/service-cards/entities/service-card.entity';
// import { Group } from 'src/groups/entities/group.entity';

// @Entity('service_request')
// export class ServiceRequest extends BaseEntity {
//   @PrimaryGeneratedColumn()
//   id: string;

//   @Column({ nullable: true })
//   description: string;

//   @Column({ nullable: true })
//   status: string;

//   @Column({ nullable: true })
//   priority: string;

//   @Column({ nullable: true })
//   category: string;

//   @Column({ nullable: true })
//   serviceCardId: string;

//   @Column({ nullable: true })
//   serviceName: string;

//   @Column({ nullable: true })
//   title: string;

//   @Column({ nullable: true })
//   requestedBy: string;

//   @Column({ nullable: true })
//   requestedDate: string;

//   @Column({ nullable: true })
//   estimatedCompletion: string;

//   @Column({ nullable: true })
//   groupId: string;

//   @Column({ type: 'json', nullable: true })
//   customFieldValues: any;
// }

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { ServiceCard } from '../../service-cards/entities/service-card.entity';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../constants/request-status.constant';

@Entity('service_request')
export class ServiceRequest extends BaseEntity {
  @ManyToOne(() => ServiceCard, { eager: true })
  @JoinColumn({ name: 'serviceCardId' })
  serviceCard: ServiceCard;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ type: 'json', nullable: true })
  formData: any;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt: Date;
}
