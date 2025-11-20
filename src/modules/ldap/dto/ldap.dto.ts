import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsNumber,
  IsIn,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLdapConfigDto {
  @ApiProperty({
    description: 'Friendly name for this LDAP configuration',
    example: 'Company Active Directory',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'LDAP server hostname or IP address',
    example: 'ldap.company.com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  server: string;

  @ApiProperty({
    description: 'LDAP server port',
    example: 389,
    default: 389,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({
    description: 'Protocol to use',
    example: 'ldap',
    enum: ['ldap', 'ldaps'],
  })
  @IsString()
  @IsIn(['ldap', 'ldaps'])
  protocol: string;

  @ApiProperty({
    description: 'Base Distinguished Name',
    example: 'dc=company,dc=com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  baseDN: string;

  @ApiProperty({
    description: 'Bind Distinguished Name (admin user for sync)',
    example: 'cn=admin,dc=company,dc=com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  bindDN: string;

  @ApiProperty({
    description: 'Bind password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  bindPassword: string;

  @ApiProperty({
    description: 'User search base DN',
    example: 'ou=users,dc=company,dc=com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  userSearchBase: string;

  @ApiProperty({
    description: 'LDAP filter for finding users',
    example:
      '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
    default: '(objectClass=user)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  userSearchFilter: string;

  @ApiProperty({
    description: 'Search scope',
    example: 'sub',
    enum: ['base', 'one', 'sub'],
    default: 'sub',
  })
  @IsString()
  @IsIn(['base', 'one', 'sub'])
  userSearchScope: string;

  @ApiPropertyOptional({
    description: 'Whether this configuration is enabled',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Use secure connection (LDAPS)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  secureConnection?: boolean;

  @ApiPropertyOptional({
    description: 'Allow self-signed certificates',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowSelfSignedCert?: boolean;

  @ApiPropertyOptional({
    description: 'Map LDAP groups to local groups',
    example: {
      'IT Support': ['CN=IT-Support,OU=Groups,DC=company,DC=com'],
      Managers: ['CN=Managers,OU=Groups,DC=company,DC=com'],
    },
  })
  @IsObject()
  @IsOptional()
  groupMappings?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Map LDAP groups to application roles',
    example: {
      admin: ['CN=IT-Admins,OU=Groups,DC=company,DC=com'],
      agent: ['CN=IT-Support,OU=Groups,DC=company,DC=com'],
    },
  })
  @IsObject()
  @IsOptional()
  roleMappings?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Attribute mappings for user fields',
    example: {
      username: 'sAMAccountName',
      email: 'mail',
      displayName: 'displayName',
    },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string | string[]>;

  @ApiPropertyOptional({
    description: 'Auto-sync interval in minutes',
    default: 300,
    minimum: 15,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(15)
  syncIntervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Enable automatic synchronization',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoSync?: boolean;

  @ApiPropertyOptional({
    description: 'Deactivate users removed from LDAP',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  deactivateRemovedUsers?: boolean;

  @ApiPropertyOptional({
    description: 'Connection timeout in milliseconds',
    default: 5000,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1000)
  @Max(30000)
  connectionTimeout?: number;

  @ApiPropertyOptional({
    description: 'Page size for LDAP queries',
    default: 1000,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(100)
  @Max(5000)
  pageSizeLimit?: number;

  // Sync Schedule Settings
  @ApiPropertyOptional({
    description: 'Enable automatic synchronization schedule',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Sync frequency',
    enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'],
    example: 'DAILY',
  })
  @IsString()
  @IsOptional()
  @IsIn(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'])
  syncFrequency?: string;

  @ApiPropertyOptional({
    description: 'Sync time in HH:mm format',
    example: '02:00',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  syncTime?: string;

  @ApiPropertyOptional({
    description: 'Timezone for sync schedule',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  syncTimezone?: string;

  @ApiPropertyOptional({
    description: 'Number of retry attempts on failure',
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  syncRetryAttempts?: number;

  @ApiPropertyOptional({
    description: 'Retry interval in minutes',
    default: 30,
    minimum: 5,
    maximum: 120,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(5)
  @Max(120)
  syncRetryInterval?: number;

  @ApiPropertyOptional({
    description: 'Full sync interval in days',
    default: 7,
    minimum: 1,
    maximum: 30,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(30)
  syncFullSyncInterval?: number;

  @ApiPropertyOptional({
    description: 'Minute of the hour for hourly sync (0-59)',
    minimum: 0,
    maximum: 59,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(59)
  syncMinute?: number;

  @ApiPropertyOptional({
    description: 'Days of week for weekly sync (0-6, Sunday = 0)',
    type: [Number],
    example: [0, 1, 2, 3, 4, 5, 6],
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ArrayMinSize(1)
  syncDaysOfWeek?: number[];

  @ApiPropertyOptional({
    description: 'Days of month for monthly sync (1-31)',
    type: [Number],
    example: [1, 15],
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @ArrayMinSize(1)
  syncDaysOfMonth?: number[];

  @ApiPropertyOptional({
    description: 'Staging mode for user synchronization',
    enum: ['full', 'new-only', 'disabled'],
    default: 'full',
    example: 'full',
  })
  @IsString()
  @IsOptional()
  @IsIn(['full', 'new-only', 'disabled'])
  stagingMode?: 'full' | 'new-only' | 'disabled';
}

export class UpdateLdapConfigDto extends PartialType(CreateLdapConfigDto) {
  @ApiPropertyOptional({
    description: 'Bind password (only provide if changing)',
  })
  @IsString()
  @IsOptional()
  bindPassword?: string;
}

export class LdapSyncOptionsDto {
  @ApiPropertyOptional({
    description: 'Force full synchronization',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  fullSync?: boolean;

  @ApiPropertyOptional({
    description: 'Dry run mode (preview changes without applying)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}

export class LdapAuthenticateDto {
  @ApiProperty({
    description: 'Username for LDAP authentication',
    example: 'john.doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password for LDAP authentication',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
