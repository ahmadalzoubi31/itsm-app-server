import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CaseModule } from '@modules/case/case.module';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { WorkflowModule } from '@modules/workflow/workflow.module';

@Module({
  imports: [
    BusinessLineModule,
    CaseModule,
    WorkflowModule,
    CaslModule,
    TypeOrmModule.forFeature([Request]),
  ],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
