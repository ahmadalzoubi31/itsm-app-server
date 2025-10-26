import { AppService } from './app.service';
import { AppController } from './app.controller';
import { Module } from '@nestjs/common';

// Modules
import { InfraModule } from './shared/infra/infra.module';
import { IamModule } from '@modules/iam/iam.module';
import { CaseModule } from '@modules/case/case.module';
import { SlaModule } from '@modules/sla/sla.module';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { EmailModule } from '@modules/email/email.module';
import { NotifyModule } from '@modules/notify/notify.module';

@Module({
  imports: [
    InfraModule,
    IamModule,
    // AuditModule,
    EmailModule,
    NotifyModule,
    BusinessLineModule,
    CaseModule,
    CatalogModule,
    SlaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
