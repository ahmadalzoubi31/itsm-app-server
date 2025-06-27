import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Response,
  Request,
  UseGuards,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  @HttpCode(200)
  async login(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    // Set HTTP-only cookie for access token
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax', // 'lax' is good for most use-cases, 'none' only if you ever need cross-site requests
      // domain: '.webpexo.com', // <-- this is the key part!
      path: '/',
    });

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax', // 'lax' is good for most use-cases, 'none' only if you ever need cross-site requests
      // domain: '.webpexo.com', // <-- this is the key part!
      path: '/',
    });

    // You can return user info or just a status
    return { accessToken, refreshToken };
  }
  //
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findByUsername(req.user.username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      firstName,
      lastName,
      username,
      phone,
      address,
      status,
      password,
      createdAt,
      createdById,
      updatedAt,
      updatedById,
      ...result
    } = user;

    const { permissions, ...userResult } = result;

    const permissionNames = permissions.map((item) => item.name);
    return { ...result, permissions: permissionNames };
  }

  @UseGuards(LocalAuthGuard)
  @Delete('sign-out')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Body() input: RefreshTokenDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    // This should return: { accessToken, refreshToken }
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(input);

    // Set HTTP-only cookie for access token
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return { accessToken, refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Body() input: ChangePasswordDto,
    @Request() req: { user: { id: string } },
  ) {
    const userId = req.user.id;
    return this.authService.changePassword(input, userId);
  }
}
