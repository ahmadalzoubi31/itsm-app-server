import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from '../enums/permission.enum';
import { User } from 'src/users/entities/user.entity';

@Entity('permissions')
export class Permissions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Permission,
  })
  name: Permission;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
