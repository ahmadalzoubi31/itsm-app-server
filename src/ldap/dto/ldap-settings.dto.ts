import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { ProtocolEnum } from '../constants/protocol.constant';
import { SearchScopeEnum } from '../constants/search-scope.constant';

export class LdapSettingDto {
  @IsString()
  server: string;

  @IsString()
  port: string;

  @IsEnum(ProtocolEnum)
  protocol: ProtocolEnum;

  @IsString()
  searchBase: string;

  @IsString()
  bindDn: string;

  @IsString()
  bindPassword: string;

  @IsString()
  searchFilter: string;

  @IsEnum(SearchScopeEnum)
  searchScope: SearchScopeEnum;

  @IsString()
  attributes: string;

  @IsBoolean()
  useSSL: boolean;

  @IsBoolean()
  validateCert: boolean;
}
