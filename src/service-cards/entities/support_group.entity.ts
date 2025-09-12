import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('support_group')
export class SupportGroup extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;
}
