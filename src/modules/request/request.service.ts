import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ILike,
  Repository,
  In,
  Not,
  MoreThan,
  MoreThanOrEqual,
  LessThan,
  LessThanOrEqual,
} from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { RequestStatus, RequestType } from '@shared/constants';
import { BusinessLineService } from '@modules/business-line/business-line.service';
import { CaseService } from '@modules/case/case.service';
import { WorkflowService } from '@modules/workflow/workflow.service';
import { CaseCategoryService } from '@modules/case-category/case-category.service';
import { CaseSubcategoryService } from '@modules/case-subcategory/case-subcategory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RequestCreatedEvent,
  RequestStatusChangedEvent,
  RequestAssignedEvent,
} from '@shared/contracts/events';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import { RequestComment } from './entities/request-comment.entity';
import { RequestAttachment } from './entities/request-attachment.entity';
import { ApprovalSteps } from '@modules/approval/entities/approval-step.entity';
import { CreateCommentDto } from './dto/add-comment.dto';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    @InjectRepository(Request) private requests: Repository<Request>,
    @InjectRepository(RequestCard)
    private readonly requestCards: Repository<RequestCard>,
    @InjectRepository(RequestComment)
    private readonly comments: Repository<RequestComment>,
    @InjectRepository(RequestAttachment)
    private readonly attachments: Repository<RequestAttachment>,
    @InjectRepository(ApprovalSteps)
    private readonly approvalSteps: Repository<ApprovalSteps>,
    private readonly eventEmitter: EventEmitter2,
    private readonly businessLineSvc: BusinessLineService,
    private readonly caseSvc: CaseService,
    private readonly workflowSvc: WorkflowService,
    private readonly caseCategorySvc: CaseCategoryService,
    private readonly caseSubcategorySvc: CaseSubcategoryService,
  ) {
    this.logger.log('RequestService initialized');
  }

  async createRequest(dto: CreateRequestDto) {
    this.logger.log(
      `Creating request: ${dto.type} for business line ${dto.businessLineId}`,
    );

    // Validate business line exists
    const businessLine = await this.businessLineSvc.findOne(dto.businessLineId);

    // Validate service card exists if provided and auto-populate category/subcategory
    let requestCard: RequestCard | null = null;
    if (dto.requestCardId) {
      requestCard = await this.requestCards.findOne({
        where: { id: dto.requestCardId, active: true },
        relations: ['defaultAssignmentGroup', 'service'],
      });
      if (!requestCard) {
        throw new NotFoundException('Service card not found or inactive');
      }

      // Auto-populate category and subcategory from service if not provided
      if (!dto.categoryId && requestCard.service) {
        dto.categoryId = requestCard.service.categoryId;
        this.logger.log(
          `Auto-populated categoryId from service: ${dto.categoryId}`,
        );
      }
      if (!dto.subcategoryId && requestCard.service) {
        dto.subcategoryId = requestCard.service.subcategoryId;
        this.logger.log(
          `Auto-populated subcategoryId from service: ${dto.subcategoryId}`,
        );
      }
    }

    // Validate that category and subcategory are provided (either from DTO or auto-populated)
    if (!dto.categoryId || !dto.subcategoryId) {
      throw new BadRequestException(
        'Category and subcategory are required. They should be auto-populated from the service or provided explicitly.',
      );
    }

    // Generate request number
    const result = await this.requests.manager.query(
      "SELECT nextval('request_number_seq') as nextval",
    );
    const nextval = result[0].nextval;
    const number = `REQ-${String(nextval).padStart(6, '0')}`;

    // Find appropriate workflow for routing
    const workflow = await this.workflowSvc.getWorkflowForRouting({
      businessLineId: dto.businessLineId,
      requestType: dto.type,
      metadata: dto.metadata,
    });

    // Determine assignment group from workflow or default
    let assignmentGroupId =
      requestCard?.defaultAssignmentGroup?.id ||
      requestCard?.defaultAssignmentGroupId ||
      null;

    if (!assignmentGroupId) {
      assignmentGroupId = await this.determineAssignmentGroup(
        dto.type,
        dto.businessLineId,
      );
    }

    const entity = this.requests.create({
      ...dto,
      number,
      ...(assignmentGroupId && { assignmentGroupId }),
    });
    const saved = await this.requests.save(entity);

    // Check if approval is required before routing
    const needsApproval = await this.checkIfApprovalRequired(
      saved.requestCardId as string,
    );

    this.logger.log(
      `Request ${saved.number} - requestCardId: ${saved.requestCardId}, needsApproval: ${needsApproval}`,
    );

    // Emit event BEFORE routing (allows approval listener to intercept)
    this.eventEmitter.emit(
      'request.created',
      new RequestCreatedEvent(saved.id, {
        businessLineId: businessLine.id,
        type: saved.type,
        priority: saved.priority,
        requesterId: saved.requesterId || '',
        createdAt: saved.createdAt.toISOString(),
        requestCardId: saved.requestCardId,
      }),
    );

    // Only route to case if no approval is required
    if (!needsApproval) {
      // Route to Case or Incident using workflow
      const linkedCase = await this.routeRequest(saved, dto, workflow);

      // Update with linked case
      if (linkedCase) {
        saved.linkedCaseId = linkedCase.id;
        await this.requests.save(saved);
      }

      this.logger.log(
        `Request ${saved.number} created and routed successfully`,
      );
    } else {
      this.logger.log(
        `Request ${saved.number} created, awaiting approval before routing`,
      );
    }

    return saved;
  }

  async listRequests(
    q: ListRequestsQuery,
    permissionConditions?: Record<string, any> | null,
  ) {
    const baseWhere: any = {};

    if (q.status) baseWhere.status = q.status;
    if (q.type) baseWhere.type = q.type;
    if (q.priority) baseWhere.priority = q.priority;
    if (q.businessLineId) baseWhere.businessLineId = q.businessLineId;

    const page = q.page || 1;
    const pageSize = q.pageSize || 20;

    // Apply permission-based filtering (e.g., requesterId for "own" permissions)
    let where: any | any[] = baseWhere;

    if (permissionConditions) {
      // Check if conditions contain $or (multiple OR conditions)
      if (permissionConditions.$or && Array.isArray(permissionConditions.$or)) {
        // Handle OR conditions - TypeORM uses array of where objects
        const orConditions = permissionConditions.$or.map((condition: any) => {
          const converted = this.convertMongoToTypeORM(condition);
          return { ...baseWhere, ...converted };
        });
        where = orConditions;
      } else {
        // Single condition - merge with base where
        const typeormConditions =
          this.convertMongoToTypeORM(permissionConditions);
        where = { ...baseWhere, ...typeormConditions };
      }
    }

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
      // If where is already an array (from $or), extend each condition
      // Otherwise, convert to array
      if (Array.isArray(where)) {
        findOpts.where = where.flatMap((condition) => [
          { ...condition, number: ILike(`%${q.q}%`) },
          { ...condition, title: ILike(`%${q.q}%`) },
        ]);
      } else {
        findOpts.where = [
          { ...where, number: ILike(`%${q.q}%`) },
          { ...where, title: ILike(`%${q.q}%`) },
        ];
      }
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

  /**
   * Convert MongoDB query conditions to TypeORM format
   * Handles operators like $in, $ne, $gt, etc.
   * Note: $or is handled separately in listRequests method
   */
  private convertMongoToTypeORM(mongoQuery: Record<string, any>): any {
    const typeormWhere: any = {};

    for (const [key, value] of Object.entries(mongoQuery)) {
      // Skip $or - it's handled separately
      if (key === '$or') {
        continue;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Handle MongoDB operators
        if ('$in' in value) {
          // TypeORM uses In() for $in
          typeormWhere[key] = In(value.$in);
        } else if ('$ne' in value) {
          // TypeORM uses Not() for $ne
          typeormWhere[key] = Not(value.$ne);
        } else if ('$gt' in value) {
          typeormWhere[key] = MoreThan(value.$gt);
        } else if ('$gte' in value) {
          typeormWhere[key] = MoreThanOrEqual(value.$gte);
        } else if ('$lt' in value) {
          typeormWhere[key] = LessThan(value.$lt);
        } else if ('$lte' in value) {
          typeormWhere[key] = LessThanOrEqual(value.$lte);
        } else {
          // Nested object, recurse
          typeormWhere[key] = this.convertMongoToTypeORM(value);
        }
      } else {
        // Simple value assignment
        typeormWhere[key] = value;
      }
    }

    return typeormWhere;
  }

  async getRequest(id: string) {
    const r = await this.requests.findOne({
      where: [{ id }, { number: id }],
      relations: [
        'linkedCase',
        'linkedCase.assignee',
        'approvalRequests',
        'approvalRequests.approver',
      ],
    });
    if (!r) throw new NotFoundException('Request not found');
    // Ensure requesterId is available for comment visibility checks
    return r;
  }

  async getRequestByNumber(number: string) {
    const r = await this.requests.findOne({
      where: { number },
      relations: [
        'linkedCase',
        'linkedCase.assignee',
        'approvalRequests',
        'approvalRequests.approver',
      ],
    });
    if (!r)
      throw new NotFoundException(`Request not found with number ${number}`);
    return r;
  }

  async getRequestByLinkedCaseId(caseId: string) {
    const r = await this.requests.findOne({
      where: { linkedCaseId: caseId },
      relations: [
        'linkedCase',
        'linkedCase.assignee',
        'approvalRequests',
        'approvalRequests.approver',
      ],
    });
    // Return null if no request found - a case might not have a linked request
    return r || null;
  }

  async updateRequest(id: string, dto: UpdateRequestDto) {
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
            actorId: entity.createdById!,
            actorName: entity.createdByName!,
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
          assigneeName: entity.assignee!.username,
        }),
      );
    }

    return saved;
  }

  async resolveRequest(id: string, resolution: string) {
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
        actor: {
          actorId: entity.createdById!,
          actorName: entity.createdByName!,
        },
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
    // Skip routing if no assignment group is set
    if (!request.assignmentGroupId) {
      this.logger.warn(
        `Request ${request.number} has no assignment group, skipping routing`,
      );
      return null;
    }

    // Skip routing if requesterId is null (e.g., requester was deleted)
    if (!request.requesterId) {
      this.logger.warn(
        `Request ${request.number} has no requester, skipping routing`,
      );
      return null;
    }

    // Validate that request has category and subcategory
    if (!request.categoryId || !request.subcategoryId) {
      throw new Error(
        `Request ${request.number} is missing category or subcategory. Cannot route to case.`,
      );
    }

    const caseDto = {
      title: request.title,
      description: request.description,
      priority: request.priority,
      requesterId: request.requesterId,
      assignmentGroupId: request.assignmentGroupId,
      businessLineId: request.businessLineId,
      categoryId: request.categoryId,
      subcategoryId: request.subcategoryId,
      affectedServiceId: request.affectedServiceId,
      requestCardId: request.requestCardId,
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
   * Get assignment group from service card if available
   */
  private async getAssignmentGroupFromRequestCard(
    requestCardId: string,
  ): Promise<string | null> {
    try {
      const result = await this.requests.manager.query(
        `SELECT "defaultAssignmentGroupId" FROM service_card WHERE id = $1`,
        [requestCardId],
      );
      return result[0]?.defaultAssignmentGroupId || null;
    } catch (error) {
      this.logger.warn(`Could not get assignment group from service card`);
      return null;
    }
  }

  /**
   * Determine assignment group based on request type and business line
   */
  private async determineAssignmentGroup(
    type: RequestType,
    businessLineId: string,
  ): Promise<string | null> {
    // TODO: Implement logic to fetch from workflow or configuration
    // For now, return a default group or fetch from database
    // This should be configurable based on business line and request type
    try {
      // Fetch default assignment group from Group table for the business line
      // Groups are scoped to business lines, so we must filter by businessLineId
      const result = await this.requests.manager.query(
        `SELECT id FROM "group" 
         WHERE "businessLineId" = $1 
         AND ("name" ILIKE '%Support%' OR "type" = 'help-desk')
         ORDER BY "type" ASC
         LIMIT 1`,
        [businessLineId],
      );
      return result[0]?.id || null;
    } catch (error) {
      this.logger.warn(
        `Could not determine assignment group for business line ${businessLineId}: ${error.message}`,
      );
      return null; // Return null since assignmentGroupId is nullable
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: RequestStatus, to: RequestStatus) {
    const allowedTransitions = new Map([
      [
        RequestStatus.SUBMITTED,
        new Set([
          RequestStatus.WAITING_APPROVAL,
          RequestStatus.ASSIGNED,
          RequestStatus.CLOSED,
        ]),
      ],
      [
        RequestStatus.WAITING_APPROVAL,
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

  async addComment(requestId: string, dto: CreateCommentDto) {
    const request = await this.getRequest(requestId);
    const comment = this.comments.create({
      ...dto,
      requestId: request.id,
      isPrivate: false, // Always shared - comments are visible to both request and case
    });
    const saved = await this.comments.save(comment);
    return saved;
  }

  async listComments(requestId: string, userId?: string) {
    const request = await this.getRequest(requestId);

    // Get request-specific comments (all are shared)
    const requestComments = await this.comments.find({
      where: { requestId: request.id },
      order: { createdAt: 'ASC' },
    });

    // If there's a linked case, also fetch shared comments from the case
    if (request.linkedCaseId) {
      const caseComments = await this.comments.manager.query(
        `SELECT 
          id, 
          body, 
          "isPrivate",
          "createdAt",
          "createdById",
          "createdByName"
        FROM case_comment 
        WHERE "caseId" = $1 AND "isPrivate" = false
        ORDER BY "createdAt" ASC`,
        [request.linkedCaseId],
      );

      // Combine and sort by createdAt
      const allComments = [
        ...requestComments,
        ...caseComments.map((c: any) => ({
          id: c.id,
          body: c.body,
          isPrivate: c.isPrivate,
          createdAt: c.createdAt,
          createdById: c.createdById,
          createdByName: c.createdByName,
        })),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      return allComments;
    }

    // If no linked case, just return request comments
    return requestComments;
  }

  async addAttachment(requestId: string, file: Express.Multer.File) {
    const request = await this.getRequest(requestId);
    const dir = join(process.cwd(), 'var', 'uploads', 'requests', request.id);
    await fs.mkdir(dir, { recursive: true });
    const storagePath = join(dir, file.filename);
    await fs.writeFile(storagePath, file.buffer);
    const attachment = this.attachments.create({
      requestId: request.id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
    });
    const saved = await this.attachments.save(attachment);
    return saved;
  }

  async listAttachments(requestId: string) {
    const request = await this.getRequest(requestId);
    return this.attachments.find({
      where: { requestId: request.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if a request card has approval steps configured
   */
  private async checkIfApprovalRequired(
    requestCardId: string,
  ): Promise<boolean> {
    if (!requestCardId) {
      this.logger.debug('No requestCardId provided, skipping approval check');
      return false;
    }

    const count = await this.approvalSteps.count({
      where: { requestCardId },
    });

    this.logger.debug(
      `Found ${count} approval step(s) for requestCardId: ${requestCardId}`,
    );

    return count > 0;
  }
}
