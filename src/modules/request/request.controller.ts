import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
  Logger,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CurrentUser } from '../iam/auth/decorators/current-user.decorator';
import { RequestService } from './request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { CreateCommentDto } from './dto/add-comment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtUser } from '@shared/types/jwt-user.type';
import { Request } from './entities/request.entity';
import { AbilityGuard } from '../iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '../iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '../iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '../iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { CaslAbilityFactory } from '../iam/casl/casl-ability.factory';

@ApiTags('Requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestController {
  private readonly logger = new Logger(RequestController.name);

  constructor(
    private readonly svc: RequestService,
    private readonly casl: CaslAbilityFactory,
  ) {
    this.logger.log('RequestController initialized');
  }

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Request)
  @ApiOperation({
    summary: 'Create request',
    description: 'Create a new service request or incident.',
  })
  create(@Body() dto: CreateRequestDto) {
    return this.svc.createRequest(dto);
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Request)
  @ApiOperation({
    summary: 'List requests',
    description: 'List all requests (filtered by role).',
  })
  async list(@Query() q: ListRequestsQuery, @CurrentUser() user: JwtUser) {
    // Extract conditions from user permissions
    // This will return conditions like { requesterId: user.userId } for "own" permissions
    const permissionConditions = await this.casl.extractConditions(
      user,
      IAM_ACTIONS.Read,
      Request,
    );

    return this.svc.listRequests(q, permissionConditions || undefined);
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Get request',
    description: 'Get a single request by ID or number.',
  })
  get(@Param('id') id: string) {
    return this.svc.getRequest(id);
  }

  @Get('number/:number')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Request)
  @ApiOperation({
    summary: 'Get request by number',
    description: 'Get a request by its number.',
  })
  getByNumber(@Param('number') number: string) {
    return this.svc.getRequestByNumber(number);
  }

  @Get('by-linked-case/:caseId')
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Request)
  @ApiOperation({
    summary: 'Get request by linked case ID',
    description: 'Get a request that is linked to a specific case.',
  })
  getByLinkedCase(@Param('caseId') caseId: string) {
    return this.svc.getRequestByLinkedCaseId(caseId);
  }

  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Update request',
    description: 'Update a request.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto) {
    return this.svc.updateRequest(id, dto);
  }

  @Post(':id/assign')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Assign request',
    description: 'Assign request to user or group.',
  })
  assign(
    @Param('id') id: string,
    @Body() dto: { assigneeId?: string; assignmentGroupId?: string },
  ) {
    return this.svc.assignRequest(id, dto);
  }

  @Post(':id/resolve')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Resolve request',
    description: 'Mark request as resolved with resolution details.',
  })
  resolve(@Param('id') id: string, @Body() dto: { resolution: string }) {
    return this.svc.resolveRequest(id, dto.resolution);
  }

  @Post(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'Add comment',
    description:
      'Add a comment to a request. All comments are shared and visible to both the request and linked case.',
  })
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.addComment(id, dto);
  }

  @Get(':id/comments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, RequestService, 'getRequest')
  @ApiOperation({
    summary: 'List comments',
    description:
      'List all comments for a request. All comments are shared and visible to both the request and linked case.',
  })
  listComments(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.svc.listComments(id, user.userId);
  }

  @ApiOperation({
    summary: 'Upload attachment',
    description: 'Max 10 MB; allowed types: pdf, png, jpg, txt.',
  })
  @Post(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.addAttachment(id, file);
  }

  @ApiOperation({
    summary: 'List attachments',
    description: 'Attachments metadata for a request.',
  })
  @Get(':id/attachments')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, RequestService, 'getRequest')
  listAttachments(@Param('id') id: string) {
    return this.svc.listAttachments(id);
  }
}
