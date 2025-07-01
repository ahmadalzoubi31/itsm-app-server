import { Test, TestingModule } from '@nestjs/testing';
import { SerivceRequestsController } from './serivce-requests.controller';
import { SerivceRequestsService } from './serivce-requests.service';

describe('SerivceRequestsController', () => {
  let controller: SerivceRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SerivceRequestsController],
      providers: [SerivceRequestsService],
    }).compile();

    controller = module.get<SerivceRequestsController>(SerivceRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
