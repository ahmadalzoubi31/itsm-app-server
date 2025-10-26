import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Case } from './entities/case.entity';
import { CaseComment } from './entities/case-comment.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCommentDto } from './dto/add-comment.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { JwtUser } from '@shared/types/jwt-user.type';
import { CaseStatus } from '@shared/constants';
import { CASE_STATUS_VALUES } from '@shared/constants';
import { AssignCaseDto } from './dto/assign-case.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { CaseAttachment } from './entities/case-attachment.entity';
import { BusinessLineService } from '@modules/business-line/business-line.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CaseCreatedEvent,
  CaseStatusChangedEvent,
  CaseAssignedEvent,
  CaseGroupAssignedEvent,
} from '@shared/contracts/events';

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(CaseComment) private comments: Repository<CaseComment>,
    @InjectRepository(CaseAttachment)
    private attachments: Repository<CaseAttachment>,
    private readonly businessLineSvc: BusinessLineService,
  ) {
    this.logger.log('CaseService initialized');
  }

  async createCase(
    dto: CreateCaseDto & { createdById?: string; createdByName?: string },
  ) {
    this.logger.log(
      `Creating case for business line ${dto.businessLineId} by ${dto.createdByName}`,
    );
    // Validate business line exists
    const businessLine = await this.businessLineSvc.findOne(dto.businessLineId);

    const result = await this.cases.manager.query(
      "SELECT nextval('case_number_seq') as nextval",
    );
    const nextval = result[0].nextval;
    const number = `CS-${String(nextval).padStart(6, '0')}`;
    const entity = this.cases.create({ ...dto, number });
    const saved = await this.cases.save(entity);

    this.logger.log(`Case ${saved.number} created successfully`);

    this.eventEmitter.emit(
      'case.created',
      new CaseCreatedEvent(saved.id, {
        businessLineId: businessLine.id,
        priority: saved.priority,
        requesterId: saved.requesterId as string,
        createdAt: saved.createdAt.toISOString(),
      }),
    );

    return saved;
  }

  async listCases(q: ListCasesQuery, user: JwtUser) {
    const where: any = {};

    // Apply role-based filter
    const canSeeAll = ['agent', 'admin'].includes(user.role);
    if (!canSeeAll) {
      where.requesterId = user.userId;
    }

    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    if (q.businessLineId) where.businessLineId = q.businessLineId;

    const findOpts: any = {
      where,
      order: {
        [q.sortBy!]: q.sortDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    };

    // simple search across number/title
    if (q.q) {
      findOpts.where = [
        { ...where, number: ILike(`%${q.q}%`) },
        { ...where, title: ILike(`%${q.q}%`) },
      ];
    }

    const [items, total] = await this.cases.findAndCount(findOpts);

    return {
      items,
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    };
  }

  async getCase(id: string) {
    const c = await this.cases.findOne({ where: [{ id }, { number: id }] });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  async getCaseByNumber(number: string) {
    const c = await this.cases.findOne({ where: { number } });
    if (!c) throw new NotFoundException(`Case not found with number ${number}`);
    return c;
  }

  async updateCase(
    id: string,
    dto: UpdateCaseDto & { updatedById?: string; updatedByName?: string },
  ) {
    const before = await this.getCase(id);

    // Patch for TypeORM partial update: status may need to be { status: value }
    // If status is being changed (exists in dto), ensure correct format
    let updateDto = { ...dto } as any;
    if (dto.status !== undefined) {
      // Only set if status is being patched
      updateDto.status = dto.status;
    }

    await this.cases.update(id, updateDto);
    const updated = await this.getCase(id);

    return updated;
  }

  async addComment(
    caseId: string,
    dto: CreateCommentDto & { createdById?: string; createdByName?: string },
  ) {
    const c = this.comments.create({ ...dto, caseId });
    const saved = await this.comments.save(c);

    return saved;
  }

  async listComments(caseId: string) {
    return this.comments.find({
      where: { caseId },
      order: { createdAt: 'ASC' },
    });
  }

  async assignCase(
    id: string,
    dto: AssignCaseDto,
    actor: { actorId: string; actorName: string },
  ) {
    const entity = await this.getCase(id);
    const prev = {
      assigneeId: entity.assigneeId,
      assignmentGroupId: entity.assignmentGroupId,
    };

    if (dto.assigneeId) entity.assigneeId = dto.assigneeId;
    if (dto.assignmentGroupId) entity.assignmentGroupId = dto.assignmentGroupId;

    const saved = await this.cases.save(entity);

    this.eventEmitter.emit(
      'case.group.assigned',
      new CaseGroupAssignedEvent(saved.id, {
        groupId: dto.assignmentGroupId,
      }),
    );

    if (dto.assigneeId) {
      this.eventEmitter.emit(
        'case.assigned',
        new CaseAssignedEvent(saved.id, {
          assigneeId: dto.assigneeId,
          assigneeName: actor.actorName,
        }),
      );
    }

    return saved;
  }

  async changeStatus(
    id: string,
    to: CaseStatus,
    actor: { actorId: string; actorName: string },
  ) {
    const entity = await this.getCase(id);
    const from = entity.status as any;

    const allowedTransitions = new Map([
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
      throw new BadRequestException(`Invalid transition ${from} → ${to}`);
    }

    entity.status = to;
    const saved = await this.cases.save(entity);

    this.eventEmitter.emit(
      'case.status.changed',
      new CaseStatusChangedEvent(saved.id, {
        before: { status: from },
        after: { status: to },
        actor: { actorId: actor.actorId, actorName: actor.actorName },
        updatedAt: saved.updatedAt.toISOString(),
      }),
    );
  }

  async addAttachment(
    caseId: string,
    file: Express.Multer.File,
    actor: { actorId: string; actorName: string },
  ) {
    const c = await this.getCase(caseId);
    const dir = join(process.cwd(), 'var', 'uploads', c.id);
    await fs.mkdir(dir, { recursive: true });
    const storagePath = join(dir, file.filename);
    await fs.writeFile(storagePath, file.buffer);
    const row = this.attachments.create({
      caseId: c.id,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
      createdById: actor.actorId,
      createdByName: actor.actorName,
    });
    const saved = await this.attachments.save(row);

    return saved;
  }

  async listAttachments(caseId: string) {
    const c = await this.getCase(caseId);
    return this.attachments.find({
      where: { caseId: c.id },
      order: { createdAt: 'DESC' },
    });
  }
}
