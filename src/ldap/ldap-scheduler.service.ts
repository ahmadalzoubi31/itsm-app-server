import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { CronJob } from 'cron';
import { SettingsService } from 'src/settings/settings.service';
import { SettingTypeEnum } from 'src/settings/constants/type.constant';
import { SyncSettingsDto } from './dto/sync-settings.dto';
import { LdapService } from './ldap.service';

@Injectable()
export class LdapSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(LdapSchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private settingsService: SettingsService,
    private ldapService: LdapService,
  ) {}

  async onModuleInit() {
    const settings = await this.getSyncSettingsFromDb();
    await this.updateSchedule(settings);
  }

  @OnEvent('sync.settings.updated')
  async handleSyncSettingsUpdatedEvent(payload: any) {
    this.logger.log('Sync settings updated, rescheduling...');
    if (payload.type === SettingTypeEnum.SYNC) {
      await this.updateSchedule(payload.jsonValue);
    }
  }

  private async updateSchedule(settings: SyncSettingsDto) {
    if (!settings.enabled) {
      this.removeAllSyncJobs();
      this.logger.log('Sync disabled, removed all scheduled jobs');
      return;
    }

    const cronExpressions = this.buildCronExpressions(settings);
    this.removeAllSyncJobs();
    
    cronExpressions.forEach((cronExpr, index) => {
      this.scheduleSync(cronExpr, settings.timezone, `user-sync-${index}`);
    });
  }

  private buildCronExpressions(settings: SyncSettingsDto): string[] {
    const { syncTime, frequency, daysOfWeek, daysOfMonth } = settings;
    const [hours, minutes] = syncTime.split(':').map(Number);

    switch (frequency.toLowerCase()) {
      case 'hourly':
        return [`${minutes} * * * *`]; // Every hour at specified minute
      
      case 'daily':
        return [`${minutes} ${hours} * * *`]; // Every day at specified time
      
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Multiple cron jobs for different days of the week
          return daysOfWeek.map(day => `${minutes} ${hours} * * ${day}`);
        }
        return [`${minutes} ${hours} * * 0`]; // Default to Sunday
      
      case 'monthly':
        if (daysOfMonth && daysOfMonth.length > 0) {
          // Multiple cron jobs for different days of the month
          return daysOfMonth.map(day => `${minutes} ${hours} ${day} * *`);
        }
        return [`${minutes} ${hours} 1 * *`]; // Default to 1st day of month
    
      
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
  }

  private scheduleSync(cronTime: string, timezone: string, jobName = 'user-sync') {
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
    }

    const job = new CronJob(
      cronTime,
      async () => {
        this.logger.log(`[${new Date().toISOString()}] Running user sync job: ${jobName}...`);
        await this.performSync();
      },
      null,
      false,
      timezone
    );

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();
    this.logger.log(`Scheduled '${jobName}' with cron '${cronTime}' [${timezone}]`);
  }

  private removeAllSyncJobs() {
    const cronJobs = this.schedulerRegistry.getCronJobs();
    cronJobs.forEach((job, name) => {
      if (name.startsWith('user-sync')) {
        this.schedulerRegistry.deleteCronJob(name);
        this.logger.log(`Removed scheduled job: ${name}`);
      }
    });
  }

  private async performSync() {    
    try {
      await this.ldapService.syncUsers(false); // false means not manual sync
      this.logger.log('User sync executed successfully.');
    } catch (error) {
      this.logger.error('User sync failed:', error.message);
    }
  }

  private async getSyncSettingsFromDb(): Promise<SyncSettingsDto> {
    const settings = await this.settingsService.getByType(SettingTypeEnum.SYNC);
    return settings;
  }
}
