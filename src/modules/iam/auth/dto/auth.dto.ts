// src/modules/iam/dto/auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';
import { IsStrongPassword } from '@shared/utils/password.validator';

export class LoginDto {
  @ApiProperty({ example: 'jdoe' })
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    minLength: 8,
    description:
      'Password (for login, any existing password is accepted. Strong password policy applies only to password creation/reset)',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'User ID whose password will be reset' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description:
      'New password - must be at least 8 characters with uppercase, lowercase, and number/special character',
    minLength: 8,
    example: 'SecurePass123!',
  })
  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    message:
      'Password must be at least 8 characters long and contain uppercase letters, lowercase letters, and at least one number or special character',
  })
  newPassword!: string;
}

export class CheckPasswordStrengthDto {
  @ApiProperty({ description: 'Password to check' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class PasswordStrengthResponseDto {
  @ApiProperty({
    description: 'Whether the password meets security requirements',
  })
  @IsBoolean()
  @IsNotEmpty()
  isValid!: boolean;

  @ApiProperty({ description: 'Password strength errors' })
  @IsArray()
  @IsNotEmpty()
  errors!: string[];

  @ApiProperty({ description: 'Password strength score' })
  @IsNumber()
  @IsNotEmpty()
  score!: number;

  @ApiProperty({ description: 'Password strength label' })
  @IsString()
  @IsNotEmpty()
  strength!: string;
}
