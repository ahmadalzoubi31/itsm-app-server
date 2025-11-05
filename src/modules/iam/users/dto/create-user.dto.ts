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

  @ApiProperty({
    description: 'Authentication source',
    example: 'local',
    enum: ['local', 'ldap'],
  })
  @IsNotEmpty()
  @IsIn(['local', 'ldap'])
  authSource!: 'local' | 'ldap';

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
}
