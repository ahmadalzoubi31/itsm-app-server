import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CurrentUser } from '../iam/auth/decorators/current-user.decorator';
import { JwtUser } from '@shared/types/jwt-user.type';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCommentDto } from './dto/add-comment.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { AssignCaseDto } from './dto/assign-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CASE_STATUS_OPTIONS } from '@shared/constants';
import { Case } from './entities/case.entity';
import { AbilityGuard } from '../iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '../iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '../iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '../iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

@ApiTags('Cases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cases')
export class CaseController {
  private readonly logger = new Logger(CaseController.name);

  constructor(private readonly svc: CaseService) {
    this.logger.log('CaseController initialized');
  }

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Case)
  create(@Body() dto: CreateCaseDto) {
    return this.svc.createCase(dto);
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Case)
  list(@Query() q: ListCasesQuery) {
    return this.svc.listCases(q);
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase')
  get(@Param('id') id: string) {
    return this.svc.getCase(id);
  }

  @Get('number/:number')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Case)
  getByNumber(@Param('number') number: string) {
    return this.svc.getCaseByNumber(number);
  }

  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase')
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.svc.updateCase(id, dto);
  }

  @Post(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.svc.addComment(id, dto);
  }

  @Get(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase')
  listComments(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.listComments(id, user.userId);
  }

  @ApiOperation({
    summary: 'Assign case',
    description: 'Set assignee and/or assignment group.',
  })
  @Post(':id/assign')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase')
  assign(@Param('id') id: string, @Body() dto: AssignCaseDto) {
    return this.svc.assignCase(id, dto);
  }

  @ApiOperation({
    summary: 'Change status',
    description: `Allowed: ${CASE_STATUS_OPTIONS.map((s) => s.label).join(' → ')}`,
  })
  @Post(':id/status')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.svc.changeStatus(id, dto.status);
  }

  @ApiOperation({
    summary: 'Upload attachment',
    description: 'Max 10 MB; allowed types: pdf, png, jpg, txt.',
  })
  @Post(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.addAttachment(id, file);
  }

  @ApiOperation({
    summary: 'List attachments',
    description: 'Attachments metadata for a case.',
  })
  @Get(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase')
  listAttachments(@Param('id') id: string) {
    return this.svc.listAttachments(id);
  }

  @ApiOperation({
    summary: 'Get case timeline',
    description: 'Get audit events for a case.',
  })
  @Get(':id/timeline')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase')
  getTimeline(@Param('id') id: string) {
    return this.svc.getCaseTimeline(id);
  }
}
