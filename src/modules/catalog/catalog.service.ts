// src/modules/catalog/catalog.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Service } from './entities/service.entity';
import { RequestCard } from './entities/request-card.entity';
import { BusinessLineService } from '@modules/business-line/business-line.service';
import { CasePriority } from '@shared/constants';
import { CreateRequestCardDto } from './dto/create-requests-card.dto';
import { UpdateRequestCardDto } from './dto/update-requests-card.dto';
import { RequestService } from '@modules/request/request.service';
import { RequestType } from '@shared/constants';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtUser } from '@shared/types/jwt-user.type';
import { UsersService } from '@modules/iam/users/users.service';
import { GroupsService } from '@modules/iam/groups/groups.service';
import { BusinessLine } from '@modules/business-line/entities/business-line.entity';
import { ApprovalStatus } from '@modules/approval/entities/approval-request.entity';
import { RequestStatus } from '@shared/constants';
import { ApprovalService } from '@modules/approval/approval.service';
import { ApprovalStepsType } from '@modules/approval/entities/approval-step.entity';

const ajv = addFormats(
  new Ajv({ allErrors: true, removeAdditional: 'failing' }),
);
ajv.addKeyword('conditionalLogic');

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Service) private services: Repository<Service>,
    @InjectRepository(RequestCard)
    private requestCards: Repository<RequestCard>,
    @InjectRepository(BusinessLine)
    private businessLines: Repository<BusinessLine>,
    private readonly businessLineSvc: BusinessLineService,
    private readonly requestSvc: RequestService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly approvalService: ApprovalService,
  ) {}

  // browse
  listServices() {
    return this.services.find({ order: { name: 'ASC' } });
  }
  listRequestCards() {
    return this.requestCards.find({ order: { name: 'ASC' } });
  }
  listRequestCardsByService(serviceId: string) {
    return this.requestCards.find({
      where: { serviceId, active: true },
      order: { name: 'ASC' },
    });
  }
  async getRequestCard(id: string) {
    const card = await this.requestCards.findOne({
      where: { id, active: true },
    });
    if (!card) throw new NotFoundException('Request card not found');

    // Load approval steps separately
    const approvals = await this.approvalService.getApprovalSteps(id);

    // Transform approvals to match the expected format
    const transformedSteps = approvals.map((step) => ({
      order: step.order,
      type: step.type,
      config: {
        userId: step.userId,
        groupId: step.groupId,
        requireAll: step.requireAll,
      },
    }));

    return {
      ...card,
      approvalSteps: transformedSteps.length > 0 ? transformedSteps : undefined,
    };
  }

  // admin
  async createService(dto: CreateServiceDto) {
    // Validate business line exists (required field)
    if (!dto.businessLineId) {
      throw new BadRequestException('businessLineId is required');
    }
    await this.businessLineSvc.findOne(dto.businessLineId);

    const service = this.services.create(dto);
    return this.services.save(service);
  }

  async updateRequestCard(id: string, dto: UpdateRequestCardDto) {
    // Verify the request card exists
    const requestCard = await this.requestCards.findOne({ where: { id } });
    if (!requestCard) throw new NotFoundException('Request card not found');

    // Build update object with only fields that are provided
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.jsonSchema !== undefined) updateData.jsonSchema = dto.jsonSchema;
    if (dto.uiSchema !== undefined) updateData.uiSchema = dto.uiSchema;
    if (dto.defaults !== undefined) updateData.defaults = dto.defaults;
    if (dto.defaultAssignmentGroupId !== undefined)
      updateData.defaultAssignmentGroupId = dto.defaultAssignmentGroupId;
    if (dto.active !== undefined) updateData.active = dto.active;
    if (dto.workflowId !== undefined) {
      updateData.workflowId =
        dto.workflowId && dto.workflowId !== '' ? dto.workflowId : undefined;
    }
    if (dto.approvalGroupId !== undefined)
      updateData.approvalGroupId = dto.approvalGroupId;
    if (dto.approvalType !== undefined)
      updateData.approvalType = dto.approvalType;
    if (dto.approvalConfig !== undefined)
      updateData.approvalConfig = dto.approvalConfig;

    // Handle approval steps separately (don't save to JSONB column)
    if (dto.approvalSteps !== undefined) {
      await this.approvalService.replaceApprovalSteps(
        id,
        dto.approvalSteps.map((step) => ({
          order: step.order,
          type: step.type as any,
          userId: step.config?.userId,
          groupId: step.config?.groupId,
          requireAll: step.config?.requireAll,
        })),
      );
    }

    // Use update() method which only updates specified fields
    // This avoids issues with required fields that shouldn't be changed
    await this.requestCards.update(id, updateData);

    // Return the updated entity
    return this.requestCards.findOne({ where: { id } });
  }

  async createRequestCard(dto: CreateRequestCardDto) {
    // minimal checks
    if (!dto.serviceId) throw new BadRequestException('serviceId required');

    console.log('=== CREATE REQUEST CARD DEBUG ===');
    console.log('1. Received DTO:', JSON.stringify(dto, null, 2));
    console.log('2. DTO.approvalSteps:', dto.approvalSteps);

    // Extract approval steps from DTO (we'll save them separately)
    const { approvalSteps, ...requestCardData } = dto;

    const finalData = {
      ...requestCardData,
      workflowId:
        dto.workflowId && dto.workflowId !== '' ? dto.workflowId : undefined,
    };

    console.log(
      '3. Request Card Data (without steps):',
      JSON.stringify(finalData, null, 2),
    );

    // fetch business line from service
    const service = await this.services.findOne({
      where: { id: dto.serviceId },
      relations: ['businessLine'],
    });
    if (!service) throw new NotFoundException('Service not found');
    const businessLineId = service.businessLine.id;
    if (!businessLineId) throw new NotFoundException('Business line not found');

    const newRequestCard = this.requestCards.create({
      ...finalData,
      businessLineId,
    });

    console.log(
      '4. Created entity (before save):',
      JSON.stringify(newRequestCard, null, 2),
    );

    const saved = await this.requestCards.save(newRequestCard);

    console.log('5. Saved entity:', JSON.stringify(saved, null, 2));

    // Save approval steps separately if provided
    if (approvalSteps && approvalSteps.length > 0) {
      console.log('6. Saving approval steps:', approvalSteps);
      const savedSteps = await this.approvalService.createApprovalSteps(
        saved.id,
        approvalSteps.map((step) => ({
          order: step.order,
          type: step.type as any,
          userId: step.config?.userId,
          groupId: step.config?.groupId,
          requireAll: step.config?.requireAll,
        })),
      );
      console.log('7. Saved approval steps:', savedSteps.length);
    }

    console.log('=== END DEBUG ===');

    return saved;
  }

  /**
   * Submit a request from a catalog request card
   */
  async submitRequest(
    requestCardId: string,
    formData: Record<string, any>,
    user: JwtUser,
  ) {
    try {
      // 1. Get and validate request card
      const requestCard = await this.requestCards.findOne({
        where: { id: requestCardId, active: true },
        relations: ['businessLine'],
      });
      if (!requestCard) {
        throw new NotFoundException('Request card not found or inactive');
      }

      // 2. Validate form data against jsonSchema
      // Clone schema to avoid mutating the cached entity
      const schema = JSON.parse(JSON.stringify(requestCard.jsonSchema));

      // Filter out required fields that are hidden by conditional logic
      if (schema.properties && schema.required) {
        const hiddenFields = Object.keys(schema.properties).filter((key) => {
          const property = schema.properties[key];
          if (property.conditionalLogic) {
            return !this.evaluateConditionalLogic(
              property.conditionalLogic,
              formData,
            );
          }
          return false;
        });

        if (hiddenFields.length > 0) {
          schema.required = schema.required.filter(
            (field: string) => !hiddenFields.includes(field),
          );
        }
      }

      const validate = ajv.compile(schema);
      const valid = validate(formData);

      if (!valid) {
        throw new BadRequestException({
          message: 'Form validation failed',
          errors: validate.errors,
        });
      }

      // 3. Merge defaults
      const finalData = { ...(requestCard.defaults || {}), ...formData };

      // 4. Build title from request card name + key data
      const titlePrefix = requestCard.name;
      const title = `${titlePrefix}`;

      // 5. Get request card
      const service = await this.services.findOne({
        where: { id: requestCard.serviceId },
        relations: ['businessLine'],
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // 6. Determine priority from form data
      const priority = this.determinePriority(finalData);

      // 7. Create Request (which will route to Case/Incident via workflow)
      const request = await this.requestSvc.createRequest({
        title,
        description: JSON.stringify(finalData, null, 2),
        type: RequestType.SERVICE_REQUEST,
        priority,
        businessLineId: requestCard.businessLineId,
        affectedServiceId: service.id,
        requestCardId: requestCardId,
        metadata: finalData, // Store form data in metadata
        requesterId: user.userId,
      });

      // 8. Handle approval if configured
      if (requestCard.approvalSteps && requestCard.approvalSteps.length > 0) {
        await this.setupApproval(request, requestCard, user.userId);
      }

      return request;
    } catch (error) {
      // Re-throw known exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Wrap unexpected errors with more context
      throw new BadRequestException(
        `Failed to submit request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Determine priority from form data (look for urgency field)
   */
  private determinePriority(data: Record<string, any>): CasePriority {
    const urgency = data.urgency?.toLowerCase() || 'medium';
    const mapping: Record<string, CasePriority> = {
      low: CasePriority.LOW,
      medium: CasePriority.MEDIUM,
      high: CasePriority.HIGH,
      critical: CasePriority.CRITICAL,
    };
    return mapping[urgency] || CasePriority.MEDIUM;
  }

  /**
   * Setup approval records based on request card configuration
   */
  private async setupApproval(
    request: any,
    requestCard: RequestCard,
    requesterId: string,
  ) {
    // Get requester user to access metadata
    const requester = await this.usersService.getUser(requesterId);

    // Set request status to WAITING_APPROVAL
    request.status = RequestStatus.WAITING_APPROVAL;

    await this.requestSvc.updateRequest(request.id, {
      status: RequestStatus.WAITING_APPROVAL,
    });

    // Use new approvalSteps if available, otherwise fall back to legacy approvalType
    if (requestCard.approvalSteps && requestCard.approvalSteps.length > 0) {
      // Process approval steps in order
      const sortedSteps = [...requestCard.approvalSteps].sort(
        (a, b) => a.order - b.order,
      );

      for (const step of sortedSteps) {
        const approverIds: string[] = [];

        switch (step.type) {
          case 'manager':
            // Find manager from requester's metadata
            if (requester.metadata?.manager) {
              const manager = await this.usersService.getUserByUsername(
                requester.metadata.manager,
              );
              if (manager) {
                approverIds.push(manager.id);
              }
            }
            break;

          case 'direct':
            // Use userId from step config
            if (step.userId) {
              approverIds.push(step.userId);
            }
            break;

          case 'group':
            // Get all members of the approval group
            if (step.groupId) {
              const members = await this.groupsService.getGroupMembers(
                step.groupId,
              );
              approverIds.push(...members.map((m) => m.id));
            }
            break;
        }

        // Create approval records for all approvers in this step
        // const approvalPromises = approverIds.map((approverId) => {
        //   const approval = this.approvalService.createApprovalRequest({
        //     requestId: request.id,
        //     approverId,
        //     status: ApprovalStatus.PENDING,
        //   });
        //   return this.approvalService.createApprovalRequest(approval);
        // });

        // await Promise.all(approvalPromises);
      }
    } else if (
      requestCard.approvalSteps &&
      requestCard.approvalSteps.some(
        (step) => step.type === ApprovalStepsType.MANAGER,
      )
    ) {
      // Legacy support: single approval type
      const approverIds: string[] = [];

      switch (
        requestCard.approvalSteps.find(
          (step) => step.type === ApprovalStepsType.MANAGER,
        )?.type
      ) {
        case 'manager':
          // Find manager from requester's metadata
          if (requester.metadata?.manager) {
            const manager = await this.usersService.getUserByUsername(
              requester.metadata.manager,
            );
            if (manager) {
              approverIds.push(manager.id);
            }
          }
          break;

        case 'direct':
          // Use userId from approvalConfig
          if (
            requestCard.approvalSteps.find(
              (step) => step.type === ApprovalStepsType.DIRECT,
            )?.userId
          ) {
            approverIds.push(
              requestCard.approvalSteps.find(
                (step) => step.type === ApprovalStepsType.DIRECT,
              )?.userId as string,
            );
          }
          break;

        case 'group':
          // Get all members of the approval group
          if (
            requestCard.approvalSteps.find(
              (step) => step.type === ApprovalStepsType.GROUP,
            )?.groupId
          ) {
            const members = await this.groupsService.getGroupMembers(
              requestCard.approvalSteps.find(
                (step) => step.type === ApprovalStepsType.GROUP,
              )?.groupId as string,
            );
            approverIds.push(...members.map((m) => m.id));
          }
          break;
      }

      // Create approval records for all approvers
      // const approvalPromises = approverIds.map((approverId) => {
      //   const approval = this.approvalService.approveRequest({
      //     requestId: request.id,
      //     approverId,
      //     status: ApprovalStatus.PENDING,
      //   });
      //   return this.approvals.save(approval);
      // });

      // await Promise.all(approvalPromises);
    }
  }

  /**
   * Get dropdown options from database entities
   */
  async getDropdownOptions(
    entity: string,
    displayField: string,
    valueField: string,
    filters?: string,
  ) {
    if (!entity || !displayField || !valueField) {
      throw new BadRequestException(
        'entity, displayField, and valueField are required',
      );
    }

    let whereClause: Record<string, any> = {};
    if (filters) {
      try {
        whereClause = JSON.parse(filters);
      } catch (error) {
        throw new BadRequestException('Invalid filters JSON');
      }
    }

    let data: any[] = [];

    switch (entity.toLowerCase()) {
      case 'users':
        data = await this.usersService.listUsers(whereClause);
        break;
      case 'groups':
        data = await this.groupsService.listGroups(whereClause);
        break;
      case 'businesslines':
      case 'business_lines':
        data = await this.businessLines.find({
          where: whereClause,
          order: { name: 'ASC' },
        });
        break;
      case 'services':
        data = await this.services.find({
          where: whereClause,
          order: { name: 'ASC' },
        });
        break;
      default:
        throw new BadRequestException(`Unknown entity: ${entity}`);
    }

    // Transform data to dropdown format
    return data.map((item) => ({
      label: item[displayField] || String(item[valueField]),
      value: item[valueField],
    }));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: any,
    formData: Record<string, any>,
  ): boolean {
    const fieldValue = formData[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(String(condition.value));
        }
        return false;
      case 'isEmpty':
        return (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      case 'isNotEmpty':
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== '' &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      default:
        return true;
    }
  }

  /**
   * Evaluate all conditions for a field
   */
  private evaluateConditionalLogic(
    conditionalLogic: any,
    formData: Record<string, any>,
  ): boolean {
    if (
      !conditionalLogic ||
      !conditionalLogic.conditions ||
      conditionalLogic.conditions.length === 0
    ) {
      return true; // No conditions means always visible
    }

    const results = conditionalLogic.conditions.map((condition: any) =>
      this.evaluateCondition(condition, formData),
    );

    return conditionalLogic.logicOperator === 'AND'
      ? results.every((r: boolean) => r)
      : results.some((r: boolean) => r);
  }
}
