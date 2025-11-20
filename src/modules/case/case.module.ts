import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { CaseComment } from './entities/case-comment.entity';
import { CaseLink } from './entities/case-link.entity';
import { CaseAttachment } from './entities/case-attachment.entity';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SlaModule } from '@modules/sla/sla.module';
import { SlaTimer } from '@modules/sla/entities/sla-timer.entity';

@Module({
  imports: [
    BusinessLineModule,
    CaslModule,
    AuditModule,
    SlaModule,
    TypeOrmModule.forFeature([Case, CaseComment, CaseLink, CaseAttachment, SlaTimer]),
  ],
  controllers: [CaseController],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseModule {}
