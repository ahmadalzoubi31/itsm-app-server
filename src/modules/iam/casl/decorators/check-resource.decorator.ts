import { SetMetadata, Type } from '@nestjs/common';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { RESOURCE_CHECK_KEY } from '../guards/resource-policies.guard';

/**
 * CheckResource Decorator - For resource-specific permission checks
 * Use this for endpoints WITH :id parameter
 *
 * This decorator will:
 * 1. Extract the resource ID from route params
 * 2. Fetch the resource using the specified service method
 * 3. Check CASL permissions against the actual resource instance
 * 4. Optionally attach the resource to req.resource for reuse
 *
 * @param action - The action to check (e.g., IAM_ACTIONS.Update, IAM_ACTIONS.Delete)
 * @param serviceName - The service class that contains the method to fetch the resource
 * @param methodName - The method name to call on the service (default: 'getCase')
 * @param paramName - The route parameter name containing the resource ID (default: 'id')
 *
 * @example
 * // Check if user can update this specific case
 * @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
 * async update(@Param('id') id: string, @Body() dto: UpdateCaseDto) { }
 *
 * @example
 * // Check if user can delete this specific case
 * @CheckResource(IAM_ACTIONS.Delete, CaseService, 'getCase')
 * async remove(@Param('id') id: string) { }
 *
 * @example
 * // Custom param name (e.g., /cases/:caseId/comments)
 * @CheckResource(IAM_ACTIONS.Read, CaseService, 'getCase', 'caseId')
 * async getComments(@Param('caseId') caseId: string) { }
 */
export const CheckResource = (
  action: IAM_ACTIONS,
  serviceName: Type<any>,
  methodName: string = 'getCase',
  paramName: string = 'id',
) =>
  SetMetadata(RESOURCE_CHECK_KEY, {
    action,
    serviceName,
    methodName,
    paramName,
  });
