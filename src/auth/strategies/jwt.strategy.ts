import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import jwtConfig from 'src/config/jwtConfig';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Try to get token from Authorization header
          let token = '';
          if (request && request.headers['authorization']) {
            token = request.headers['authorization'].split(' ')[1];
          }

          // If not in header, get it from cookie
          if (!token && request && request.cookies) {
            token = request.cookies['accessToken'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig().secret!,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
