// src/modules/iam/users/dto/check-password-strength.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPasswordStrengthDto {
  @ApiProperty({
    description: 'Password to check',
    example: 'TestPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class PasswordStrengthResponseDto {
  @ApiProperty({
    description: 'Whether the password meets security requirements',
    example: true,
  })
  isValid!: boolean;

  @ApiProperty({
    description: 'List of validation errors (empty if valid)',
    example: [],
    type: [String],
  })
  errors!: string[];

  @ApiProperty({
    description: 'Password strength score (0-5)',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  score!: number;

  @ApiProperty({
    description: 'Human-readable strength label',
    example: 'Strong',
    enum: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'],
  })
  strength!: string;
}
