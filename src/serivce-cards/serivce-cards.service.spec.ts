import { Test, TestingModule } from '@nestjs/testing';
import { SerivceCardsService } from './serivce-cards.service';

describe('SerivceCardsService', () => {
  let service: SerivceCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerivceCardsService],
    }).compile();

    service = module.get<SerivceCardsService>(SerivceCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
