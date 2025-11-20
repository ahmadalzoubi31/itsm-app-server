import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowTargetType } from './entities/workflow.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { BusinessLineService } from '@modules/business-line/business-line.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(Workflow) private workflows: Repository<Workflow>,
    private readonly businessLineSvc: BusinessLineService,
  ) {}

  async createWorkflow(
    dto: CreateWorkflowDto & { createdById?: string; createdByName?: string },
  ) {
    // Validate business line exists
    await this.businessLineSvc.findOne(dto.businessLineId);

    const workflow = this.workflows.create({
      ...dto,
      createdById: dto.createdById,
      createdByName: dto.createdByName,
    });

    return this.workflows.save(workflow);
  }

  async findAll() {
    return this.workflows.find({
      order: { evaluationOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.workflows.findOne({ where: { id } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async updateWorkflow(
    id: string,
    dto: UpdateWorkflowDto & { updatedById?: string; updatedByName?: string },
  ) {
    const workflow = await this.findOne(id);

    // Validate business line if updating
    if (dto.businessLineId) {
      await this.businessLineSvc.findOne(dto.businessLineId);
    }

    Object.assign(workflow, dto);
    return this.workflows.save(workflow);
  }

  /**
   * Find the appropriate workflow for routing a request
   * This will evaluate active workflows based on business line and conditions
   */
  async getWorkflowForRouting(params: {
    businessLineId: string;
    requestType?: string;
    metadata?: any;
  }) {
    // Find active workflows for this business line
    const workflows = await this.workflows.find({
      where: {
        businessLineId: params.businessLineId,
        active: true,
      },
      order: { evaluationOrder: 'ASC', name: 'ASC' },
    });

    if (workflows.length === 0) {
      this.logger.warn(
        `No active workflows found for business line ${params.businessLineId}`,
      );
      return null;
    }

    // Evaluate conditions if any
    for (const workflow of workflows) {
      if (this.evaluateConditions(workflow.conditions, params.metadata)) {
        this.logger.log(
          `Selected workflow: ${workflow.name} (${workflow.targetType})`,
        );
        return workflow;
      }
    }

    // If no workflow matches conditions, return the first one (lowest evaluation order)
    this.logger.log(
      `No workflow matched conditions, using first: ${workflows[0].name}`,
    );
    return workflows[0];
  }

  /**
   * Evaluate workflow conditions against metadata
   */
  private evaluateConditions(
    conditions?: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
      value: any;
    }>,
    metadata?: any,
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always match
    }

    if (!metadata) {
      return false; // Has conditions but no data
    }

    return conditions.every((condition) => {
      const fieldValue = metadata[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greaterThan':
          return Number(fieldValue) > Number(condition.value);
        case 'lessThan':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }
}
