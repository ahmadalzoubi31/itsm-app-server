import { IsObject, IsEnum } from 'class-validator';
import { LdapSettingDto } from '../../ldap/dto/ldap-settings.dto';
import { SyncSettingsDto } from '../../ldap/dto/sync-settings.dto';
import { SettingTypeEnum } from '../constants/type.constant';

export class CreateSettingDto {
  @IsEnum(SettingTypeEnum)
  type: SettingTypeEnum;

  @IsObject()
  jsonValue: LdapSettingDto | SyncSettingsDto;
}
