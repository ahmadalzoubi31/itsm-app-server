// src/modules/approval/approval.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalSteps } from './entities/approval-step.entity';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval-step.controller';
import { RequestApprovalController } from './approval-request.controller';
import { RequestApprovalListener } from './listeners/request-approval.listener';
import { Request } from '@modules/request/entities/request.entity';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { Membership } from '@modules/iam/groups/entities/membership.entity';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { RequestModule } from '@modules/request/request.module';

@Module({
  imports: [
    CaslModule,
    forwardRef(() => RequestModule),
    TypeOrmModule.forFeature([
      ApprovalRequest,
      ApprovalSteps,
      Request,
      RequestCard,
      User,
      Membership,
    ]),
  ],
  controllers: [ApprovalController, RequestApprovalController],
  providers: [ApprovalService, RequestApprovalListener],
  exports: [ApprovalService],
})
export class ApprovalModule {}
