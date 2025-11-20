// src/modules/approval/approval.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApprovalRequest,
  ApprovalStatus,
} from './entities/approval-request.entity';
import {
  ApprovalSteps,
  ApprovalStepsType,
} from './entities/approval-step.entity';
import { Request } from '@modules/request/entities/request.entity';
import { RequestStatus } from '@shared/constants';
import { RequestCard } from '@modules/catalog/entities/request-card.entity';
import { User } from '@modules/iam/users/entities/user.entity';
import { Membership } from '@modules/iam/groups/entities/membership.entity';
import { CreateApprovalStepsDto } from './dto/approval-step.dto';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectRepository(ApprovalRequest)
    private approvals: Repository<ApprovalRequest>,
    @InjectRepository(ApprovalSteps)
    private approvalSteps: Repository<ApprovalSteps>,
    @InjectRepository(Request)
    private requests: Repository<Request>,
    @InjectRepository(RequestCard)
    private requestCards: Repository<RequestCard>,
    @InjectRepository(User)
    private users: Repository<User>,
    @InjectRepository(Membership)
    private memberships: Repository<Membership>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== Approval Step Management ====================

  /**
   * Create approval steps for a request card
   */
  async createApprovalSteps(
    requestCardId: string,
    steps: CreateApprovalStepsDto[],
  ): Promise<ApprovalSteps[]> {
    this.logger.debug(
      `Creating ${steps.length} approval steps for request card ${requestCardId}`,
    );

    const approvalSteps = steps.map((step) => {
      const approvalStep = this.approvalSteps.create({
        requestCardId,
        order: step.order,
        type: step.type,
        userId: step.userId,
        groupId: step.groupId,
        requireAll: step.requireAll,
      });
      return approvalStep;
    });

    const saved = await this.approvalSteps.save(approvalSteps);
    this.logger.debug(`Successfully saved ${saved.length} approval steps`);
    return saved;
  }

  /**
   * Get approval steps for a request card
   */
  async getApprovalSteps(requestCardId: string): Promise<ApprovalSteps[]> {
    return this.approvalSteps.find({
      where: { requestCardId },
      order: { order: 'ASC' },
      relations: ['user', 'group'],
    });
  }

  /**
   * Delete all approval steps for a request card
   */
  async deleteApprovalSteps(requestCardId: string): Promise<void> {
    await this.approvalSteps.delete({ requestCardId });
    this.logger.debug(
      `Deleted all approval steps for request card ${requestCardId}`,
    );
  }

  /**
   * Replace approval steps for a request card
   */
  async replaceApprovalSteps(
    requestCardId: string,
    steps: CreateApprovalStepsDto[],
  ): Promise<ApprovalSteps[]> {
    // Delete existing approval steps
    await this.deleteApprovalSteps(requestCardId);

    // Create new approval steps
    if (steps && steps.length > 0) {
      return this.createApprovalSteps(requestCardId, steps);
    }

    return [];
  }

  // ==================== Request Approval Management ====================

  /**
   * List pending approvals for a user
   */
  async listPendingApprovals(userId: string) {
    // Get all pending approvals where user is the approver
    const directApprovals = await this.approvals.find({
      where: {
        approverId: userId,
        status: 'pending',
      },
      relations: ['request', 'request.requester', 'request.requestCard'],
      order: { createdAt: 'DESC' },
    });
    // Since we now create approval records upfront for all approvers in the listener,
    // we just return the direct approvals (no need for complex manager/group lookups)
    return directApprovals;
  }

  /**
   * Approve a request
   */
  async approveRequest(
    requestId: string,
    userId: string,
    justification?: string,
  ) {
    const approvalRequest = await this.approvals.findOne({
      where: {
        requestId,
        approverId: userId,
        status: 'pending',
      },
      relations: ['request', 'request.requestCard'],
    });

    if (!approvalRequest) {
      throw new NotFoundException(
        'Pending approval not found for this request and user',
      );
    }

    // Update approval record
    approvalRequest.status = ApprovalStatus.APPROVED;
    approvalRequest.approvedAt = new Date();
    if (justification) {
      approvalRequest.justification = justification;
    }
    await this.approvals.save(approvalRequest);

    this.logger.log(
      `Approval granted for request ${requestId} by user ${userId}`,
    );

    // Check if all approvals are complete
    await this.checkApprovalCompletion(requestId);

    return approvalRequest;
  }

  /**
   * Check if all approvals are complete and route to case if done
   */
  private async checkApprovalCompletion(requestId: string): Promise<void> {
    const request = await this.requests.findOne({
      where: { id: requestId },
      relations: ['requestCard'],
    });

    if (!request) {
      return;
    }

    // Get all approvals for this request
    const allApprovals = await this.approvals.find({
      where: { requestId },
    });

    if (allApprovals.length === 0) {
      return;
    }

    // Check if all approvals are complete (all approved)
    const allApproved = allApprovals.every(
      (approval) => approval.status === ApprovalStatus.APPROVED,
    );

    // Check if any approval was rejected
    const anyRejected = allApprovals.some(
      (approval) => approval.status === ApprovalStatus.REJECTED,
    );

    if (anyRejected) {
      // If any approval is rejected, mark request as rejected
      request.status = RequestStatus.CLOSED;
      await this.requests.save(request);

      this.logger.log(
        `Request ${request.number} rejected during approval process`,
      );
      return;
    }

    if (allApproved) {
      // All approvals complete - emit event to trigger routing to case
      this.logger.log(
        `All approvals complete for request ${request.number}, triggering routing to case...`,
      );

      // Emit event that will be handled by request service to route to case
      this.eventEmitter.emit('request.approved', {
        requestId: request.id,
        requestNumber: request.number,
      });
    }
  }

  /**
   * Check if an approval step is complete
   */
  private isApprovalStepComplete(
    approvals: ApprovalRequest[],
    requireAll: boolean,
  ): boolean {
    if (approvals.length === 0) {
      return false;
    }

    if (requireAll) {
      // All approvers must approve
      return approvals.every((a) => a.status === ApprovalStatus.APPROVED);
    } else {
      // At least one approval is enough
      return approvals.some((a) => a.status === ApprovalStatus.APPROVED);
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
        status: 'pending',
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

  /**
   * Reject a request
   */
  async rejectRequest(
    requestId: string,
    userId: string,
    justification: string,
  ) {
    if (!justification || justification.trim().length === 0) {
      throw new BadRequestException('Justification is required for rejection');
    }

    const approvalRequest = await this.approvals.findOne({
      where: {
        requestId,
        approverId: userId,
        status: 'pending',
      },
      relations: ['request'],
    });

    if (!approvalRequest) {
      throw new NotFoundException(
        'Pending approval not found for this request and user',
      );
    }

    // Update approval record
    approvalRequest.status = ApprovalStatus.REJECTED;
    approvalRequest.rejectedAt = new Date();
    approvalRequest.justification = justification;
    await this.approvals.save(approvalRequest);

    // Reject the request - close it with resolution
    const request = approvalRequest.request;
    request.status = RequestStatus.CLOSED;
    request.resolution = `Request rejected: ${justification}`;
    request.resolvedAt = new Date();
    await this.requests.save(request);

    return approvalRequest;
  }
}
