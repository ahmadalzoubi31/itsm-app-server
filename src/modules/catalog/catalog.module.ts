// src/modules/catalog/catalog.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { RequestTemplate } from './entities/request-template.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CaseModule } from '@modules/case/case.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { RequestModule } from '@modules/request/request.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, RequestTemplate]),
    BusinessLineModule,
    CaslModule,
    CaseModule,
    RequestModule,
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
