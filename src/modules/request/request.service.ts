import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { JwtUser } from '@shared/types/jwt-user.type';
import { RequestStatus, RequestType } from '@shared/constants';
import { BusinessLineService } from '@modules/business-line/business-line.service';
import { CaseService } from '@modules/case/case.service';
import { WorkflowService } from '@modules/workflow/workflow.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RequestCreatedEvent,
  RequestStatusChangedEvent,
  RequestAssignedEvent,
} from '@shared/contracts/events';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Request) private requests: Repository<Request>,
    private readonly businessLineSvc: BusinessLineService,
    private readonly caseSvc: CaseService,
    private readonly workflowSvc: WorkflowService,
  ) {
    this.logger.log('RequestService initialized');
  }

  async createRequest(
    dto: CreateRequestDto & { createdById?: string; createdByName?: string },
  ) {
    this.logger.log(
      `Creating request: ${dto.type} for business line ${dto.businessLineId}`,
    );

    // Validate business line exists
    const businessLine = await this.businessLineSvc.findOne(dto.businessLineId);

    // Generate request number
    const result = await this.requests.manager.query(
      "SELECT nextval('request_number_seq') as nextval",
    );
    const nextval = result[0].nextval;
    const number = `REQ-${String(nextval).padStart(6, '0')}`;

    // Find appropriate workflow for routing
    const workflow = await this.workflowSvc.findWorkflowForRouting({
      businessLineId: dto.businessLineId,
      requestType: dto.type,
      metadata: dto.metadata,
    });

    // Determine assignment group from workflow or default
    let assignmentGroupId = dto.requestTemplateId
      ? await this.getAssignmentGroupFromTemplate(dto.requestTemplateId)
      : null;

    if (!assignmentGroupId) {
      assignmentGroupId = await this.determineAssignmentGroup(dto.type);
    }

    const entity = this.requests.create({
      ...dto,
      number,
      assignmentGroupId,
      requesterId: dto.createdById!,
    });
    const saved = await this.requests.save(entity);

    // Route to Case or Incident using workflow
    const linkedCase = await this.routeRequest(saved, dto, workflow);

    // Update with linked case
    if (linkedCase) {
      saved.linkedCaseId = linkedCase.id;
      await this.requests.save(saved);
    }

    this.logger.log(`Request ${saved.number} created and routed successfully`);

    // Emit event
    this.eventEmitter.emit(
      'request.created',
      new RequestCreatedEvent(saved.id, {
        businessLineId: businessLine.id,
        type: saved.type,
        priority: saved.priority,
        requesterId: saved.requesterId,
        createdAt: saved.createdAt.toISOString(),
      }),
    );

    return saved;
  }

  async listRequests(q: ListRequestsQuery, user: JwtUser) {
    const where: any = {};

    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (q.priority) where.priority = q.priority;
    if (q.businessLineId) where.businessLineId = q.businessLineId;

    const page = q.page || 1;
    const pageSize = q.pageSize || 20;

    const findOpts: any = {
      where,
      order: {
        [q.sortBy!]: q.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    };

    // Simple search across number/title
    if (q.q) {
      findOpts.where = [
        { ...where, number: ILike(`%${q.q}%`) },
        { ...where, title: ILike(`%${q.q}%`) },
      ];
    }

    const [items, total] = await this.requests.findAndCount(findOpts);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getRequest(id: string) {
    const r = await this.requests.findOne({
      where: [{ id }, { number: id }],
      relations: ['linkedCase'],
    });
    if (!r) throw new NotFoundException('Request not found');
    return r;
  }

  async getRequestByNumber(number: string) {
    const r = await this.requests.findOne({
      where: { number },
      relations: ['linkedCase'],
    });
    if (!r)
      throw new NotFoundException(`Request not found with number ${number}`);
    return r;
  }

  async updateRequest(
    id: string,
    dto: UpdateRequestDto & { updatedById?: string; updatedByName?: string },
  ) {
    const entity = await this.getRequest(id);

    // Handle status changes
    if (dto.status && dto.status !== entity.status) {
      this.validateStatusTransition(entity.status, dto.status);
    }

    Object.assign(entity, dto);

    // Handle resolution
    if (dto.resolution) {
      entity.resolution = dto.resolution;
      entity.resolvedAt = new Date();
      entity.status = RequestStatus.RESOLVED;
    }

    const saved = await this.requests.save(entity);

    // Emit status change event if status changed
    if (dto.status && dto.status !== entity.status) {
      this.eventEmitter.emit(
        'request.status.changed',
        new RequestStatusChangedEvent(saved.id, {
          before: { status: entity.status },
          after: { status: dto.status },
          actor: {
            actorId: dto.updatedById!,
            actorName: dto.updatedByName!,
          },
          updatedAt: saved.updatedAt.toISOString(),
        }),
      );
    }

    return saved;
  }

  async assignRequest(
    id: string,
    dto: { assigneeId?: string; assignmentGroupId?: string },
    actor: { actorId: string; actorName: string },
  ) {
    const entity = await this.getRequest(id);

    if (dto.assigneeId) entity.assigneeId = dto.assigneeId;
    if (dto.assignmentGroupId) entity.assignmentGroupId = dto.assignmentGroupId;

    const saved = await this.requests.save(entity);

    if (dto.assigneeId) {
      this.eventEmitter.emit(
        'request.assigned',
        new RequestAssignedEvent(saved.id, {
          assigneeId: dto.assigneeId,
          assigneeName: actor.actorName,
        }),
      );
    }

    return saved;
  }

  async resolveRequest(
    id: string,
    resolution: string,
    actor: { actorId: string; actorName: string },
  ) {
    const entity = await this.getRequest(id);

    entity.resolution = resolution;
    entity.resolvedAt = new Date();
    entity.status = RequestStatus.RESOLVED;

    const saved = await this.requests.save(entity);

    this.eventEmitter.emit(
      'request.status.changed',
      new RequestStatusChangedEvent(saved.id, {
        before: { status: entity.status },
        after: { status: RequestStatus.RESOLVED },
        actor,
        updatedAt: saved.updatedAt.toISOString(),
      }),
    );

    return saved;
  }

  /**
   * Route request to Case, Incident, etc. based on workflow
   */
  private async routeRequest(
    request: Request,
    dto: CreateRequestDto,
    workflow?: any,
  ) {
    const caseDto = {
      title: request.title,
      description: request.description,
      priority: request.priority,
      requesterId: request.requesterId,
      assignmentGroupId: request.assignmentGroupId!,
      businessLineId: request.businessLineId,
      affectedServiceId: request.affectedServiceId,
      requestTemplateId: request.requestTemplateId,
      createdById: request.createdById,
      createdByName: request.createdByName,
    };

    // Determine target type from workflow
    const targetType = workflow?.targetType || 'Case'; // Default to Case

    this.logger.log(
      `Routing request ${request.number} to ${targetType} using workflow: ${workflow?.name || 'default'}`,
    );

    try {
      // Currently only Case routing is implemented
      // Future: Add Incident, Problem, Change routing
      switch (targetType) {
        case 'Case':
        case 'Incident':
          const createdCase = await this.caseSvc.createCase(caseDto);
          this.logger.log(
            `Request ${request.number} routed to ${createdCase.number} (${targetType})`,
          );
          return createdCase;
        case 'Problem':
        case 'Change':
          // TODO: Implement Problem and Change routing when entities are created
          this.logger.warn(
            `Routing to ${targetType} not yet implemented, creating Case instead`,
          );
          const fallbackCase = await this.caseSvc.createCase(caseDto);
          return fallbackCase;
        default:
          throw new BadRequestException(`Unknown target type: ${targetType}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to route request ${request.number}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get assignment group from template if available
   */
  private async getAssignmentGroupFromTemplate(
    templateId: string,
  ): Promise<string | null> {
    try {
      const result = await this.requests.manager.query(
        `SELECT "defaultAssignmentGroupId" FROM request_template WHERE id = $1`,
        [templateId],
      );
      return result[0]?.defaultAssignmentGroupId || null;
    } catch (error) {
      this.logger.warn(`Could not get assignment group from template`);
      return null;
    }
  }

  /**
   * Determine assignment group based on request type
   */
  private async determineAssignmentGroup(type: RequestType): Promise<string> {
    // TODO: Implement logic to fetch from workflow or configuration
    // For now, return a default group or fetch from database
    // This should be configurable based on business line and request type
    try {
      // Fetch default assignment group from Group table
      const result = await this.requests.manager.query(
        `SELECT id FROM "group" WHERE "name" LIKE '%Support%' OR "key" = 'support' LIMIT 1`,
      );
      return result[0]?.id || 'default-group-id';
    } catch (error) {
      this.logger.warn('Could not determine assignment group, using default');
      return 'default-group-id'; // Placeholder - should be configured properly
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: RequestStatus, to: RequestStatus) {
    const allowedTransitions = new Map([
      [
        RequestStatus.SUBMITTED,
        new Set([RequestStatus.ASSIGNED, RequestStatus.CLOSED]),
      ],
      [
        RequestStatus.ASSIGNED,
        new Set([RequestStatus.IN_PROGRESS, RequestStatus.CLOSED]),
      ],
      [
        RequestStatus.IN_PROGRESS,
        new Set([RequestStatus.RESOLVED, RequestStatus.CLOSED]),
      ],
      [RequestStatus.RESOLVED, new Set([RequestStatus.CLOSED])],
    ]);

    const allowed = allowedTransitions.get(from)?.has(to) ?? false;

    if (!allowed) {
      throw new BadRequestException(
        `Invalid status transition: ${from} → ${to}`,
      );
    }
  }
}
