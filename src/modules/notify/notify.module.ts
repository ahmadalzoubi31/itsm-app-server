// src/modules/notify/notify.module.ts
import { Module } from '@nestjs/common';
import { NotifyWorker } from './notify.worker';
import { NotifyController } from './notify.controller';
import { CaseModule } from '@modules/case/case.module';
import { UsersModule } from '@modules/iam/users/users.module';
import { EmailModule } from '@modules/email/email.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { UserNotifyPref } from './entities/user-notify-pref.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    UsersModule,
    CaseModule,
    EmailModule,
    CaslModule,
    TypeOrmModule.forFeature([UserNotifyPref]),
  ],
  controllers: [NotifyController],
  providers: [NotifyWorker],
})
export class NotifyModule {}
