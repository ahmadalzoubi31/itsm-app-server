// src/shared/validators/password.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Common weak passwords to reject
const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'abc123',
  'letmein',
  'welcome',
  'welcome123',
  'admin',
  'admin123',
  'root',
  'root123',
  'user',
  'user123',
  'test',
  'test123',
  'guest',
  'guest123',
]);

export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-5
}

export class PasswordValidator {
  /**
   * Validates password strength against security requirements
   */
  static validateStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 8) {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Check for numbers
    const hasNumber = /[0-9]/.test(password);
    if (hasNumber) {
      score += 1;
    }

    // Check for special characters
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );
    if (hasSpecialChar) {
      score += 1;
    }

    // Must have either a number or special character
    if (!hasNumber && !hasSpecialChar) {
      errors.push(
        'Password must contain at least one number or special character',
      );
    }

    // Check against common passwords
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
      score = 0; // Override score for common passwords
    }

    // Check for sequential characters (e.g., 12345, abcde)
    if (this.hasSequentialCharacters(password)) {
      errors.push('Password contains sequential characters');
      score = Math.max(0, score - 1);
    }

    // Check for repeated characters (e.g., aaaa, 1111)
    if (this.hasRepeatedCharacters(password)) {
      errors.push('Password contains too many repeated characters');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(5, score),
    };
  }

  /**
   * Checks if password contains sequential characters
   */
  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      '0123456789',
      '9876543210',
      'abcdefghijklmnopqrstuvwxyz',
      'zyxwvutsrqponmlkjihgfedcba',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 4; i++) {
        const subseq = sequence.substring(i, i + 4);
        if (lowerPassword.includes(subseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if password has too many repeated characters
   */
  private static hasRepeatedCharacters(password: string): boolean {
    // Check for 3 or more identical characters in a row
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Get password strength label based on score
   */
  static getStrengthLabel(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return 'Unknown';
    }
  }
}

/**
 * Custom validator constraint for class-validator
 */
@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    const result = PasswordValidator.validateStrength(password);
    return result.isValid;
  }

  defaultMessage(): string {
    return 'Password does not meet security requirements: must be at least 8 characters long, contain uppercase and lowercase letters, and at least one number or special character';
  }
}

/**
 * Decorator for validating strong passwords
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
