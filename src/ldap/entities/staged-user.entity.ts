import { Column, Entity } from 'typeorm';
import { StagedUserStatusEnum } from '../constants/staged-user-status.constant';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity()
export class StagedUser extends BaseEntity {
  @Column({ nullable: true }) cn: string;
  @Column({ nullable: true }) mail: string;
  @Column({ nullable: true }) sAMAccountName: string;
  @Column({ nullable: true }) displayName: string;
  @Column({ nullable: true }) department: string;
  @Column({ nullable: true }) givenName: string;
  @Column({ nullable: true }) sn: string; // Surname
  @Column({ nullable: true }) title: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ nullable: true }) userPrincipalName: string;
  @Column({ nullable: true }) manager: string;

  @Column({ nullable: false, unique: true }) objectGUID: string; // Always required for upsert

  @Column({ type: 'jsonb', nullable: true }) additionalAttributes: Record<
    string,
    any
  >; // For any extra attributes

  @Column({
    type: 'enum',
    enum: StagedUserStatusEnum,
    default: StagedUserStatusEnum.NEW,
  })
  status: StagedUserStatusEnum;
}
