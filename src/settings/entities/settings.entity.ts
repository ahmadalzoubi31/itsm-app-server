import { Entity, Column } from 'typeorm';
import { SettingTypeEnum } from '../constants/type.constant';
import { BaseEntity } from '../../shared/entities/base.entity';
import { LdapSettingDto } from '../../ldap/dto/ldap-settings.dto';
import { SyncSettingsDto } from '../../ldap/dto/sync-settings.dto';

@Entity('settings')
export class Settings extends BaseEntity {
  @Column({ unique: true, enum: SettingTypeEnum })
  type: SettingTypeEnum; // e.g., 'LDAP', 'EMAIL', etc.

  @Column({ type: 'jsonb' })
  jsonValue: LdapSettingDto | SyncSettingsDto;
}
