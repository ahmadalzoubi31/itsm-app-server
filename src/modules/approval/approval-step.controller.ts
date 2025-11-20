// src/modules/approval/approval.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { CurrentUser } from '@modules/iam/auth/decorators/current-user.decorator';
import { ApprovalService } from './approval.service';
import { CreateApprovalStepsDto } from './dto/approval-step.dto';
import { JwtUser } from '@shared/types/jwt-user.type';
import { ApprovalSteps } from './entities/approval-step.entity';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('Approval Steps')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalController {
  private readonly logger = new Logger(ApprovalController.name);

  constructor(private readonly approvalService: ApprovalService) {
    this.logger.log('ApprovalController initialized');
  }

  // ==================== Approval Step Endpoints ====================

  @Get('request-card/:requestCardId')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, ApprovalSteps)
  @ApiOperation({
    summary: 'Get approval steps for a request card',
    description: 'Retrieve all approval steps for a specific request card.',
  })
  getApprovalSteps(@Param('requestCardId') requestCardId: string) {
    return this.approvalService.getApprovalSteps(requestCardId);
  }

  @Post('request-card/:requestCardId')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, ApprovalSteps)
  @ApiOperation({
    summary: 'Create approval steps for a request card',
    description: 'Create multiple approval steps for a request card.',
  })
  @ApiBody({
    type: [CreateApprovalStepsDto],
    description: 'Array of approval steps to create',
  })
  createApprovalSteps(
    @Param('requestCardId') requestCardId: string,
    @Body() steps: CreateApprovalStepsDto[],
  ) {
    return this.approvalService.createApprovalSteps(requestCardId, steps);
  }

  @Put('request-card/:requestCardId')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Update, ApprovalSteps)
  @ApiOperation({
    summary: 'Replace approval steps for a request card',
    description:
      'Delete existing approval steps and create new ones for a request card.',
  })
  @ApiBody({
    type: [CreateApprovalStepsDto],
    description: 'Array of approval steps to replace',
  })
  replaceApprovalSteps(
    @Param('requestCardId') requestCardId: string,
    @Body() steps: CreateApprovalStepsDto[],
  ) {
    return this.approvalService.replaceApprovalSteps(requestCardId, steps);
  }

  @Delete('request-card/:requestCardId')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Delete, ApprovalSteps)
  @ApiOperation({
    summary: 'Delete all approval steps for a request card',
    description: 'Remove all approval steps associated with a request card.',
  })
  async deleteApprovalSteps(@Param('requestCardId') requestCardId: string) {
    await this.approvalService.deleteApprovalSteps(requestCardId);
    return { message: 'Approval steps deleted successfully' };
  }
}
