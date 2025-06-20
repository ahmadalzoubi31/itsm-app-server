import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionName } from '../enums/permission-name.enum';
import { User } from '../../users/entities/user.entity';
import { PermissionCategory } from '../enums/permission-category.enum';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  permissionId: number;

  @Column({
    type: 'enum',
    enum: PermissionName,
  })
  name: PermissionName;

  @Column({
    type: 'enum',
    enum: PermissionCategory,
  })
  category: PermissionCategory;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  user: User;
}
