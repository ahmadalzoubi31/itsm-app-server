import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CurrentUser } from '../iam/auth/decorators/current-user.decorator';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@ApiTags('Workflows')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(private readonly svc: WorkflowService) {}

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Create workflow',
    description: 'Admin: Create a new workflow for routing requests.',
  })
  create(@CurrentUser() user, @Body() dto: CreateWorkflowDto) {
    return this.svc.createWorkflow({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  @ApiOperation({
    summary: 'List workflows',
    description: 'List all workflows.',
  })
  list() {
    return this.svc.findAll();
  }

  @Get(':id')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, 'all')
  @ApiOperation({
    summary: 'Get workflow',
    description: 'Get a single workflow by ID.',
  })
  get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Manage, 'all')
  @ApiOperation({
    summary: 'Update workflow',
    description: 'Admin: Update a workflow.',
  })
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.svc.updateWorkflow(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }
}
