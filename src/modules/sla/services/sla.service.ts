// src/modules/sla/sla.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SlaTarget } from '../entities/sla-target.entity';
import { SlaTimer } from '../entities/sla-timer.entity';
import { CreateSlaTargetDto } from '../dto/create-target.dto';
import { SlaRulesEngineService } from '../services/sla-rules-engine.service';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @InjectRepository(SlaTarget) private targets: Repository<SlaTarget>,
    @InjectRepository(SlaTimer) private timers: Repository<SlaTimer>,
    private readonly rulesEngine: SlaRulesEngineService,
  ) {}

  /**
   * Initialize SLA timers for a new case based on dynamic rules
   */
  async initForCase(caseRow: {
    id: string;
    businessLineId?: string;
    priority?: string;
    module?: string;
  }) {
    const where: any = { isActive: true };
    if (caseRow.businessLineId)
      where.businessLineId = In([caseRow.businessLineId, null]);

    const targets = await this.targets.find({ where });
    const now = new Date();

    if (targets.length === 0) {
      this.logger.warn(
        `No SLA targets found for case ${caseRow.id}, business line ${caseRow.businessLineId}`,
      );
      return;
    }

    const results = {
      processed: 0,
      started: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const target of targets) {
      results.processed++;

      // Check if timer already exists
      const exists = await this.timers.findOne({
        where: { caseId: caseRow.id, targetId: target.id },
      });
      if (exists) {
        results.skipped++;
        continue;
      }

      const startTriggers = this.rulesEngine.findMatchingTriggers(
        target.rules,
        'case.created.sync',
        caseRow,
        'start',
      );

      if (startTriggers.length > 0) {
        const timer = this.timers.create({
          caseId: caseRow.id,
          targetId: target.id,
          startedAt: now,
          lastTickAt: now,
          remainingMs: target.goalMs,
          status: 'Running',
        });
        await this.timers.save(timer);

        results.started++;
        this.logger.log(
          `Started SLA timer for case ${caseRow.id}, target ${target.key} (${target.goalMs}ms)`,
        );
      } else {
        results.errors.push(
          `No start triggers found for case ${caseRow.id}, target ${target.key}`,
        );
        this.logger.warn(
          `No start triggers found for case ${caseRow.id}, target ${target.key}`,
        );
      }
    }

    this.logger.log(
      `SLA initialization completed for case ${caseRow.id}: ${results.started} started, ${results.skipped} skipped, ${results.errors.length} errors`,
    );

    return results;
  }

  /**
   * Process SLA events dynamically based on rules
   */
  async processSlaEvent(event: string, eventData: any, caseId: string) {
    this.logger.log(`Processing SLA event: ${event} for case ${caseId}`);

    // Get all active targets for this case's business line
    const where: any = { isActive: true };
    if (eventData.businessLineId) {
      where.businessLineId = In([eventData.businessLineId, null]);
    }

    const targets = await this.targets.find({ where });

    if (targets.length === 0) {
      this.logger.warn(
        `No SLA targets found for event ${event}, case ${caseId}, business line ${eventData.businessLineId}`,
      );
      return;
    }

    for (const target of targets) {
      await this.processTargetForEvent(target, event, eventData, caseId);
    }
  }

  /**
   * Process a specific target for an event (only for existing timers)
   * Timer creation should only happen in initForCase()
   */
  private async processTargetForEvent(
    target: SlaTarget,
    event: string,
    eventData: any,
    caseId: string,
  ) {
    const timer = await this.timers.findOne({
      where: { caseId, targetId: target.id },
    });

    if (!timer) {
      // No timer exists - this event can't affect a non-existent timer
      // Timer creation should only happen during case creation via initForCase()
      this.logger.debug(
        `No timer found for case ${caseId}, target ${target.key} - skipping event ${event}`,
      );
      return;
    }

    // Process stop triggers
    const stopTriggers = this.rulesEngine.findMatchingTriggers(
      target.rules,
      event,
      eventData,
      'stop',
    );

    if (stopTriggers.length > 0 && timer.status === 'Running') {
      await this.stopTimer(timer, 'Met');
      return;
    }

    // Process pause triggers
    const pauseTriggers = this.rulesEngine.findMatchingTriggers(
      target.rules,
      event,
      eventData,
      'pause',
    );

    if (pauseTriggers.length > 0 && timer.status === 'Running') {
      await this.pauseTimer(timer);
      return;
    }

    // Process resume triggers
    const resumeTriggers = this.rulesEngine.findMatchingTriggers(
      target.rules,
      event,
      eventData,
      'resume',
    );

    if (resumeTriggers.length > 0 && timer.status === 'Paused') {
      await this.resumeTimer(timer);
      return;
    }

    // no conditions met, so do nothing
    return;
  }

  /**
   * Stop a timer and mark as met
   */
  private async stopTimer(timer: SlaTimer, status: 'Met' | 'Stopped') {
    const now = new Date();
    timer.status = status;
    timer.stoppedAt = now;

    await this.timers.save(timer);

    this.logger.log(
      `SLA timer stopped for case ${timer.caseId}, target ${timer.targetId} - ${status}`,
    );
  }

  /**
   * Pause a running timer
   */
  private async pauseTimer(timer: SlaTimer) {
    const now = new Date();
    timer.status = 'Paused';
    timer.pausedAt = now;

    await this.timers.save(timer);

    this.logger.log(
      `SLA timer paused for case ${timer.caseId}, target ${timer.targetId}`,
    );
  }

  /**
   * Resume a paused timer
   */
  private async resumeTimer(timer: SlaTimer) {
    const now = new Date();

    // Calculate paused duration and add to total paused time
    if (timer.pausedAt) {
      const pausedDuration = now.getTime() - timer.pausedAt.getTime();
      timer.totalPausedMs += pausedDuration;
    }

    timer.status = 'Running';
    timer.resumedAt = now;
    timer.pausedAt = undefined;

    await this.timers.save(timer);

    this.logger.log(
      `SLA timer resumed for case ${timer.caseId}, target ${timer.targetId}`,
    );
  }

  /**
   * Legacy method for backward compatibility
   */
  async stopOnStatus(caseRow: { id: string; status: string }) {
    await this.processSlaEvent(
      'case.status.changed',
      {
        status: caseRow.status,
        from: 'unknown',
        to: caseRow.status,
      },
      caseRow.id,
    );
  }

  async createTarget(
    dto: CreateSlaTargetDto & { createdById: string; createdByName: string },
  ) {
    return await this.targets.save(this.targets.create(dto));
  }

  async listTargets() {
    return await this.targets.find({ order: { name: 'ASC' } });
  }

  async removeTarget(id: string) {
    return await this.targets.delete(id);
  }
}
