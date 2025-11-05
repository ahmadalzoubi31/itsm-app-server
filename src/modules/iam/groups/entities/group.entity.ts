// src/modules/iam/groups/entities/group.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AuditableEntity } from '@shared/utils/auditable.entity';
import { Membership } from '../../membership/entities/membership.entity';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';

@Entity('group')
@Index(['key'], { unique: true })
export class Group extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 80 }) key!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ nullable: true }) description?: string;

  // Business Line (ITIL organizational context) - REQUIRED
  @Index()
  @Column({ type: 'uuid' })
  businessLineId!: string;
  @ManyToOne(() => BusinessLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessLineId' })
  businessLine!: BusinessLine;

  @OneToMany(() => Membership, (m) => m.group)
  memberships!: Membership[];
}
