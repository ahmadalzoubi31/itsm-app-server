import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, CaslAbilityFactory],
  exports: [UsersService], // Export the UsersService for use in other modules, e.g., AuthModule, PostsModule, etc.
})
export class UsersModule {}
