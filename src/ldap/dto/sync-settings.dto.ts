import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class SyncSettingsDto {
  @IsBoolean() enabled: boolean;
  @IsString() frequency: string;
  @IsString() syncTime: string;
  @IsString() timezone: string;
  @IsNumber() retryAttempts: number;
  @IsNumber() retryInterval: number;
  @IsNumber() fullSyncInterval: number;
}
