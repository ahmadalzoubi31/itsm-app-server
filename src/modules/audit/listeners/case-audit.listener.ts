import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../audit.service';
import {
  CaseCreatedEvent,
  CaseStatusChangedEvent,
  CaseAssignedEvent,
  CaseGroupAssignedEvent,
} from '@shared/contracts/events';

@Injectable()
export class CaseAuditListener {
  private readonly logger = new Logger(CaseAuditListener.name);

  constructor(private readonly auditSvc: AuditService) {
    this.logger.log('CaseAuditListener initialized');
  }

  @OnEvent('case.created')
  async handleCaseCreated(event: CaseCreatedEvent) {
    this.logger.debug(`Recording audit event for case.created: ${event.caseId}`);
    try {
      const payload = event.payload as any;
      await this.auditSvc.append({
        type: 'case.created',
        aggregateType: 'Case',
        aggregateId: event.caseId,
        actorId: payload.createdById || undefined,
        actorName: payload.createdByName || undefined,
        data: {
          title: payload.title,
          description: payload.description,
          businessLineId: event.payload.businessLineId,
          priority: event.payload.priority,
          requesterId: event.payload.requesterId,
          assignmentGroupId: payload.assignmentGroupId,
          assigneeId: payload.assigneeId,
          affectedServiceId: payload.affectedServiceId,
          requestCardId: payload.requestCardId,
        },
        source: 'bus',
      });
    } catch (error) {
      this.logger.error(`Failed to record case.created audit event: ${error.message}`);
    }
  }

  @OnEvent('case.assigned')
  async handleCaseAssigned(event: CaseAssignedEvent) {
    this.logger.debug(`Recording audit event for case.assigned: ${event.caseId}`);
    try {
      await this.auditSvc.append({
        type: 'case.assigned',
        aggregateType: 'Case',
        aggregateId: event.caseId,
        actorId: event.payload.assigneeId,
        actorName: event.payload.assigneeName,
        data: {
          assigneeId: event.payload.assigneeId,
          assigneeName: event.payload.assigneeName,
        },
        source: 'bus',
      });
    } catch (error) {
      this.logger.error(`Failed to record case.assigned audit event: ${error.message}`);
    }
  }

  @OnEvent('case.group.assigned')
  async handleCaseGroupAssigned(event: CaseGroupAssignedEvent) {
    this.logger.debug(`Recording audit event for case.group.assigned: ${event.caseId}`);
    try {
      await this.auditSvc.append({
        type: 'case.group.assigned',
        aggregateType: 'Case',
        aggregateId: event.caseId,
        data: {
          groupId: event.payload.groupId,
        },
        source: 'bus',
      });
    } catch (error) {
      this.logger.error(`Failed to record case.group.assigned audit event: ${error.message}`);
    }
  }

  @OnEvent('case.status.changed')
  async handleCaseStatusChanged(event: CaseStatusChangedEvent) {
    this.logger.debug(`Recording audit event for case.status.changed: ${event.caseId}`);
    try {
      await this.auditSvc.append({
        type: 'case.status.changed',
        aggregateType: 'Case',
        aggregateId: event.caseId,
        actorId: event.payload.actor?.actorId,
        actorName: event.payload.actor?.actorName,
        data: {
          before: event.payload.before,
          after: event.payload.after,
        },
        source: 'bus',
      });
    } catch (error) {
      this.logger.error(`Failed to record case.status.changed audit event: ${error.message}`);
    }
  }

  @OnEvent('case.updated')
  async handleCaseUpdated(event: any) {
    this.logger.debug(`Recording audit event for case.updated: ${event.caseId}`);
    try {
      await this.auditSvc.append({
        type: 'case.updated',
        aggregateType: 'Case',
        aggregateId: event.caseId,
        actorId: event.payload.actor?.actorId,
        actorName: event.payload.actor?.actorName,
        data: {
          before: event.payload.before,
          after: event.payload.after,
        },
        source: 'bus',
      });
    } catch (error) {
      this.logger.error(`Failed to record case.updated audit event: ${error.message}`);
    }
  }
}

