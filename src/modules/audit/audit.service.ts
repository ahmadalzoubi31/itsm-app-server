import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEvent) private repo: Repository<AuditEvent>,
  ) {
    this.logger.log('AuditService initialized');
  }

  async append(e: Partial<AuditEvent>) {
    this.logger.debug(
      `Appending audit event: ${e.type} for ${e.aggregateType}:${e.aggregateId}`,
    );

    // Validate required fields before saving
    if (!e.aggregateId) {
      this.logger.error(
        `Cannot save audit event without aggregateId. Event type: ${e.type}`,
      );
      throw new Error(
        `Audit event missing required field 'aggregateId' for event type ${e.type}`,
      );
    }

    // keep payloads small; do not store secrets/PII
    return this.repo.save(this.repo.create(e));
  }

  async findByAggregate(aggregateType: string, aggregateId: string) {
    return this.repo.find({
      where: {
        aggregateType,
        aggregateId,
      },
      order: {
        happenedAt: 'DESC',
      },
    });
  }
}
