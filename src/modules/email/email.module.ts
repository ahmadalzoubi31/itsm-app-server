// src/modules/email/email.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { UsersModule } from '@modules/iam/users/users.module';
import { CaseModule } from '@modules/case/case.module';

// Entities
import { EmailChannel } from './entities/email-channel.entity';
import { EmailInboundState } from './entities/email-inbound-state.entity';
import { EmailMessage } from './entities/email-message.entity';
import { EmailRoutingRule } from './entities/email-routing-rule.entity';
import { NotificationTemplate } from './entities/notification-template.entity';

// Admin Controllers
import { ChannelsAdminController } from './admin/channels/channels-admin.controller';
import { RulesAdminController } from './admin/rules/rules-admin.controller';
import { TemplatesAdminController } from './admin/templates/templates-admin.controller';
import { MessagesAdminController } from './admin/messages/messages-admin.controller';

// Admin Services
import { ChannelsAdminService } from './admin/channels/channels-admin.service';
import { RulesAdminService } from './admin/rules/rules-admin.service';
import { TemplatesAdminService } from './admin/templates/templates-admin.service';
import { MessagesAdminService } from './admin/messages/messages-admin.service';

// Core Services
import { EmailResolverService } from './core/resolvers/email-resolver.service';
import { EmailSenderService } from './core/senders/email-sender.service';
import { EmailIngestWorker } from './core/workers/email-ingest.worker';
import { TemplateService } from './core/template/template.service';

@Module({
  imports: [
    CaslModule,
    UsersModule,
    CaseModule,
    TypeOrmModule.forFeature([
      EmailChannel,
      EmailInboundState,
      EmailMessage,
      EmailRoutingRule,
      NotificationTemplate,
    ]),
  ],
  controllers: [
    ChannelsAdminController,
    RulesAdminController,
    TemplatesAdminController,
    MessagesAdminController,
  ],
  providers: [
    // Admin Services
    ChannelsAdminService,
    RulesAdminService,
    TemplatesAdminService,
    MessagesAdminService,
    // Core Services
    EmailResolverService,
    EmailSenderService,
    EmailIngestWorker,
    TemplateService,
  ],
  exports: [EmailResolverService, EmailSenderService, TemplateService],
})
export class EmailModule {}
