import { Test, TestingModule } from '@nestjs/testing';
import { SerivceCardsController } from './serivce-cards.controller';
import { SerivceCardsService } from './serivce-cards.service';

describe('SerivceCardsController', () => {
  let controller: SerivceCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SerivceCardsController],
      providers: [SerivceCardsService],
    }).compile();

    controller = module.get<SerivceCardsController>(SerivceCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
