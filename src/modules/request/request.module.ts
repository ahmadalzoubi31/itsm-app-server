import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CaseModule } from '@modules/case/case.module';
import { WorkflowModule } from '@modules/workflow/workflow.module';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import { ApprovalModule } from '@modules/approval/approval.module';
import { ApprovalSteps } from '@modules/approval/entities/approval-step.entity';
import { RequestComment } from './entities/request-comment.entity';
import { RequestAttachment } from './entities/request-attachment.entity';
import { CaseStatusSyncListener } from './listeners/case-status-sync.listener';
import { RequestApprovedListener } from './listeners/request-approved.listener';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { CaseCategoryModule } from '@modules/case-category/case-category.module';
import { CaseSubcategoryModule } from '@modules/case-subcategory/case-subcategory.module';

@Module({
  imports: [
    BusinessLineModule,
    CaseModule,
    WorkflowModule,
    forwardRef(() => ApprovalModule),
    CaslModule,
    CaseCategoryModule,
    CaseSubcategoryModule,
    TypeOrmModule.forFeature([
      Request,
      RequestCard,
      RequestComment,
      RequestAttachment,
      ApprovalSteps,
    ]),
  ],
  controllers: [RequestController],
  providers: [RequestService, CaseStatusSyncListener, RequestApprovedListener],
  exports: [RequestService],
})
export class RequestModule {}
