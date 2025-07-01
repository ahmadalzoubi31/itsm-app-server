import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { SettingTypeEnum } from '../constants/type.constant';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, enum: SettingTypeEnum })
  type: SettingTypeEnum; // e.g., 'LDAP', 'EMAIL', etc.

  @Column({ type: 'jsonb' })
  jsonValue: Record<string, any>;
}
