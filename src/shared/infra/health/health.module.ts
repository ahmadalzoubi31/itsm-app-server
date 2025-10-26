import { Module, Controller, Get, Logger } from '@nestjs/common';
import {
  TerminusModule,
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('INFRA / Health')
@Controller('health')
class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    this.logger.debug('Performing health check...');

    try {
      const result = await this.health.check([
        async () => {
          this.logger.debug('Checking database connection...');
          const dbResult = await this.db.pingCheck('database', {
            timeout: 5000,
          });
          this.logger.log('Database health check completed successfully');
          return dbResult;
        },
      ]);

      this.logger.debug('Health check completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      throw error;
    }
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
