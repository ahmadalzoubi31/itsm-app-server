// src/modules/case-category/case-category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseCategory } from './entities/case-category.entity';
import { CaseCategoryController } from './case-category.controller';
import { CaseCategoryService } from './case-category.service';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { InfraModule } from '@shared/infra/infra.module';

@Module({
  imports: [InfraModule, CaslModule, TypeOrmModule.forFeature([CaseCategory])],
  controllers: [CaseCategoryController],
  providers: [CaseCategoryService],
  exports: [CaseCategoryService],
})
export class CaseCategoryModule {}

