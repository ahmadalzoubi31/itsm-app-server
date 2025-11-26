import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { CaseComment } from './entities/case-comment.entity';
import { CaseLink } from './entities/case-link.entity';
import { CaseAttachment } from './entities/case-attachment.entity';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SlaModule } from '@modules/sla/sla.module';
import { SlaTimer } from '@modules/sla/entities/sla-timer.entity';
import { CaseCategoryModule } from '@modules/case-category/case-category.module';
import { CaseSubcategoryModule } from '@modules/case-subcategory/case-subcategory.module';
import { CaseCategory } from '@modules/case-category/entities/case-category.entity';
import { CaseSubcategory } from '@modules/case-subcategory/entities/case-subcategory.entity';

@Module({
  imports: [
    BusinessLineModule,
    CaslModule,
    AuditModule,
    SlaModule,
    CaseCategoryModule,
    CaseSubcategoryModule,
    TypeOrmModule.forFeature([
      Case,
      CaseComment,
      CaseLink,
      CaseAttachment,
      SlaTimer,
      CaseCategory,
      CaseSubcategory,
    ]),
  ],
  controllers: [CaseController],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseModule {}
