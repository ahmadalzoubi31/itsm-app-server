import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settings, User])],
  controllers: [SettingsController],
  providers: [SettingsService, CaslAbilityFactory, UsersService],
  exports: [SettingsService],
})
export class SettingsModule {}
