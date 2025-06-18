import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionEnum } from '../enums/permission.enum';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PermissionEnum,
  })
  name: PermissionEnum;

  @ManyToOne(() => User, (user) => user.permissions)
  userId: string;
}
