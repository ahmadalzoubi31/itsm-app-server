import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailController } from './controllers/email.controller';
import { EmailTemplateController } from './controllers/email-template.controller';
import { EmailQueue } from './entities/email-queue.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailStatistics } from './entities/email-statistics.entity';
import { SettingsModule } from '../settings/settings.module';
import { CaslModule } from '../casl/casl.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EmailQueue, EmailTemplate, EmailStatistics]),
    SettingsModule,
    CaslModule,
    UsersModule,
  ],
  controllers: [EmailController, EmailTemplateController],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
