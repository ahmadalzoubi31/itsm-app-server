import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { getCookieOptions, COOKIE_NAMES } from './cookie.config';
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
import { CurrentUser } from './decorators/current-user.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { PasswordValidator } from '@shared/utils/password.validator';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('IAM / Auth')
@Controller({ path: 'iam/auth' })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Set secure httpOnly cookies for tokens
   */
  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessOptions = getCookieOptions(this.config, 'access');
    const refreshOptions = getCookieOptions(this.config, 'refresh');
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessOptions);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshOptions);
  }

  /**
   * Clear token cookies
   */
  private clearTokenCookies(res: Response) {
    const clearOptions = getCookieOptions(this.config, 'clear');
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearOptions);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearOptions);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with username (local accounts only)' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.auth.login(dto, context);

    // Set secure httpOnly cookies
    this.setTokenCookies(res, result.access_token, result.refresh_token);

    // Return user data without tokens in response body
    // TODO: remove tokens from response body
    return res.json({
      // access_token: result.access_token,
      // refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      user: result.user,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    const context = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.socket.remoteAddress,
    };
    const result = await this.auth.refreshAccessToken(dto, context);

    // Set new access token cookie (refresh token remains the same)
    const accessOptions = getCookieOptions(this.config, 'access');
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, result.access_token, accessOptions);

    // Return success response (refreshAccessToken only returns new access token)
    return res.json({
      message: 'Token refreshed successfully',
      expires_in: result.expires_in,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Logout (revoke refresh token and blacklist access token)',
  })
  async logout(
    @Body() dto: LogoutDto,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    await this.auth.logout(dto.refreshToken, user.userId, user.jti, req);

    // Clear token cookies
    this.clearTokenCookies(res);

    return res.json({ message: 'Logged out successfully' });
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Logout from all devices (revoke all refresh tokens and blacklist current access token)',
  })
  async logoutAll(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ) {
    await this.auth.logoutAll(user.userId, user.jti, req);

    // Clear token cookies
    this.clearTokenCookies(res);

    return res.json({ message: 'Logged out from all devices successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user from token' })
  me(@CurrentUser() user: any) {
    return this.auth.me(user.userId);
  }

  @Post('check-password-strength')
  @UseGuards(JwtAuthGuard)
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
  @ApiOperation({
    summary: 'Reset user password (Admin only)',
    description:
      'System administrators can reset passwords for local users only. Cannot reset passwords for LDAP users. All active sessions will be terminated. Password must meet strong password requirements.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.userId, dto.newPassword);
  }
}
