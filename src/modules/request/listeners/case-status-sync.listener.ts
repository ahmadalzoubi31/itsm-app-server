import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from '../entities/request.entity';
import { CaseStatusChangedEvent } from '@shared/contracts/events';
import { CaseStatus } from '@shared/constants/case-status.constants';
import { RequestStatus } from '@shared/constants/request-status.constants';

/**
 * Maps Case status to Request status
 */
function mapCaseStatusToRequestStatus(caseStatus: CaseStatus): RequestStatus | null {
  const statusMap: Record<CaseStatus, RequestStatus> = {
    [CaseStatus.NEW]: RequestStatus.SUBMITTED,
    [CaseStatus.WAITING_APPROVAL]: RequestStatus.WAITING_APPROVAL,
    [CaseStatus.IN_PROGRESS]: RequestStatus.IN_PROGRESS,
    [CaseStatus.PENDING]: RequestStatus.ASSIGNED, // Pending case -> Assigned request
    [CaseStatus.RESOLVED]: RequestStatus.RESOLVED,
    [CaseStatus.CLOSED]: RequestStatus.CLOSED,
  };

  return statusMap[caseStatus] || null;
}

@Injectable()
export class CaseStatusSyncListener {
  private readonly logger = new Logger(CaseStatusSyncListener.name);

  constructor(
    @InjectRepository(Request)
    private readonly requests: Repository<Request>,
  ) {
    this.logger.log('CaseStatusSyncListener initialized');
  }

  @OnEvent('case.status.changed')
  async handleCaseStatusChanged(event: CaseStatusChangedEvent) {
    const caseId = event.caseId;
    const newCaseStatus = event.payload.after?.status as CaseStatus;

    if (!newCaseStatus) {
      this.logger.warn(
        `Case status changed event missing new status for case ${caseId}`,
      );
      return;
    }

    const newRequestStatus = mapCaseStatusToRequestStatus(newCaseStatus);

    if (!newRequestStatus) {
      this.logger.warn(
        `No mapping found for case status ${newCaseStatus} to request status`,
      );
      return;
    }

    try {
      // Find all requests linked to this case
      const linkedRequests = await this.requests.find({
        where: { linkedCaseId: caseId },
      });

      if (linkedRequests.length === 0) {
        this.logger.debug(
          `No requests linked to case ${caseId}, skipping status sync`,
        );
        return;
      }

      this.logger.log(
        `Syncing status for ${linkedRequests.length} request(s) linked to case ${caseId}: ${newCaseStatus} -> ${newRequestStatus}`,
      );

      // Update all linked requests
      for (const request of linkedRequests) {
        // Only update if status is different to avoid unnecessary updates
        if (request.status !== newRequestStatus) {
          const oldStatus = request.status;
          request.status = newRequestStatus;

          // Set resolvedAt if status is Resolved
          if (newRequestStatus === RequestStatus.RESOLVED && !request.resolvedAt) {
            request.resolvedAt = new Date();
          }

          await this.requests.save(request);

          this.logger.log(
            `Request ${request.number} status synced: ${oldStatus} -> ${newRequestStatus} (from case ${caseId})`,
          );
        } else {
          this.logger.debug(
            `Request ${request.number} already has status ${newRequestStatus}, skipping update`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync request status for case ${caseId}: ${error.message}`,
        error.stack,
      );
    }
  }
}

