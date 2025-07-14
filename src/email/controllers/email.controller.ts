import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EmailService } from '../email.service';
import { 
  SendEmailDto, 
  TestEmailDto, 
  SendTemplateEmailDto 
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/action.enum';
import { AppAbility } from '../../casl/casl-ability.factory';
import { AuditFieldsInterceptor } from '../../shared/interceptors/audit-fields.interceptor';
import { Settings } from 'src/settings/entities/settings.entity';

// @UseGuards(JwtAuthGuard, PoliciesGuard)
// @UseInterceptors(AuditFieldsInterceptor)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return await this.emailService.sendEmail(sendEmailDto);
  }

  @Post('send-template')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async sendTemplateEmail(@Body() sendTemplateEmailDto: SendTemplateEmailDto) {
    return await this.emailService.sendTemplateEmail(sendTemplateEmailDto);
  }

  @Post('queue')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async queueEmail(@Body() sendEmailDto: SendEmailDto) {
    return await this.emailService.queueEmail(sendEmailDto);
  }

  @Post('test-connection')
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async testConnection() {
    return await this.emailService.testConnection();
  }

  @Post('send-test')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    return await this.emailService.sendTestEmail(testEmailDto);
  }

  @Get('statistics')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getEmailStatistics() {
    return await this.emailService.getEmailStatistics();
  }

  @Get('queue')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getEmailQueue() {
    return await this.emailService.getEmailQueue();
  }

  @Delete('queue')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Settings))
  async clearEmailQueue() {
    return await this.emailService.clearEmailQueue();
  }

  @Post('retry-failed')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async retryFailedEmails() {
    return await this.emailService.retryFailedEmails();
  }
} 