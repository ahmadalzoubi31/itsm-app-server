// src/modules/sla/sla.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaTarget } from './entities/sla-target.entity';
import { SlaTimer } from './entities/sla-timer.entity';
import { SlaService } from './services/sla.service';
import { SlaWorker } from './services/sla.worker';
import { SlaRulesEngineService } from './services/sla-rules-engine.service';
import { SlaController } from './sla.controller';
import { CaslModule } from '@modules/iam/casl/casl.module';

@Module({
  imports: [CaslModule, TypeOrmModule.forFeature([SlaTarget, SlaTimer])],
  controllers: [SlaController],
  providers: [SlaService, SlaWorker, SlaRulesEngineService],
  exports: [SlaService],
})
export class SlaModule {}
