import { IsBoolean, IsEnum, IsString } from 'class-validator';

export class LdapSettingDto {
  @IsString() server: string;
  @IsString() port: string; // or number if preferred
  @IsEnum(['ldap', 'ldaps']) protocol: string;
  @IsString() baseDn: string;
  @IsString() bindDn: string;
  @IsString() bindPassword: string;
  @IsString() searchFilter: string;
  @IsEnum(['base', 'one', 'sub']) searchScope: string;
  @IsString() attributes: string;
  @IsBoolean() useSSL: boolean;
  @IsBoolean() validateCert: boolean;
}
