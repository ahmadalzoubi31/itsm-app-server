import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermissionName } from '../enums/permission-name.enum';
import { User } from '../../users/entities/user.entity';
import { PermissionCategory } from '../enums/permission-category.enum';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PermissionName,
    unique: true,
  })
  name: PermissionName;

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category: PermissionCategory;

  @Column()
  description: string;

  @ManyToMany(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  users: User[];
}
