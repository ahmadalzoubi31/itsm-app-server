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
import { RequestModule } from '@modules/request/request.module';
import { WorkflowModule } from '@modules/workflow/workflow.module';
import { LdapModule } from '@modules/ldap/ldap.module';
import { UserPreferencesModule } from '@modules/user-preferences/user-preferences.module';

@Module({
  imports: [
    InfraModule,
    IamModule,
    LdapModule,
    EmailModule,
    NotifyModule,
    BusinessLineModule,
    CaseModule,
    CatalogModule,
    SlaModule,
    WorkflowModule,
    RequestModule,
    UserPreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
