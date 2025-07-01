import { Test, TestingModule } from '@nestjs/testing';
import { SerivceRequestsService } from './serivce-requests.service';

describe('SerivceRequestsService', () => {
  let service: SerivceRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerivceRequestsService],
    }).compile();

    service = module.get<SerivceRequestsService>(SerivceRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
