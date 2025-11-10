import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Role } from '../roles/entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { randomBytes } from 'crypto';

interface TokenPayload {
  sub: string;
  username: string;
  roles?: string[];
  groupIds?: string[];
  jti: string; // JWT ID for blacklist tracking
  iat?: number;
  exp?: number;
}

interface LoginContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenTTL: number;
  private readonly accessTokenTTL: string;

  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Role) private roles: Repository<Role>,
    @InjectRepository(RefreshToken)
    private refreshTokens: Repository<RefreshToken>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklist: Repository<TokenBlacklist>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    // Refresh token TTL: 7 days (in seconds)
    this.refreshTokenTTL = this.config.get(
      'jwt.refreshExpiresIn',
      7 * 24 * 60 * 60,
    );
    this.accessTokenTTL = this.config.get('jwt.expiresIn', '15m');
  }

  private normalizeUsername(u: string) {
    return u.trim();
  }

  private generateJti(): string {
    return randomBytes(16).toString('hex');
  }

  private parseExpiry(expiry: string): number {
    // Convert '15m', '1h', '7d' to seconds
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] || 60);
  }

  private async generateTokenPair(user: User, context?: LoginContext) {
    this.logger.debug(`Generating token pair for user: ${user.username}`);

    // Fetch user's primary role
    const userRoleRecords = await this.roles
      .find({
        where: { users: { id: user.id } },
      })
      .then((roles) => roles.map((r) => r.key));

    // Generate access token with JTI
    const jti = this.generateJti();
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      roles: userRoleRecords,
      groupIds: [],
      jti,
    };
    const access_token = await this.jwt.signAsync(payload);

    // Generate refresh token
    const refreshTokenValue = randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 10);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.refreshTokenTTL);

    const refreshTokenEntity = this.refreshTokens.create({
      userId: user.id,
      token: refreshTokenHash,
      expiresAt,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });
    await this.refreshTokens.save(refreshTokenEntity);

    this.logger.debug(
      `Token pair generated successfully for user: ${user.username}`,
    );

    return {
      access_token,
      refresh_token: refreshTokenValue,
      expires_in: this.parseExpiry(this.accessTokenTTL),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email ?? null,
        authSource: user.authSource,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        roles: userRoleRecords,
        groupIds: [],
      },
    };
  }

  async login(dto: LoginDto, context?: LoginContext) {
    const username = this.normalizeUsername(dto.username);
    this.logger.log(`Login attempt for username: ${username}`);

    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.username) = LOWER(:username)', { username })
      .getOne();

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authSource !== 'local') {
      this.logger.warn(`Login failed - non-local auth source: ${username}`);
      throw new ForbiddenException(
        'This account uses enterprise sign-in (LDAP).',
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed - inactive account: ${username}`);
      throw new ForbiddenException('Account is disabled.');
    }

    if (!user.passwordHash) {
      this.logger.warn(`Login failed - no password set: ${username}`);
      throw new UnauthorizedException('Invalid credentials'); // no local password set
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      this.logger.warn(`Login failed - invalid password: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login successful: ${username}`);

    user.lastLoginAt = new Date();
    await this.users.save(user);

    // Clean up old expired refresh tokens for this user (housekeeping)
    const deletedTokens = await this.refreshTokens.delete({
      userId: user.id,
      expiresAt: LessThan(new Date()),
    });

    if (deletedTokens.affected && deletedTokens.affected > 0) {
      this.logger.debug(
        `Cleaned up ${deletedTokens.affected} expired refresh tokens for user: ${username}`,
      );
    }

    return this.generateTokenPair(user, context);
  }

  async refreshAccessToken(dto: RefreshTokenDto, context?: LoginContext) {
    const { refreshToken } = dto;
    this.logger.debug('Refresh token attempt');

    // Find all non-revoked refresh tokens (we'll check hash)
    const tokens = await this.refreshTokens.find({
      where: { isRevoked: false },
      relations: ['user'],
    });

    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      this.logger.warn('Refresh token failed - invalid token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check expiration
    if (matchedToken.expiresAt < new Date()) {
      this.logger.warn('Refresh token failed - expired');
      await this.refreshTokens.delete({ id: matchedToken.id });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check user is still active
    const user = matchedToken.user;
    if (!user || !user.isActive) {
      this.logger.warn('Refresh token failed - inactive user');
      throw new UnauthorizedException('User is inactive');
    }

    this.logger.log(`Refresh token successful: ${user.username}`);

    // Update last used timestamp
    matchedToken.lastUsedAt = new Date();
    await this.refreshTokens.save(matchedToken);

    // Generate new access token (keep same refresh token)
    const userRoleRecords = await this.roles
      .find({
        where: { users: { id: user.id } },
      })
      .then((roles) => roles.map((r) => r.key));

    const jti = this.generateJti();
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      roles: userRoleRecords,
      groupIds: [],
      jti,
    };
    const access_token = await this.jwt.signAsync(payload);

    return {
      access_token,
      expires_in: this.parseExpiry(this.accessTokenTTL),
    };
  }

  async logout(refreshToken: string, userId: string, jti?: string, req?: any) {
    this.logger.log(`Logout attempt for user: ${userId}`);

    // Find and revoke the refresh token
    const tokens = await this.refreshTokens.find({
      where: { userId, isRevoked: false },
    });

    let matchedToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token);
      if (isMatch) {
        matchedToken = token;
        break;
      }
    }

    if (matchedToken) {
      matchedToken.isRevoked = true;
      await this.refreshTokens.save(matchedToken);
      this.logger.debug(`Revoked refresh token for user: ${userId}`);
    } else {
      this.logger.warn(`No matching refresh token found for logout: ${userId}`);
    }

    // Blacklist the current access token (JTI)
    if (jti) {
      const tokenExpiry = this.calculateTokenExpiry();
      await this.revokeAccessToken(jti, userId, tokenExpiry, 'logout');
      this.logger.debug(
        `Blacklisted access token JTI: ${jti} for user: ${userId}`,
      );
    }

    this.logger.log(`Logout successful for user: ${userId}`);
    return { success: true, message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, jti?: string, req?: any) {
    this.logger.log(`Logout all devices attempt for user: ${userId}`);

    // Revoke all refresh tokens for user
    const updateResult = await this.refreshTokens.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    this.logger.log(
      `Revoked ${updateResult.affected || 0} refresh tokens for user: ${userId}`,
    );

    // Blacklist the current access token (JTI)
    if (jti) {
      const tokenExpiry = this.calculateTokenExpiry();
      await this.revokeAccessToken(jti, userId, tokenExpiry, 'logout_all');
      this.logger.debug(
        `Blacklisted access token JTI: ${jti} for user: ${userId}`,
      );
    }

    this.logger.log(`Logout all devices successful for user: ${userId}`);
    return { success: true, message: 'Logged out from all devices' };
  }

  private calculateTokenExpiry(): Date {
    const expirySeconds = this.parseExpiry(this.accessTokenTTL);
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expirySeconds);
    return expiryDate;
  }

  async revokeAccessToken(
    jti: string,
    userId: string,
    expiresAt: Date,
    reason: string,
  ) {
    this.logger.debug(`Revoking access token JTI: ${jti}`, {
      jti,
      userId,
      reason,
      expiresAt,
    });

    // Add access token to blacklist
    const blacklistEntry = this.tokenBlacklist.create({
      jti,
      userId,
      expiresAt,
      reason,
    });
    await this.tokenBlacklist.save(blacklistEntry);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const entry = await this.tokenBlacklist.findOne({ where: { jti } });
    return !!entry;
  }

  async me(userId: string) {
    this.logger.debug(`Getting user profile for: ${userId}`);

    if (!userId) {
      this.logger.warn(
        `User profile request failed - invalid user ID: ${userId}`,
      );
      throw new UnauthorizedException('Invalid user ID');
    }

    const user = await this.users.findOne({
      where: { id: userId },
      relations: [
        'roles', // Add this to load the role relation
        'permissions', // Add this to load the permission relation
      ],
    });

    if (!user || !user.isActive) {
      this.logger.warn(
        `User profile request failed - user not found or inactive: ${userId}`,
      );
      throw new UnauthorizedException('User not found or inactive');
    }

    // Transform the response to include role keys (for programmatic access)
    const result = {
      ...user,
      roles: user.roles?.map((r) => r.key).filter(Boolean) || [],
      permissions: user.permissions?.map((p) => p.key).filter(Boolean) || [],
    };

    this.logger.debug(`User profile retrieved successfully: ${user.username}`);

    return result;
  }

  async resetPassword(userId: string, newPassword: string) {
    this.logger.log(`Password reset attempt for user: ${userId}`);

    const user = await this.users.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(`Password reset failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    if (user.authSource !== 'local') {
      this.logger.warn(
        `Password reset failed - non-local account: ${user.username}`,
        {
          username: user.username,
          authSource: user.authSource,
        },
      );
      throw new ForbiddenException(
        'Cannot reset password for non-local accounts (LDAP users)',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await this.users.save(user);

    this.logger.log(`Password reset successful for user: ${user.username}`, {
      username: user.username,
      userId: user.id,
    });

    return {
      success: true,
      message: `Password reset successfully for user: ${user.username}`,
    };
  }

  // Cleanup expired blacklist entries (run periodically via cron)
  async cleanupExpiredBlacklist() {
    this.logger.debug('Starting cleanup of expired blacklist entries');

    const deleted = await this.tokenBlacklist.delete({
      expiresAt: LessThan(new Date()),
    });

    const deletedCount = deleted.affected || 0;
    this.logger.log(
      `Cleanup completed - removed ${deletedCount} expired blacklist entries`,
    );

    return { deleted: deletedCount };
  }
}
