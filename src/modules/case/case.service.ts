import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, FindOptionsWhere, In } from 'typeorm';
import { join } from 'path';
import { promises as fs } from 'fs';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Entities
import { Case } from './entities/case.entity';
import { CaseComment } from './entities/case-comment.entity';
import { CaseAttachment } from './entities/case-attachment.entity';

// DTOs
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCommentDto } from './dto/add-comment.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { AssignCaseDto } from './dto/assign-case.dto';

// Constants & Types
import { CaseStatus, CASE_STATUS_VALUES } from '@shared/constants';
import { JwtUser } from '@shared/types/jwt-user.type';

// Events
import {
  CaseCreatedEvent,
  CaseStatusChangedEvent,
  CaseAssignedEvent,
  CaseGroupAssignedEvent,
} from '@shared/contracts/events';

// Services
import { BusinessLineService } from '@modules/business-line/business-line.service';
import { AuditService } from '@modules/audit/audit.service';
import { SlaTimer } from '@modules/sla/entities/sla-timer.entity';

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);
  private readonly CASE_RELATIONS = [
    'requestCard',
    'businessLine',
    'assignee',
    'assignmentGroup',
    'requester',
  ];
  private readonly UPLOADS_DIR = join(process.cwd(), 'var', 'uploads');

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Case) private readonly cases: Repository<Case>,
    @InjectRepository(CaseComment)
    private readonly comments: Repository<CaseComment>,
    @InjectRepository(CaseAttachment)
    private readonly attachments: Repository<CaseAttachment>,
    @InjectRepository(SlaTimer)
    private readonly slaTimers: Repository<SlaTimer>,
    private readonly businessLineSvc: BusinessLineService,
    private readonly auditSvc: AuditService,
  ) {
    this.logger.log('CaseService initialized');
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Create a new case
   */
  async createCase(
    dto: CreateCaseDto & { createdById?: string; createdByName?: string },
  ): Promise<Case> {
    this.logger.log(
      `Creating case for business line ${dto.businessLineId} by ${dto.createdByName || 'Unknown'}`,
    );

    // Validate business line exists
    const businessLine = await this.businessLineSvc.findOne(dto.businessLineId);

    // Generate case number
    const caseNumber = await this.generateCaseNumber();

    // Create and save case
    const entity = this.cases.create({ ...dto, number: caseNumber });
    const saved = await this.cases.save(entity);

    this.logger.log(`Case ${saved.number} created successfully`);

    // Emit creation event
    this.emitCaseCreatedEvent(saved, businessLine.id);

    return saved;
  }

  /**
   * List cases with pagination and filtering
   */
  async listCases(q: ListCasesQuery) {
    const where = this.buildListCasesWhere(q);
    const order = {
      [q.sortBy!]: q.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
    } as any;
    const skip = (q.page - 1) * q.pageSize;

    const [items, total] = await this.cases.findAndCount({
      where,
      order,
      skip,
      take: q.pageSize,
      relations: this.CASE_RELATIONS,
    });

    // Fetch SLA timers for all cases
    const caseIds = items.map((c) => c.id);
    const timers =
      caseIds.length > 0
        ? await this.slaTimers.find({
            where: { caseId: In(caseIds) },
            relations: ['target'],
          })
        : [];

    // Group timers by caseId
    const timersByCaseId = new Map<string, typeof timers>();
    timers.forEach((timer) => {
      if (!timersByCaseId.has(timer.caseId)) {
        timersByCaseId.set(timer.caseId, []);
      }
      timersByCaseId.get(timer.caseId)!.push(timer);
    });

    // Attach timers to cases
    const itemsWithTimers = items.map((caseItem) => ({
      ...caseItem,
      slaTimers: timersByCaseId.get(caseItem.id) || [],
    }));

    return {
      items: itemsWithTimers,
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    };
  }

  /**
   * Get a case by ID or number
   */
  async getCase(id: string): Promise<Case & { slaTimers?: any[] }> {
    const caseEntity = await this.cases.findOne({
      where: [{ id }, { number: id }],
      relations: this.CASE_RELATIONS,
    });

    if (!caseEntity) {
      throw new NotFoundException(`Case not found with ID or number: ${id}`);
    }

    // Fetch SLA timers for this case
    const timers = await this.slaTimers.find({
      where: { caseId: caseEntity.id },
      relations: ['target'],
    });

    return {
      ...caseEntity,
      slaTimers: timers,
    };
  }

  /**
   * Get a case by its unique number
   */
  async getCaseByNumber(number: string): Promise<Case> {
    const caseEntity = await this.cases.findOne({
      where: { number },
      relations: this.CASE_RELATIONS,
    });

    if (!caseEntity) {
      throw new NotFoundException(`Case not found with number: ${number}`);
    }

    return caseEntity;
  }

  /**
   * Update a case with change tracking and event emission
   */
  async updateCase(id: string, dto: UpdateCaseDto): Promise<Case> {
    // Fetch without relations for update to avoid FK conflicts
    const caseEntity = await this.cases.findOne({ where: { id } });
    if (!caseEntity) {
      throw new NotFoundException(`Case not found with ID: ${id}`);
    }

    // Capture state before changes
    const previousState = this.captureCaseState(caseEntity);

    // Apply updates
    this.applyUpdateDto(caseEntity, dto);

    // Save changes
    const saved = await this.cases.save(caseEntity);

    // Emit events for specific changes
    this.emitUpdateEvents(saved, previousState, dto);

    // Return with relations loaded
    return await this.getCase(saved.id);
  }

  /**
   * Add a comment to a case
   */
  async addComment(
    caseId: string,
    dto: CreateCommentDto,
  ): Promise<CaseComment> {
    await this.getCase(caseId); // Ensure case exists

    const comment = this.comments.create({
      ...dto,
      caseId,
      isPrivate: dto.isPrivate ?? true, // Default to private
    });

    return await this.comments.save(comment);
  }

  /**
   * List comments for a case (with visibility control based on user role)
   */
  async listComments(caseId: string, userId?: string): Promise<CaseComment[]> {
    const caseEntity = await this.getCase(caseId);

    // Fetch case comments based on user permissions
    const caseComments = await this.getCaseComments(caseEntity, userId);

    // Fetch linked request comments
    const requestComments = await this.getLinkedRequestComments(caseEntity.id);

    // Combine and sort chronologically
    return [...caseComments, ...requestComments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  /**
   * Assign a case to a group and/or user
   */
  async assignCase(id: string, dto: AssignCaseDto): Promise<Case> {
    const caseEntity = await this.getCase(id);

    // Apply assignment
    if (dto.assigneeId !== undefined) {
      caseEntity.assigneeId = dto.assigneeId;
    }
    if (dto.assignmentGroupId !== undefined) {
      caseEntity.assignmentGroupId = dto.assignmentGroupId;
    }

    const saved = await this.cases.save(caseEntity);

    // Emit assignment events
    if (dto.assignmentGroupId) {
      this.eventEmitter.emit(
        'case.group.assigned',
        new CaseGroupAssignedEvent(saved.id, {
          groupId: dto.assignmentGroupId,
        }),
      );
    }

    if (dto.assigneeId) {
      this.eventEmitter.emit(
        'case.assigned',
        new CaseAssignedEvent(saved.id, {
          assigneeId: dto.assigneeId,
          assigneeName: dto.assigneeId,
        }),
      );
    }

    return saved;
  }

  /**
   * Change case status (with validation)
   */
  async changeStatus(id: string, newStatus: CaseStatus): Promise<Case> {
    const caseEntity = await this.getCase(id);
    const currentStatus = caseEntity.status;

    // Validate status transition
    this.validateStatusTransition(currentStatus, newStatus);

    // Update status
    caseEntity.status = newStatus;
    const saved = await this.cases.save(caseEntity);

    // Emit status change event
    this.emitStatusChangedEvent(saved, currentStatus, newStatus);

    return saved;
  }

  /**
   * Add an attachment to a case
   */
  async addAttachment(
    caseId: string,
    file: Express.Multer.File,
  ): Promise<CaseAttachment> {
    const caseEntity = await this.getCase(caseId);

    // Create upload directory
    const uploadDir = join(this.UPLOADS_DIR, caseEntity.id);
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const storagePath = join(uploadDir, file.filename);
    await fs.writeFile(storagePath, file.buffer);

    // Create attachment record
    const attachment = this.attachments.create({
      caseId: caseEntity.id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
    });

    return await this.attachments.save(attachment);
  }

  /**
   * List all attachments for a case
   */
  async listAttachments(caseId: string): Promise<CaseAttachment[]> {
    await this.getCase(caseId); // Ensure case exists

    return await this.attachments.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get the complete timeline of events for a case
   */
  async getCaseTimeline(caseId: string) {
    const caseEntity = await this.getCase(caseId);

    // Get all audit events
    const auditEvents = await this.auditSvc.findByAggregate('Case', caseId);

    // Fetch user and group lookup maps for name resolution
    const lookupMaps = await this.buildLookupMaps(auditEvents);

    // Build timeline from events with names
    const timeline = await this.buildTimelineFromEvents(
      caseEntity,
      auditEvents,
      lookupMaps,
    );

    // Sort chronologically with creation event first
    return this.sortTimeline(timeline);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Generate a unique case number
   */
  private async generateCaseNumber(): Promise<string> {
    const result = await this.cases.manager.query(
      "SELECT nextval('case_number_seq') as nextval",
    );
    const nextval = result[0].nextval;
    return `CS-${String(nextval).padStart(6, '0')}`;
  }

  /**
   * Build where clause for listing cases
   */
  private buildListCasesWhere(
    q: ListCasesQuery,
  ): FindOptionsWhere<Case> | FindOptionsWhere<Case>[] {
    const baseWhere: FindOptionsWhere<Case> = {};

    if (q.status) baseWhere.status = q.status;
    if (q.priority) baseWhere.priority = q.priority;
    if (q.businessLineId) baseWhere.businessLineId = q.businessLineId;

    // If search query exists, search across number and title
    if (q.q) {
      return [
        { ...baseWhere, number: ILike(`%${q.q}%`) },
        { ...baseWhere, title: ILike(`%${q.q}%`) },
      ];
    }

    return baseWhere;
  }

  /**
   * Capture current state of a case before updates
   */
  private captureCaseState(caseEntity: Case) {
    return {
      title: caseEntity.title,
      description: caseEntity.description,
      priority: caseEntity.priority,
      assigneeId: caseEntity.assigneeId,
      assignmentGroupId: caseEntity.assignmentGroupId,
      status: caseEntity.status,
    };
  }

  /**
   * Apply update DTO to case entity
   */
  private applyUpdateDto(caseEntity: Case, dto: UpdateCaseDto): void {
    if (dto.title !== undefined) caseEntity.title = dto.title;
    if (dto.description !== undefined) caseEntity.description = dto.description;
    if (dto.priority !== undefined) caseEntity.priority = dto.priority;
    if (dto.status !== undefined) caseEntity.status = dto.status;
    if (dto.assigneeId !== undefined) caseEntity.assigneeId = dto.assigneeId;
    if (dto.assignmentGroupId !== undefined) {
      caseEntity.assignmentGroupId = dto.assignmentGroupId;
    }
  }

  /**
   * Validate if a status transition is allowed
   */
  private validateStatusTransition(from: CaseStatus, to: CaseStatus): void {
    const allowedTransitions = new Map<string, Set<string>>([
      ['New', new Set(CASE_STATUS_VALUES)],
      ['InProgress', new Set(CASE_STATUS_VALUES.filter((s) => s !== 'New'))],
      ['Pending', new Set(CASE_STATUS_VALUES.filter((s) => s !== 'New'))],
      [
        'Resolved',
        new Set(
          CASE_STATUS_VALUES.filter(
            (s) => s !== 'New' && s !== 'WaitingApproval' && s !== 'Pending',
          ),
        ),
      ],
    ]);

    const isAllowed = allowedTransitions.get(from)?.has(to) ?? false;

    if (!isAllowed) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  /**
   * Get case comments based on user role and permissions
   */
  private async getCaseComments(
    caseEntity: Case,
    userId?: string,
  ): Promise<CaseComment[]> {
    // No user ID provided - return all comments
    if (!userId || !caseEntity.requesterId) {
      return await this.comments.find({
        where: { caseId: caseEntity.id },
        order: { createdAt: 'ASC' },
      });
    }

    // Check if user is the requester
    const isRequester = caseEntity.requesterId === userId;

    if (isRequester) {
      // Requester only sees public comments
      return await this.comments.find({
        where: { caseId: caseEntity.id, isPrivate: false },
        order: { createdAt: 'ASC' },
      });
    }

    // Staff/agents see all comments
    return await this.comments.find({
      where: { caseId: caseEntity.id },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get comments from linked request
   */
  private async getLinkedRequestComments(caseId: string): Promise<any[]> {
    const requestComments = await this.comments.manager.query(
      `SELECT 
        rc.id, 
        rc.body, 
        rc."isPrivate",
        rc."createdAt",
        rc."createdById",
        rc."createdByName"
      FROM request_comment rc
      INNER JOIN request r ON r.id = rc."requestId"
      WHERE r."linkedCaseId" = $1
      ORDER BY rc."createdAt" ASC`,
      [caseId],
    );

    return requestComments.map((rc: any) => ({
      id: rc.id,
      body: rc.body,
      isPrivate: rc.isPrivate,
      createdAt: rc.createdAt,
      createdById: rc.createdById,
      createdByName: rc.createdByName,
    }));
  }

  /**
   * Build lookup maps for users and groups from audit events
   */
  private async buildLookupMaps(auditEvents: any[]): Promise<{
    users: Map<string, string>;
    groups: Map<string, string>;
  }> {
    const userIds = new Set<string>();
    const groupIds = new Set<string>();

    // Extract all user and group IDs from events
    auditEvents.forEach((event) => {
      const data = event.data || {};
      if (data.before?.assigneeId) userIds.add(data.before.assigneeId);
      if (data.after?.assigneeId) userIds.add(data.after.assigneeId);
      if (data.before?.assignmentGroupId)
        groupIds.add(data.before.assignmentGroupId);
      if (data.after?.assignmentGroupId)
        groupIds.add(data.after.assignmentGroupId);
    });

    // Fetch users and groups in parallel
    const [users, groups] = await Promise.all([
      userIds.size > 0
        ? this.cases.manager.query(
            `SELECT id, "displayName", username FROM "user" WHERE id = ANY($1)`,
            [Array.from(userIds)],
          )
        : Promise.resolve([]),
      groupIds.size > 0
        ? this.cases.manager.query(
            `SELECT id, name FROM "group" WHERE id = ANY($1)`,
            [Array.from(groupIds)],
          )
        : Promise.resolve([]),
    ]);

    // Build lookup maps
    const userMap = new Map<string, string>();
    users.forEach((u: any) => {
      userMap.set(u.id, u.displayName || u.username);
    });

    const groupMap = new Map<string, string>();
    groups.forEach((g: any) => {
      groupMap.set(g.id, g.name);
    });

    return { users: userMap, groups: groupMap };
  }

  /**
   * Build timeline from audit events
   */
  private buildTimelineFromEvents(
    caseEntity: Case,
    auditEvents: any[],
    lookupMaps: { users: Map<string, string>; groups: Map<string, string> },
  ) {
    const timeline: any[] = [];

    // Add creation event if not in audit log
    const hasCreationEvent = auditEvents.some((e) => e.type === 'case.created');
    if (!hasCreationEvent) {
      timeline.push(this.createTimelineCreationEvent(caseEntity));
    }

    // Transform audit events to timeline format
    const eventTimeline = auditEvents.map((event) =>
      this.transformAuditEventToTimeline(event, lookupMaps),
    );

    return [...timeline, ...eventTimeline];
  }

  /**
   * Create a timeline event for case creation
   */
  private createTimelineCreationEvent(caseEntity: Case) {
    return {
      id: `created-${caseEntity.id}`,
      type: 'case.created',
      title: 'Case Created',
      description: `Case "${caseEntity.title}" created`,
      timestamp: caseEntity.createdAt,
      actorId: caseEntity.createdById,
      actorName: caseEntity.createdByName,
      data: {
        title: caseEntity.title,
        description: caseEntity.description,
        priority: caseEntity.priority,
        businessLineId: caseEntity.businessLineId,
        requesterId: caseEntity.requesterId,
        assignmentGroupId: caseEntity.assignmentGroupId,
        assigneeId: caseEntity.assigneeId,
      },
    };
  }

  /**
   * Transform an audit event into a timeline entry
   */
  private transformAuditEventToTimeline(
    event: any,
    lookupMaps: { users: Map<string, string>; groups: Map<string, string> },
  ) {
    let title = '';
    let description = '';

    switch (event.type) {
      case 'case.created':
        ({ title, description } = this.formatCreatedEvent(event));
        break;
      case 'case.assigned':
        title = 'Case Assigned';
        const assigneeName =
          event.data?.assigneeName ||
          lookupMaps.users.get(event.data?.assigneeId) ||
          event.actorName ||
          'Unknown';
        description = `Assigned to ${assigneeName}`;
        break;
      case 'case.group.assigned':
        title = 'Assignment Group Changed';
        const groupName =
          lookupMaps.groups.get(event.data?.groupId) || 'Unknown Group';
        description = `Assigned to ${groupName}`;
        break;
      case 'case.status.changed':
        title = 'Status Changed';
        description = `Status changed from ${event.data?.before?.status || 'Unknown'} to ${event.data?.after?.status || 'Unknown'}`;
        break;
      case 'case.updated':
        ({ title, description } = this.formatUpdatedEvent(event, lookupMaps));
        break;
      default:
        title = event.type
          .replace('case.', '')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        description = event.actorName ? `By ${event.actorName}` : '';
    }

    return {
      id: event.id,
      type: event.type,
      title,
      description,
      timestamp: event.happenedAt,
      actorId: event.actorId,
      actorName: event.actorName,
      data: event.data,
    };
  }

  /**
   * Format created event details
   */
  private formatCreatedEvent(event: any) {
    const data = event.data || {};
    const details: string[] = [];

    if (data.title) details.push(`"${data.title}"`);
    if (data.priority) details.push(`Priority: ${data.priority}`);
    if (data.description) {
      const desc = data.description.substring(0, 50);
      details.push(
        `Description: ${desc}${data.description.length > 50 ? '...' : ''}`,
      );
    }

    return {
      title: 'Case Created',
      description:
        details.length > 0
          ? `Created by ${event.actorName || 'Unknown'}. ${details.join(', ')}`
          : `Created by ${event.actorName || 'Unknown'}`,
    };
  }

  /**
   * Format updated event details
   */
  private formatUpdatedEvent(
    event: any,
    lookupMaps: { users: Map<string, string>; groups: Map<string, string> },
  ) {
    const data = event.data || {};
    const details: string[] = [];

    if (data.before?.priority !== data.after?.priority) {
      details.push(
        `Priority: ${data.before?.priority} → ${data.after?.priority}`,
      );
    }
    if (data.before?.title !== data.after?.title) {
      details.push('Title updated');
    }
    if (data.before?.description !== data.after?.description) {
      details.push('Description updated');
    }
    if (data.before?.assigneeId !== data.after?.assigneeId) {
      const beforeName = data.before?.assigneeId
        ? lookupMaps.users.get(data.before.assigneeId) || data.before.assigneeId
        : 'Unassigned';
      const afterName = data.after?.assigneeId
        ? lookupMaps.users.get(data.after.assigneeId) || data.after.assigneeId
        : 'Unassigned';
      details.push(`Assignee: ${beforeName} → ${afterName}`);
    }
    if (data.before?.assignmentGroupId !== data.after?.assignmentGroupId) {
      const beforeGroup = data.before?.assignmentGroupId
        ? lookupMaps.groups.get(data.before.assignmentGroupId) ||
          data.before.assignmentGroupId
        : 'None';
      const afterGroup = data.after?.assignmentGroupId
        ? lookupMaps.groups.get(data.after.assignmentGroupId) ||
          data.after.assignmentGroupId
        : 'None';
      details.push(`Group: ${beforeGroup} → ${afterGroup}`);
    }

    return {
      title: 'Case Updated',
      description:
        details.length > 0
          ? `Updated by ${event.actorName || 'Unknown'}. ${details.join(', ')}`
          : `Updated by ${event.actorName || 'Unknown'}`,
    };
  }

  /**
   * Sort timeline with newest events first, creation event last
   */
  private sortTimeline(timeline: any[]) {
    return timeline.sort((a, b) => {
      // Creation event always last (oldest event)
      if (a.type === 'case.created' && b.type !== 'case.created') return 1;
      if (b.type === 'case.created' && a.type !== 'case.created') return -1;
      // Otherwise sort by timestamp descending (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  // ==================== EVENT EMISSION HELPERS ====================

  /**
   * Emit case created event
   */
  private emitCaseCreatedEvent(caseEntity: Case, businessLineId: string): void {
    this.eventEmitter.emit(
      'case.created',
      new CaseCreatedEvent(caseEntity.id, {
        businessLineId,
        priority: caseEntity.priority,
        requesterId: caseEntity.requesterId as string,
        createdAt: caseEntity.createdAt.toISOString(),
        createdById: caseEntity.createdById,
        createdByName: caseEntity.createdByName,
        title: caseEntity.title,
        description: caseEntity.description,
        assignmentGroupId: caseEntity.assignmentGroupId,
        assigneeId: caseEntity.assigneeId,
        affectedServiceId: caseEntity.affectedServiceId,
        requestCardId: caseEntity.requestCardId,
      } as any),
    );
  }

  /**
   * Emit update events based on what changed
   */
  private emitUpdateEvents(
    savedCase: Case,
    previousState: any,
    dto: UpdateCaseDto,
  ): void {
    // Emit specific status change event if status changed
    if (dto.status !== undefined && dto.status !== previousState.status) {
      this.emitStatusChangedEvent(savedCase, previousState.status, dto.status);
    }

    // Emit general update event
    this.eventEmitter.emit('case.updated', {
      caseId: savedCase.id,
      payload: {
        before: previousState,
        after: {
          title: savedCase.title,
          description: savedCase.description,
          priority: savedCase.priority,
          assigneeId: savedCase.assigneeId,
          assignmentGroupId: savedCase.assignmentGroupId,
          status: savedCase.status,
        },
        actor: {
          actorId: savedCase.updatedById,
          actorName: savedCase.updatedByName,
        },
        updatedAt: savedCase.updatedAt.toISOString(),
      },
    });
  }

  /**
   * Emit status changed event
   */
  private emitStatusChangedEvent(
    caseEntity: Case,
    oldStatus: CaseStatus,
    newStatus: CaseStatus,
  ): void {
    this.eventEmitter.emit(
      'case.status.changed',
      new CaseStatusChangedEvent(caseEntity.id, {
        before: { status: oldStatus },
        after: { status: newStatus },
        actor: {
          actorId:
            caseEntity.updatedById || (caseEntity.assigneeId as string) || '',
          actorName:
            caseEntity.updatedByName || (caseEntity.assigneeId as string) || '',
        },
        updatedAt: caseEntity.updatedAt.toISOString(),
      }),
    );
  }
}
