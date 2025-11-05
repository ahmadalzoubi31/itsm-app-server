import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { BusinessLineModule } from '@modules/business-line/business-line.module';
import { CaslModule } from '@modules/iam/casl/casl.module';

@Module({
  imports: [
    BusinessLineModule,
    CaslModule,
    TypeOrmModule.forFeature([Workflow]),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
