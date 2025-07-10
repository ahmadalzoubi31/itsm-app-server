// import { Injectable, Logger } from '@nestjs/common';
// import { LdapService } from './ldap.service';
// import { SettingsService } from '../settings/settings.service';
// import { SettingTypeEnum } from '../settings/constants/type.constant';
// import { FrequencyEnum } from './constants/frequency.constant';
// import { SchedulerRegistry } from '@nestjs/schedule';

// @Injectable()
// export class LdapSchedulerService {
//   private readonly logger = new Logger(LdapSchedulerService.name);
//   private isInitialized = false;
//   private readonly JOB_NAME = 'ldap-sync';

//   constructor(
//     private readonly ldapService: LdapService,
//     private readonly settingsService: SettingsService,
//     private readonly schedulerRegistry: SchedulerRegistry,
//   ) {}

//   async initializeScheduler() {
//     if (this.isInitialized) {
//       return;
//     }

//     try {
//       const syncSettings = await this.settingsService.getByType(
//         SettingTypeEnum.SYNC,
//       );

//       this.logger.log('Initializing LDAP scheduler with settings:', {
//         enabled: syncSettings.enabled,
//         frequency: syncSettings.frequency,
//         syncTime: syncSettings.syncTime,
//         timezone: syncSettings.timezone,
//       });

//       if (syncSettings.enabled) {
//         await this.startScheduler(syncSettings);
//       } else {
//         this.logger.log('LDAP sync is disabled, scheduler not started');
//       }

//       this.isInitialized = true;
//       this.logger.log('LDAP scheduler initialized successfully');
//     } catch (error) {
//       this.logger.warn('Failed to initialize LDAP scheduler:', error.message);
//       // Still mark as initialized to prevent repeated attempts
//       this.isInitialized = true;
//     }
//   }

//   async startScheduler(syncSettings: any) {
//     // Stop existing job if running
//     await this.stopScheduler();

//     if (!syncSettings.enabled) {
//       this.logger.log('LDAP sync is disabled, scheduler not started');
//       return;
//     }

//     const cronExpression = this.buildCronExpression(syncSettings);

//     const job = new CronJob(
//       cronExpression,
//       async () => {
//         await this.executeSync();
//       },
//       null,
//       false,
//       syncSettings.timezone || 'UTC',
//     );

//     this.schedulerRegistry.addCronJob(this.JOB_NAME, job);
//     job.start();

//     this.logger.log(`LDAP sync scheduler started with cron: ${cronExpression}`);
//   }

//   async stopScheduler() {
//     try {
//       if (this.schedulerRegistry.doesExist('cron', this.JOB_NAME)) {
//         const job = this.schedulerRegistry.getCronJob(this.JOB_NAME);
//         job.stop();
//         this.schedulerRegistry.deleteCronJob(this.JOB_NAME);
//         this.logger.log('LDAP sync scheduler stopped');
//       }
//     } catch (error) {
//       this.logger.warn('Error stopping scheduler:', error.message);
//     }
//   }

//   private buildCronExpression(syncSettings: any): string {
//     const [hour, minute] = syncSettings.syncTime.split(':').map(Number);

//     switch (syncSettings.frequency) {
//       case FrequencyEnum.HOURLY:
//         return `${minute} * * * *`; // Every hour at the specified minute

//       case FrequencyEnum.DAILY:
//         return `${minute} ${hour} * * *`; // Daily at specified time

//       case FrequencyEnum.WEEKLY:
//         return `${minute} ${hour} * * 0`; // Weekly on Sunday at specified time

//       case FrequencyEnum.MONTHLY:
//         return `${minute} ${hour} 1 * *`; // Monthly on the 1st at specified time

//       default:
//         return `${minute} ${hour} * * *`; // Default to daily
//     }
//   }

//   private async executeSync() {
//     try {
//       this.logger.log('Starting scheduled LDAP sync...');

//       // Check if sync is still enabled before executing
//       const currentSettings = await this.settingsService.getByType(
//         SettingTypeEnum.SYNC,
//       );

//       if (!currentSettings.enabled) {
//         this.logger.log('LDAP sync is disabled, skipping scheduled execution');
//         await this.stopScheduler();
//         return;
//       }

//       // Execute the sync with retry logic
//       await this.executeSyncWithRetry(currentSettings);
//     } catch (error) {
//       this.logger.error('Scheduled LDAP sync failed:', error.message);
//     }
//   }

//   private async executeSyncWithRetry(syncSettings: any) {
//     let attempts = 0;
//     const maxAttempts = syncSettings.retryAttempts || 3;
//     const retryInterval = syncSettings.retryInterval || 30; // seconds

//     while (attempts < maxAttempts) {
//       try {
//         attempts++;
//         this.logger.log(`LDAP sync attempt ${attempts}/${maxAttempts}`);

//         await this.ldapService.syncUsers(false); // false = not manual sync

//         this.logger.log('Scheduled LDAP sync completed successfully');
//         return;
//       } catch (error) {
//         this.logger.error(
//           `LDAP sync attempt ${attempts} failed:`,
//           error.message,
//         );

//         if (attempts < maxAttempts) {
//           this.logger.log(`Retrying in ${retryInterval} seconds...`);
//           await this.sleep(retryInterval * 1000);
//         } else {
//           this.logger.error('All LDAP sync attempts failed');
//           throw error;
//         }
//       }
//     }
//   }

//   private sleep(ms: number): Promise<void> {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   }

//   async updateScheduler() {
//     try {
//       const syncSettings = await this.settingsService.getByType(
//         SettingTypeEnum.SYNC,
//       );

//       if (syncSettings.enabled) {
//         await this.startScheduler(syncSettings);
//       } else {
//         await this.stopScheduler();
//       }

//       this.logger.log('LDAP scheduler updated');
//     } catch (error) {
//       this.logger.error('Failed to update LDAP scheduler:', error.message);
//     }
//   }

//   getSchedulerStatus() {
//     try {
//       const isRunning = this.schedulerRegistry.doesExist('cron', this.JOB_NAME);
//       let nextExecution = null;

//       if (isRunning) {
//         const job = this.schedulerRegistry.getCronJob(this.JOB_NAME);
//         nextExecution = job.nextDate().toString();
//       }

//       return {
//         isRunning,
//         nextExecution: nextExecution || null,
//         isInitialized: this.isInitialized,
//       };
//     } catch (error) {
//       this.logger.warn('Error getting scheduler status:', error.message);
//       return {
//         isRunning: false,
//         nextExecution: null,
//         isInitialized: this.isInitialized,
//       };
//     }
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class LdapSchedulerService {
  private readonly logger = new Logger(LdapSchedulerService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Called when the current second is 45');
  }
}
