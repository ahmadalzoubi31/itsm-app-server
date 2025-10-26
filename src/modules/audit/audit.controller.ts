// src/modules/audit/admin/audit.controller.ts
import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, ILike } from 'typeorm';
import { AuditEvent } from './entities/audit-event.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/iam/auth/jwt.guard';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('Admin / Audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('admin/audit')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(
    @InjectRepository(AuditEvent) private repo: Repository<AuditEvent>,
  ) {
    this.logger.log('AuditController initialized');
  }

  @ApiOperation({ summary: 'List audit events' })
  @Get()
  async list(@Query() query: AuditQueryDto) {
    this.logger.log(
      `Listing audit events with query: ${JSON.stringify(query)}`,
    );
    const {
      q,
      type,
      aggType: aggregateType,
      aggId: aggregateId,
      actorId,
      from,
      to,
      page = 1,
      pageSize = 20,
    } = query;

    const where: FindOptionsWhere<AuditEvent> = {};
    if (type) where.type = type;
    if (aggregateType) where.aggregateType = aggregateType;
    if (aggregateId) (where as any).aggregateId = aggregateId;
    if (actorId) where.actorId = actorId;

    const dateRange =
      from && to ? { happenedAt: Between(new Date(from), new Date(to)) } : {};
    const filters = { ...where, ...dateRange };

    const skip = (page - 1) * pageSize;
    const [items, total] = await this.repo.findAndCount({
      where: q ? [{ ...filters, type: ILike(`%${q}%`) }] : filters,
      order: { happenedAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }
}
