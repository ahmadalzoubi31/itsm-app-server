// src/modules/catalog/catalog.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { RequestCard } from './entities/request-card.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CaseModule } from '@modules/case/case.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { RequestModule } from '@modules/request/request.module';
import { IamModule } from '@modules/iam/iam.module';
import { ApprovalModule } from '@modules/approval/approval.module';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, RequestCard, BusinessLine]),
    BusinessLineModule,
    CaslModule,
    CaseModule,
    RequestModule,
    IamModule,
    ApprovalModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
