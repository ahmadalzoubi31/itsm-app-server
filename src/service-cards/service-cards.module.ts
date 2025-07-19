import { Module } from '@nestjs/common';
import { ServiceCardsService } from './service-cards.service';
import { ServiceCardsController } from './service-cards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCard } from './entities/service-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCard])],
    controllers: [ServiceCardsController],
  providers: [ServiceCardsService],
})
export class ServiceCardsModule {}
