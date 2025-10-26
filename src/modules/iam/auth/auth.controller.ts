import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import {
  CheckPasswordStrengthDto,
  PasswordStrengthResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './jwt.guard';
import { AbilityGuard } from '../casl/guards/ability.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { PasswordValidator } from '@shared/utils/password.validator';
import { Request } from 'express';

@ApiTags('IAM / Auth')
@Controller({ path: 'iam/auth' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with username (local accounts only)' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    return this.auth.login(dto, context);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    return this.auth.refreshAccessToken(dto, context);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Logout (revoke refresh token and blacklist access token)',
  })
  logout(
    @Body() dto: LogoutDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.auth.logout(dto.refreshToken, user.userId, user.jti, req);
  }

  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Logout from all devices (revoke all refresh tokens and blacklist current access token)',
  })
  logoutAll(@CurrentUser() user: any, @Req() req: Request) {
    return this.auth.logoutAll(user.userId, user.jti, req);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user from token' })
  me(@CurrentUser() user: any) {
    return this.auth.me(user.userId);
  }

  @Post('check-password-strength')
  @ApiOperation({
    summary: 'Check password strength',
    description:
      'Validates a password against security requirements and returns strength score',
  })
  checkPasswordStrength(
    @Body() dto: CheckPasswordStrengthDto,
  ): PasswordStrengthResponseDto {
    const result = PasswordValidator.validateStrength(dto.password);
    return {
      isValid: result.isValid,
      errors: result.errors,
      score: result.score,
      strength: PasswordValidator.getStrengthLabel(result.score),
    };
  }

  @Post('reset-password')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Reset user password (Admin only)',
    description:
      'System administrators can reset passwords for local users only. Cannot reset passwords for SSO/LDAP users. All active sessions will be terminated. Password must meet strong password requirements.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.userId, dto.newPassword);
  }
}
