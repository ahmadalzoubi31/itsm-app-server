import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refreshToken.entity';
import { UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfigService } from '@nestjs/config';

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

    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() +
        Number(
          this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ),
    );

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7' });

    await this.refreshTokenRepository.upsert(
      { token: refreshToken, expiry: expiryDate, user },
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
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: input.refreshToken },
      relations: ['user'],
    });
    if (!refreshToken) {
      return new UnauthorizedException('Refresh token invalid');
    }

    if (refreshToken.expiry < new Date()) {
      return new UnauthorizedException('Refresh token expired');
    }

    return this.login(refreshToken.user);
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
