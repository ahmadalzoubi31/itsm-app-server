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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CurrentUser } from '../iam/auth/decorators/current-user.decorator';
import { RequestService } from './request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { AbilityGuard } from '@modules/iam/casl/guards/ability.guard';
import { ResourcePoliciesGuard } from '@modules/iam/casl/guards/resource-policies.guard';
import { CheckAbility } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CheckResource } from '@modules/iam/casl/decorators/check-resource.decorator';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { Request } from './entities/request.entity';

@ApiTags('Requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestController {
  private readonly logger = new Logger(RequestController.name);

  constructor(private readonly svc: RequestService) {}

  @Post()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Create, Request)
  @ApiOperation({
    summary: 'Create request',
    description: 'Create a new service request or incident.',
  })
  create(@CurrentUser() user, @Body() dto: CreateRequestDto) {
    return this.svc.createRequest({
      ...dto,
      createdById: user.userId,
      createdByName: user.username,
    });
  }

  @Get()
  @UseGuards(AbilityGuard)
  @CheckAbility(IAM_ACTIONS.Read, Request)
  @ApiOperation({
    summary: 'List requests',
    description: 'List all requests (filtered by role).',
  })
  list(@CurrentUser() user, @Query() q: ListRequestsQuery) {
    return this.svc.listRequests(q, user);
  }

  @Get(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Read, RequestService, 'getRequest', 'id')
  @ApiOperation({
    summary: 'Get request',
    description: 'Get a single request by ID or number.',
  })
  get(@Param('id') id: string) {
    return this.svc.getRequest(id);
  }

  @Get('number/:number')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(
    IAM_ACTIONS.Read,
    RequestService,
    'getRequestByNumber',
    'number',
  )
  @ApiOperation({
    summary: 'Get request by number',
    description: 'Get a request by its number.',
  })
  getByNumber(@Param('number') number: string) {
    return this.svc.getRequestByNumber(number);
  }

  @Put(':id')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest', 'id')
  @ApiOperation({
    summary: 'Update request',
    description: 'Update a request.',
  })
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.svc.updateRequest(id, {
      ...dto,
      updatedById: user.userId,
      updatedByName: user.username,
    });
  }

  @Post(':id/assign')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest', 'id')
  @ApiOperation({
    summary: 'Assign request',
    description: 'Assign request to user or group.',
  })
  assign(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: { assigneeId?: string; assignmentGroupId?: string },
  ) {
    return this.svc.assignRequest(id, dto, {
      actorId: user.userId,
      actorName: user.username,
    });
  }

  @Post(':id/resolve')
  @UseGuards(ResourcePoliciesGuard)
  @CheckResource(IAM_ACTIONS.Update, RequestService, 'getRequest', 'id')
  @ApiOperation({
    summary: 'Resolve request',
    description: 'Mark request as resolved with resolution details.',
  })
  resolve(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: { resolution: string },
  ) {
    return this.svc.resolveRequest(id, dto.resolution, {
      actorId: user.userId,
      actorName: user.username,
    });
  }
}
