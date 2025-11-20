// src/modules/approval/request-approval.controller.ts
// This controller maintains backward compatibility with frontend routes
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';
import { ApprovalService } from './approval.service';
import { JwtUser } from '@shared/types/jwt-user.type';
import { ApprovalRequest } from './entities/approval-request.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { RequestService } from '@modules/request/request.service';

@ApiTags('Request Approvals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestApprovalController {
  private readonly logger = new Logger(RequestApprovalController.name);

  constructor(private readonly approvalService: ApprovalService) {
    this.logger.log('RequestApprovalController initialized');
  }

  @Get('approvals/pending')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, ApprovalRequest)
  @ApiOperation({
    summary: 'List pending approvals',
    description: 'Get all pending approvals for the current user.',
  })
  listPending(@CurrentUser() user: JwtUser) {
    return this.approvalService.listPendingApprovals(user.userId);
  }

  @Post(':id/approve')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Approve request',
    description: 'Approve a pending request.',
  })
  approve(
    @Param('id') requestId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto?: { justification?: string },
  ) {
    return this.approvalService.approveRequest(
      requestId,
      user.userId,
      dto?.justification,
    );
  }

  @Post(':id/reject')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Reject request',
    description: 'Reject a pending request with justification.',
  })
  reject(
    @Param('id') requestId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: { justification: string },
  ) {
    return this.approvalService.rejectRequest(
      requestId,
      user.userId,
      dto.justification,
    );
  }
}
