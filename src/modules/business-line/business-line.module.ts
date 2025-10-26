// src/modules/business-line/business-line.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLine } from './entities/business-line.entity';
import { BusinessLineController } from './business-line.controller';
import { BusinessLineService } from './business-line.service';
import { CaslModule } from '@modules/iam/casl/casl.module';
import { InfraModule } from '@shared/infra/infra.module';

@Module({
  imports: [InfraModule, CaslModule, TypeOrmModule.forFeature([BusinessLine])],
  controllers: [BusinessLineController],
  providers: [BusinessLineService],
  exports: [BusinessLineService],
})
export class BusinessLineModule {}
