import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLdapConfigDto {
  @ApiProperty()
  @IsString()
  server: string;

  @ApiProperty()
  @IsString()
  port: string;

  @ApiProperty()
  @IsString()
  protocol: string;

  @ApiProperty()
  @IsString()
  baseDN: string;

  @ApiProperty()
  @IsString()
  bindDN: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bindPassword?: string;

  @ApiProperty()
  @IsString()
  userSearchBase: string;

  @ApiProperty()
  @IsString()
  userSearchFilter: string;

  @ApiProperty()
  @IsString()
  userNameAttribute: string;

  @ApiProperty()
  @IsString()
  emailAttribute: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  displayNameAttribute?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  secureConnection?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowSelfSignedCert?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  groupMappings?: Record<string, string[]>;
}

export class UpdateLdapConfigDto extends CreateLdapConfigDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bindPassword?: string;
}

export class TestLdapConnectionDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  password: string;
}
