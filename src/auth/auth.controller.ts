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
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
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
      sameSite: 'lax', // or 'strict'
      secure: true, // only over HTTPS
      // expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      // expires: expiryDate,
    });

    // You can return user info or just a status
    return { accessToken, refreshToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.userService.findByUsername(req.user.username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password,
      createdAt,
      createdById,
      updatedAt,
      updatedById,
      ...result
    } = user;

    const { permissions, ...userResult } = result;

    const permissionNames = permissions.map((item) => item.name);
    return { permissionNames, ...userResult };
  }

  @UseGuards(LocalAuthGuard)
  @Delete('sign-out')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Post('refresh-token')
  async refreshToken(@Body() input: RefreshTokenDto) {
    return this.authService.refreshToken(input);
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
