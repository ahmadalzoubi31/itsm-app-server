// src/modules/sla/sla.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { SlaTimer } from '../entities/sla-timer.entity';
import { SlaBreachedEvent } from '@shared/contracts/events';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SlaWorker {
  private readonly log = new Logger('SLA');
  private readonly intervalMs = 5_000; // 5 seconds

  constructor(
    @InjectRepository(SlaTimer) private timers: Repository<SlaTimer>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    setInterval(
      () => this.tick().catch((e) => this.log.error(e)),
      this.intervalMs,
    );
  }

  private async tick() {
    const now = new Date();
    const running = await this.timers.find({
      where: { status: 'Running' },
      relations: ['target'],
      take: 200,
    });

    for (const t of running) {
      const last = t.lastTickAt ?? t.startedAt;
      const elapsed = now.getTime() - last.getTime();

      // Only count elapsed time if timer is actually running
      // (not paused)
      t.remainingMs = Math.max(0, t.remainingMs - elapsed);
      t.lastTickAt = now;

      if (t.remainingMs === 0) {
        t.status = 'Breached';
        t.breachedAt = now;
        await this.timers.save(t);

        this.eventEmitter.emit(
          'sla.breached',
          new SlaBreachedEvent(t.caseId, {
            metric: t.target.key as 'resolution' | 'first_response',
            targetAt: new Date(t.target.goalMs).toISOString(),
            at: now.toISOString(),
          }),
        );

        this.log.error(
          `SLA BREACHED: Case ${t.caseId}, Target ${t.targetId} at ${now.toISOString()}`,
        );
      } else {
        await this.timers.save(t);
      }
    }
  }
}
