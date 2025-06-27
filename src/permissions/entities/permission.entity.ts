import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermissionNameEnum } from '../contants/permission-name.constant';
import { User } from '../../users/entities/user.entity';
import { PermissionCategoryEnum } from '../contants/permission-category.constant';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PermissionNameEnum,
    unique: true,
  })
  name: PermissionNameEnum;

  @Column({
    type: 'enum',
    enum: PermissionCategoryEnum,
  })
  category: PermissionCategoryEnum;

  @Column()
  description: string;

  @ManyToMany(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  users: User[];
}
