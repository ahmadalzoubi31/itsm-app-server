import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from '../entities/request.entity';
import { RequestStatus } from '@shared/constants';
import { CaseService } from '@modules/case/case.service';
import { WorkflowService } from '@modules/workflow/workflow.service';
import { CreateCaseDto } from '@modules/case/dto/create-case.dto';
import { CaseCategoryService } from '@modules/case-category/case-category.service';
import { CaseSubcategoryService } from '@modules/case-subcategory/case-subcategory.service';

/**
 * Listener that routes approved requests to cases
 */
@Injectable()
export class RequestApprovedListener {
  private readonly logger = new Logger(RequestApprovedListener.name);

  constructor(
    @InjectRepository(Request)
    private readonly requests: Repository<Request>,
    private readonly caseSvc: CaseService,
    private readonly workflowSvc: WorkflowService,
    private readonly caseCategorySvc: CaseCategoryService,
    private readonly caseSubcategorySvc: CaseSubcategoryService,
  ) {
    this.logger.log('RequestApprovedListener initialized');
  }

  @OnEvent('request.approved')
  async handleRequestApproved(event: {
    requestId: string;
    requestNumber: string;
  }) {
    const { requestId, requestNumber } = event;

    try {
      this.logger.log(
        `Handling request.approved event for request ${requestNumber}`,
      );

      // Fetch the request
      const request = await this.requests.findOne({
        where: { id: requestId },
        relations: ['requestCard', 'requestCard.service'],
      });

      if (!request) {
        this.logger.warn(`Request ${requestId} not found`);
        return;
      }

      // Get workflow for routing
      const workflow = await this.workflowSvc.getWorkflowForRouting({
        businessLineId: request.businessLineId,
        requestType: request.type,
      });

      // Route to Case or Incident using workflow
      const linkedCase = await this.routeRequest(request, workflow);

      // Update request with linked case
      if (linkedCase) {
        request.linkedCaseId = linkedCase.id;
        request.status = RequestStatus.ASSIGNED;
        await this.requests.save(request);

        this.logger.log(
          `Request ${requestNumber} routed to case ${linkedCase.number} after approval`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to route approved request ${requestNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Route request to Case/Incident based on workflow
   */
  private async routeRequest(request: Request, workflow: any): Promise<any> {
    const targetType = workflow?.targetType || 'Case';

    // Get default category and subcategory for service requests
    // Try to find "service-request" category, otherwise get first active category
    let category = await this.caseCategorySvc.findByKey('service-request');
    if (!category) {
      const categories = await this.caseCategorySvc.findAll();
      category = categories.find((c) => c.active) || categories[0];
    }

    if (!category) {
      throw new Error(
        'No case category found. Please create at least one case category.',
      );
    }

    // Get first active subcategory for the category
    const subcategories = await this.caseSubcategorySvc.findByCategoryId(
      category.id,
    );
    const subcategory = subcategories.find((s) => s.active) || subcategories[0];

    if (!subcategory) {
      throw new Error(
        `No case subcategory found for category ${category.name}. Please create at least one subcategory.`,
      );
    }

    // Build case data from request
    const caseData: CreateCaseDto = {
      title: request.title,
      description: request.description,
      priority: request.priority,
      requesterId: request.requesterId || '',
      assignmentGroupId: request.assignmentGroupId as string,
      businessLineId: request.businessLineId,
      categoryId: category.id,
      subcategoryId: subcategory.id,
    };

    // Determine assignment group from workflow
    if (workflow?.assignmentGroupId) {
      caseData.assignmentGroupId = workflow.assignmentGroupId;
    }

    // Create the case
    const linkedCase = await this.caseSvc.createCase(caseData);

    return linkedCase;
  }
}
