import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestCreatedEvent } from '@shared/contracts/events';
import { Request } from '@modules/request/entities/request.entity';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import {
  ApprovalSteps,
  ApprovalStepsType,
} from '../entities/approval-step.entity';
import {
  ApprovalRequest,
  ApprovalStatus,
} from '../entities/approval-request.entity';
import { RequestStatus } from '@shared/constants';
import { User } from '@modules/iam/users/entities/user.entity';
import { Membership } from '@modules/iam/groups/entities/membership.entity';

/**
 * Listener that initiates approval workflow when a request is created
 */
@Injectable()
export class RequestApprovalListener {
  private readonly logger = new Logger(RequestApprovalListener.name);

  constructor(
    @InjectRepository(Request)
    private readonly requests: Repository<Request>,
    @InjectRepository(RequestCard)
    private readonly requestCards: Repository<RequestCard>,
    @InjectRepository(ApprovalSteps)
    private readonly approvalSteps: Repository<ApprovalSteps>,
    @InjectRepository(ApprovalRequest)
    private readonly approvals: Repository<ApprovalRequest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
  ) {
    this.logger.log('RequestApprovalListener initialized');
  }

  @OnEvent('request.created')
  async handleRequestCreated(event: RequestCreatedEvent) {
    const requestId = event.requestId;

    try {
      // Fetch the request with its card
      const request = await this.requests.findOne({
        where: { id: requestId },
        relations: ['requester', 'requestCard'],
      });

      if (!request) {
        this.logger.warn(`Request ${requestId} not found`);
        return;
      }

      // Check if request has a card and if card has approval steps
      if (!request.requestCardId) {
        this.logger.debug(
          `Request ${request.number} has no card, skipping approval workflow`,
        );
        return;
      }

      // Fetch approval steps for this card
      const approvalStepsList = await this.approvalSteps.find({
        where: { requestCardId: request.requestCardId },
        order: { order: 'ASC' },
        relations: ['user', 'group'],
      });

      if (!approvalStepsList || approvalStepsList.length === 0) {
        this.logger.debug(
          `Request ${request.number} has no approval steps configured, skipping approval workflow`,
        );
        return;
      }

      this.logger.log(
        `Initiating approval workflow for request ${request.number} with ${approvalStepsList.length} step(s)`,
      );

      // Update request status to WAITING_APPROVAL
      request.status = RequestStatus.WAITING_APPROVAL;
      await this.requests.save(request);

      // Create approval records for the first step only (sequential approval)
      const firstStep = approvalStepsList[0];
      await this.createApprovalsForStep(request, firstStep, 1);

      this.logger.log(
        `Approval workflow initiated for request ${request.number}, awaiting step 1 approval`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initiate approval workflow for request ${requestId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create approval records for a specific step
   */
  private async createApprovalsForStep(
    request: Request,
    step: ApprovalSteps,
    currentStep: number,
  ): Promise<void> {
    const approverIds: string[] = [];

    switch (step.type) {
      case ApprovalStepsType.DIRECT:
        // Direct user approval
        if (step.userId) {
          approverIds.push(step.userId);
        }
        break;

      case ApprovalStepsType.MANAGER:
        // Get requester's manager
        const managerId = await this.getRequesterManager(
          request.requesterId || '',
        );
        if (managerId) {
          approverIds.push(managerId);
        } else {
          this.logger.warn(
            `No manager found for requester ${request.requesterId}, skipping manager approval`,
          );
        }
        break;

      case ApprovalStepsType.GROUP:
        // Get all active members of the group
        if (step.groupId) {
          const members = await this.memberships.find({
            where: { groupId: step.groupId, isActive: true },
          });
          approverIds.push(...members.map((m) => m.userId));
        }
        break;
    }

    // Remove duplicates
    const uniqueApproverIds = [...new Set(approverIds)];

    if (uniqueApproverIds.length === 0) {
      this.logger.warn(
        `No approvers found for step ${currentStep} of request ${request.number}`,
      );
      return;
    }

    // Create approval records
    const approvals = uniqueApproverIds.map((approverId) =>
      this.approvals.create({
        requestId: request.id,
        approverId,
        status: ApprovalStatus.PENDING,
      }),
    );

    await this.approvals.save(approvals);

    this.logger.debug(
      `Created ${approvals.length} approval record(s) for step ${currentStep} of request ${request.number}`,
    );
  }

  /**
   * Get requester's manager from metadata
   */
  private async getRequesterManager(
    requesterId: string,
  ): Promise<string | null> {
    const requester = await this.users.findOne({
      where: { id: requesterId },
      select: ['id', 'username', 'metadata'],
    });

    if (!requester?.metadata?.manager) {
      return null;
    }

    // Find manager by username
    const manager = await this.users.findOne({
      where: { username: requester.metadata.manager },
      select: ['id'],
    });

    return manager?.id || null;
  }
}
