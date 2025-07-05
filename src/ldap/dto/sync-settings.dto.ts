import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator';
import { FrequencyEnum } from '../constants/frequency.constant';

export class SyncSettingsDto {
  @IsBoolean()
  enabled: boolean;

  @IsEnum(FrequencyEnum)
  frequency: FrequencyEnum;

  @IsString()
  syncTime: string;

  @IsString()
  timezone: string;

  @IsNumber()
  retryAttempts: number;

  @IsNumber()
  retryInterval: number;

  @IsNumber()
  fullSyncInterval: number;
}
