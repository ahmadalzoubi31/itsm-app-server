import { Module } from '@nestjs/common';
import { SerivceRequestsService } from './serivce-requests.service';
import { SerivceRequestsController } from './serivce-requests.controller';

@Module({
  controllers: [SerivceRequestsController],
  providers: [SerivceRequestsService],
})
export class SerivceRequestsModule {}
