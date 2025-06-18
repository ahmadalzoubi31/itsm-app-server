import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionName } from '../enums/permission-name.enum';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PermissionName,
  })
  name: PermissionName;

  @ManyToOne(() => User, (user) => user.permissions, {
    onDelete: 'CASCADE',
  })
  user: User;
}
