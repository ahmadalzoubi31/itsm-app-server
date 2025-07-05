import { SyncStatusEnum } from '../constants/sync-status.constant';
import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';

export class SyncHistoryDto {
  @IsDate()
  timestamp: Date;

  @IsEnum(SyncStatusEnum)
  status: SyncStatusEnum;

  @IsString()
  details: string;

  @IsNumber()
  usersFetched?: number;

  @IsNumber()
  duration?: number;
}
