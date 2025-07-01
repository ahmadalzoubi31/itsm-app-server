import { Module } from '@nestjs/common';
import { SerivceCardsService } from './serivce-cards.service';
import { SerivceCardsController } from './serivce-cards.controller';

@Module({
  controllers: [SerivceCardsController],
  providers: [SerivceCardsService],
})
export class SerivceCardsModule {}
