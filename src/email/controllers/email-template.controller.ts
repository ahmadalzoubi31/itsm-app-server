import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EmailTemplateService } from '../email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from '../dto/email-template.dto';
import { EmailTemplateTypeEnum } from '../enums';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/action.enum';
import { AppAbility } from '../../casl/casl-ability.factory';
import { AuditFieldsInterceptor } from '../../shared/interceptors/audit-fields.interceptor';
import { Settings } from 'src/settings/entities/settings.entity';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditFieldsInterceptor)
@Controller('email/templates')
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async create(@Body() createEmailTemplateDto: CreateEmailTemplateDto) {
    const template = await this.emailTemplateService.create(createEmailTemplateDto);
    return {
      success: true,
      message: 'Email template created successfully',
      data: template,
    };
  }

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async findAll(@Query('type') type?: EmailTemplateTypeEnum) {
    let templates;
    
    if (type) {
      templates = await this.emailTemplateService.findByType(type);
    } else {
      templates = await this.emailTemplateService.findAll();
    }

    return {
      success: true,
      message: 'Email templates retrieved successfully',
      data: templates,
    };
  }

  @Get('variables/:type')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async getTemplateVariables(@Param('type') type: EmailTemplateTypeEnum) {
    const variables = await this.emailTemplateService.getTemplateVariables(type);
    return {
      success: true,
      message: 'Template variables retrieved successfully',
      data: variables,
    };
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async findOne(@Param('id') id: string) {
    const template = await this.emailTemplateService.findOne(id);
    return {
      success: true,
      message: 'Email template retrieved successfully',
      data: template,
    };
  }

  @Put(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async update(
    @Param('id') id: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
  ) {
    const template = await this.emailTemplateService.update(id, updateEmailTemplateDto);
    return {
      success: true,
      message: 'Email template updated successfully',
      data: template,
    };
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, Settings))
  async remove(@Param('id') id: string) {
    await this.emailTemplateService.remove(id);
    return {
      success: true,
      message: 'Email template deleted successfully',
    };
  }

  @Post(':id/activate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async activate(@Param('id') id: string) {
    const template = await this.emailTemplateService.activate(id);
    return {
      success: true,
      message: 'Email template activated successfully',
      data: template,
    };
  }

  @Post(':id/deactivate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, Settings))
  async deactivate(@Param('id') id: string) {
    const template = await this.emailTemplateService.deactivate(id);
    return {
      success: true,
      message: 'Email template deactivated successfully',
      data: template,
    };
  }

  @Post(':id/preview')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async previewTemplate(
    @Param('id') id: string,
    @Body() templateData: Record<string, any>,
  ) {
    const preview = await this.emailTemplateService.previewTemplate(id, templateData);
    return {
      success: true,
      message: 'Template preview generated successfully',
      data: preview,
    };
  }

  @Post(':id/duplicate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async duplicate(
    @Param('id') id: string,
    @Body('name') newName: string,
  ) {
    const template = await this.emailTemplateService.duplicateTemplate(id, newName);
    return {
      success: true,
      message: 'Email template duplicated successfully',
      data: template,
    };
  }

  @Post('validate')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Settings))
  async validateTemplate(
    @Body('templateContent') templateContent: string,
    @Body('variables') variables: string[],
  ) {
    const validation = await this.emailTemplateService.validateTemplate(templateContent, variables);
    return {
      success: true,
      message: 'Template validation completed',
      data: validation,
    };
  }

  @Post('seed-defaults')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Settings))
  async seedDefaultTemplates() {
    await this.emailTemplateService.seedDefaultTemplates();
    return {
      success: true,
      message: 'Default email templates seeded successfully',
    };
  }
} 