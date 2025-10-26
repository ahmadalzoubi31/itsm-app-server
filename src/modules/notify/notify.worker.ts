// src/modules/notify/services/notify.worker.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Case } from '@modules/case/entities/case.entity';
import { UsersService } from '@modules/iam/users/users.service';
import { CaseService } from '@modules/case/case.service';
import { TemplateService } from '@modules/email/core/template/template.service';
import { EmailSenderService } from '@modules/email/core/senders/email-sender.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CaseCreatedEvent, SlaBreachedEvent } from '@shared/contracts/events';

@Injectable()
export class NotifyWorker {
  private readonly logger = new Logger('NotifyWorker');
  private readonly emailRateLimit = new Map<string, number>();
  private readonly RATE_LIMIT_MS = 10000; // 10 seconds between emails

  constructor(
    private readonly usersService: UsersService,
    private readonly casesService: CaseService,
    private readonly emailService: EmailSenderService,
    private readonly templateService: TemplateService,
    private readonly eventService: EventEmitter2,
  ) {}

  async handleCaseCreated(payload: CaseCreatedEvent) {
    try {
      const { caseId } = payload;
      const { requesterId, businessLineId, priority, createdAt } =
        payload.payload;

      // Critical: Validate payload before processing
      if (!caseId) {
        this.logger.warn(
          'Received case.created event with invalid payload - missing case ID',
        );
        return;
      }

      const c = await this.casesService.getCase(caseId);
      this.logger.debug(`Processing case.created for case ${c.id}`);

      const requester = await this.usersService.getUser(requesterId);

      if (!requester) {
        this.logger.warn(
          `No user found for requester ${requesterId} in case ${c.id}`,
        );
        return;
      }

      if (!requester?.email) {
        this.logger.warn(
          `No email found for requester ${requesterId} in case ${c.id}`,
        );
        return;
      }

      const { subject, html } = await this.templateService.render(
        businessLineId,
        'case.created',
        { case: c, payload: payload.payload },
      );

      await this.emailService.sendForBL(
        businessLineId,
        requester.email,
        subject,
        html,
      );

      this.logger.log(
        `Case created notification sent to ${requester.email} for case ${c.id} (${c.number})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send case.created notification: ${error}`);
      throw error;
    }
  }

  async handleCaseAssigned(event: { type: 'case.assigned'; payload: any }) {
    try {
      const { assigneeId, prevAssigneeId, id: caseId } = event.payload;

      if (!assigneeId || assigneeId === prevAssigneeId) {
        this.logger.debug(
          `Skipping case assignment notification - no valid assignee change`,
        );
        return;
      }

      const c = await this.casesService.getCase(caseId);
      const assignee = await this.usersService.getUser(assigneeId);

      if (!assignee?.email) {
        this.logger.warn(
          `No email found for assignee ${assigneeId} in case ${c.id}`,
        );
        return;
      }

      const { subject, html } = await this.templateService.render(
        (c as any).businessLineId,
        'case.assigned',
        { case: c, payload: event.payload },
      );

      await this.emailService.sendForBL(
        (c as any).businessLineId,
        assignee.email,
        subject,
        html,
      );

      this.logger.log(`Case assignment notification sent to ${assignee.email}`);
    } catch (error) {
      this.logger.error(`Failed to send case.assigned notification: ${error}`);
      throw error; // Re-throw to fail outbox processing
    }
  }

  async handleCaseGroupAssigned(event: {
    type: 'case.group.assigned';
    payload: any;
  }) {
    this.logger.debug(
      'case.group.assigned event received - no group mailbox yet',
    );
    // TODO: Implement group mailbox functionality
  }

  async handleCaseStatusChanged(event: {
    type: 'case.status.changed';
    payload: any;
  }) {
    try {
      const { id: caseId } = event.payload;
      const c = await this.casesService.getCase(caseId);

      const requester = await this.usersService.getUser(c.requesterId!);

      if (!requester?.email) {
        this.logger.warn(
          `No email found for requester ${(c as any).requesterId} in case ${c.id}`,
        );
        return;
      }

      const { subject, html } = await this.templateService.render(
        (c as any).businessLineId,
        'case.status.changed',
        { case: c, payload: event.payload },
      );

      await this.emailService.sendForBL(
        (c as any).businessLineId,
        requester.email,
        subject,
        html,
      );

      this.logger.log(
        `Case status change notification sent to ${requester.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send case.status.changed notification: ${error}`,
      );
      throw error; // Re-throw to fail outbox processing
    }
  }

  async handleCaseCommentAdded(event: {
    type: 'case.comment.added';
    payload: any;
  }) {
    try {
      const { caseId } = event.payload;
      const c = await this.casesService.getCase(caseId);

      const requester = await this.usersService.getUser(c.requesterId!);
      const assignee = await this.usersService.getUser(c.assigneeId!);

      const targets = [requester?.email, assignee?.email].filter(
        Boolean,
      ) as string[];

      if (targets.length === 0) {
        this.logger.warn(`No email targets found for case ${c.id}`);
        return;
      }

      const { subject, html } = await this.templateService.render(
        (c as any).businessLineId,
        'case.comment.added',
        { case: c, payload: event.payload },
      );

      for (const to of [...new Set(targets)]) {
        await this.emailService.sendForBL(
          (c as any).businessLineId,
          to,
          subject,
          html,
        );
      }

      this.logger.log(
        `Case comment notification sent to ${targets.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send case.comment.added notification: ${error}`,
      );
      throw error; // Re-throw to fail outbox processing
    }
  }

  async handleSlaBreached(payload: SlaBreachedEvent) {
    try {
      const { caseId } = payload;
      const c = await this.casesService.getCase(caseId);

      const assignee = await this.usersService.getUser(c.assigneeId!);

      if (!assignee?.email) {
        this.logger.warn(
          `No email found for assignee ${(c as any).assigneeId} in case ${c.id}`,
        );
        return;
      }

      const { subject, html } = await this.templateService.render(
        (c as any).businessLineId,
        'sla.breached',
        { case: c, payload: payload.payload },
      );

      await this.emailService.sendForBL(
        (c as any).businessLineId,
        assignee.email,
        subject,
        html,
      );

      this.logger.log(`SLA breach notification sent to ${assignee.email}`);
    } catch (error) {
      this.logger.error(`Failed to send sla.breached notification: ${error}`);
      throw error; // Re-throw to fail outbox processing
    }
  }
}
