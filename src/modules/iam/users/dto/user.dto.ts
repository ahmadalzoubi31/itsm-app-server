// src/modules/iam/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { IsStrongPassword } from '@shared/utils/password.validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for login',
    example: 'jdoe',
    maxLength: 80,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  username!: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@company.com',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
    maxLength: 150,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Authentication source (auto-set by system: local for manual creation, ldap if externalId provided)',
    example: 'local',
    enum: ['local', 'ldap'],
  })
  @IsOptional()
  @IsIn(['local', 'ldap'])
  authSource?: 'local' | 'ldap';

  @ApiPropertyOptional({
    description: 'External ID (for LDAP users)',
    example: 'ad-guid-12345',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({
    description:
      'Password (required for local users) - must be at least 8 characters with uppercase, lowercase, and number/special character',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @IsStrongPassword({
    message:
      'Password must be at least 8 characters long and contain uppercase letters, lowercase letters, and at least one number or special character',
  })
  password?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isActive!: boolean;

  @ApiProperty({
    description: 'Whether the user account is licensed',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isLicensed!: boolean;

  @ApiPropertyOptional({
    description: 'Additional user metadata (LDAP attributes, custom fields)',
    example: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0100',
      department: 'IT Support',
      title: 'Senior Engineer',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@company.com',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'John Doe',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({
    description:
      'New password - must be at least 8 characters with uppercase, lowercase, and number/special character',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @IsStrongPassword({
    message:
      'Password must be at least 8 characters long and contain uppercase letters, lowercase letters, and at least one number or special character',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user account is licensed',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isLicensed?: boolean;

  @ApiPropertyOptional({
    description: 'Additional user metadata (LDAP attributes, custom fields)',
    example: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0100',
      department: 'IT Support',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
