import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refreshToken.entity';
import { UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);

    if (!user) return null;

    const isPasswordMatch = await compare(pass, user.password);
    if (!isPasswordMatch) return null;

    return user;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id, role: user.role };

    const issuedAt = new Date();
    const expiryDate = new Date(issuedAt);
    expiryDate.setDate(
      expiryDate.getDate() +
        Number(this.configService.get<string>('REFRESH_JWT_EXPIRES_IN')),
    );

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    // Always create a new refresh token (invalidate previous), with fixed expiry
    await this.refreshTokenRepository.upsert(
      { token: refreshToken, expiry: expiryDate, issuedAt, user },
      ['user'],
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(id: string) {
    await this.refreshTokenRepository.delete({ user: { id } });
    return { message: 'Logged out successfully' };
  }

  async refreshToken(input: { refreshToken: string }) {
    console.log('🚀 ~ AuthService ~ refreshToken ~ input:', input);
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: input.refreshToken },
      relations: ['user'],
    });
    console.log(
      '🚀 ~ AuthService ~ refreshToken ~ refreshToken:',
      refreshToken,
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token invalid');
    }
    if (refreshToken.expiry < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // DON'T issue a new refresh token. Just return new accessToken, same refreshToken.
    const payload = {
      username: refreshToken.user.username,
      sub: refreshToken.user.id,
      role: refreshToken.user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: refreshToken.token, // re-send old refreshToken, unchanged
    };
  }

  async changePassword(input: ChangePasswordDto, id: string) {
    // Find the user
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if the old password is correct
    const isPasswordMatch = await compare(input.oldPassword, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    this.usersService.update(id, { password: input.newPassword });

    return { message: 'Password changed successfully' };
  }
}
