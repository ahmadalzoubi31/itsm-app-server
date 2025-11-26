// src/modules/case-subcategory/case-subcategory.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseSubcategory } from './entities/case-subcategory.entity';
import { CaseSubcategoryController } from './case-subcategory.controller';
import { CaseSubcategoryService } from './case-subcategory.service';
import { CaseCategoryModule } from '@modules/case-category/case-category.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { InfraModule } from '@shared/infra/infra.module';

@Module({
  imports: [
    InfraModule,
    CaslModule,
    CaseCategoryModule,
    TypeOrmModule.forFeature([CaseSubcategory]),
  ],
  controllers: [CaseSubcategoryController],
  providers: [CaseSubcategoryService],
  exports: [CaseSubcategoryService],
})
export class CaseSubcategoryModule {}

