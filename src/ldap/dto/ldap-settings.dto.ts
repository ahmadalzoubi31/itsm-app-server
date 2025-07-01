import { IsBoolean, IsString } from 'class-validator';

export class LdapSettingDto {
  @IsString() server: string;
  @IsString() port: string; // or number if preferred
  @IsString() protocol: string;
  @IsString() baseDn: string;
  @IsString() bindDn: string;
  @IsString() bindPassword: string;
  @IsString() searchFilter: string;
  @IsString() attributes: string;
  @IsBoolean() useSSL: boolean;
  @IsBoolean() validateCert: boolean;
}
