import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

type JwtPayload = {
  sub: string;
  username: string;
  role?: string;
  groupIds?: string[];
  jti: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const secret = config.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET must be configured in environment');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Check if token is blacklisted
    if (payload.jti) {
      const isBlacklisted = await this.authService.isTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      groupIds: payload.groupIds || [],
      jti: payload.jti,
    }; // becomes req.user
  }
}
