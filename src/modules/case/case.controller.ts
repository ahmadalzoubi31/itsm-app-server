import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCommentDto } from './dto/add-comment.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { Case } from './entities/case.entity';
import { AssignCaseDto } from './dto/assign-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CASE_STATUS_OPTIONS } from '@shared/constants';

@ApiTags('Cases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cases')
export class CaseController {
  private readonly logger = new Logger(CaseController.name);

  constructor(private readonly svc: CaseService) {}

  // Type-level check: Can user create Cases? (no specific case ID needed)
  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Case)
  create(@CurrentUser() user, @Body() dto: CreateCaseDto) {
    return this.svc.createCase({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  // Type-level check: Can user read Cases? (no specific case ID needed)
  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Case)
  list(@CurrentUser() user, @Query() q: ListCasesQuery) {
    return this.svc.listCases(q, user);
  }

  // Resource-level check: Can user read THIS specific case?
  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase', 'id')
  get(@Param('id') id: string) {
    return this.svc.getCase(id);
  }

  @Get('number/:number')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCaseByNumber', 'number')
  getByNumber(@Param('number') number: string) {
    return this.svc.getCaseByNumber(number);
  }

  // Resource-level check: Can user update THIS specific case?
  @Patch(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.svc.updateCase(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }

  // Resource-level check: Can user add comment to THIS specific case?
  @Post(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
  addComment(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.svc.addComment(id, {
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  // Resource-level check: Can user read comments for THIS specific case?
  @Get(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase', 'id')
  listComments(@Param('id') id: string) {
    return this.svc.listComments(id);
  }

  @ApiOperation({
    summary: 'Assign case',
    description: 'Set assignee and/or assignment group.',
  })
  @Post(':id/assign')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
  assign(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: AssignCaseDto,
  ) {
    return this.svc.assignCase(id, dto, {
      actorId: user.userId,
      actorName: user.username,
    });
  }

  @ApiOperation({
    summary: 'Change status',
    description: `Allowed: ${CASE_STATUS_OPTIONS.map((s) => s.label).join(' → ')}`,
  })
  @Post(':id/status')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
  changeStatus(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.svc.changeStatus(id, dto.status, {
      actorId: user.userId,
      actorName: user.username,
    });
  }

  @ApiOperation({
    summary: 'Upload attachment',
    description: 'Max 10 MB; allowed types: pdf, png, jpg, txt.',
  })
  @Post(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @CurrentUser() user,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.addAttachment(id, file, {
      actorId: user.userId,
      actorName: user.username,
    });
  }

  @ApiOperation({
    summary: 'List attachments',
    description: 'Attachments metadata for a case.',
  })
  @Get(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase', 'id')
  listAttachments(@Param('id') id: string) {
    return this.svc.listAttachments(id);
  }
}
