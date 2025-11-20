import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

type JwtPayload = {
  sub: string;
  username: string;
  roles?: string[];
  groupIds?: string[];
  jti: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const secret = config.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET must be configured in environment');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookies first
        (req: any) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies.accessToken || null;
          }
          return token;
        },
        // Fallback to Authorization header
        (req: any) => {
          const authHeader = req?.headers?.authorization;
          if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    // Safely log payload without circular references
    // this.logger.debug(
    //   `Validating JWT payload: ${JSON.stringify({
    //     sub: payload.sub,
    //     username: payload.username,
    //     roles: payload.roles,
    //     groupIds: payload.groupIds,
    //     jti: payload.jti,
    //   })}`,
    // );

    // Check payload structure - log what we actually received
    if (!payload) {
      this.logger.error('JWT payload is null or undefined');
      throw new UnauthorizedException('Invalid token');
    }

    if (!payload.sub || !payload.jti) {
      this.logger.warn(
        `Invalid JWT payload: missing required fields. Received payload keys: ${Object.keys(payload || {}).join(', ')}`,
      );
      throw new UnauthorizedException('Invalid token');
    }

    // Check if token is blacklisted
    try {
      const isBlacklisted = await this.authService.isTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        this.logger.warn(`Token blacklisted: ${payload.jti}`);
        throw new UnauthorizedException('Token has been revoked');
      }
    } catch (error) {
      this.logger.error(
        `Error checking token blacklist: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Error validating token');
    }

    const user = {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
      groupIds: payload.groupIds || [],
      jti: payload.jti,
    };

    this.logger.debug(`JWT validation successful for user: ${user.userId}`);
    return user; // becomes req.user
  }
}
