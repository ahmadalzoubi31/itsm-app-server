import { SetMetadata, Type } from '@nestjs/common';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

export const ABILITY_CHECK_KEY = 'ability:check';

/**
 * CheckAbility Decorator - For simple type-level permission checks
 * Use this for endpoints WITHOUT :id parameter
 *
 * @param action - The action to check (e.g., IAM_ACTIONS.Create, IAM_ACTIONS.Read)
 * @param subject - The subject type to check (e.g., 'Case', 'User', 'all')
 *
 * @example
 * // Check if user can create Cases
 * @CheckAbility(IAM_ACTIONS.Create, 'Case')
 * async create(@Body() dto: CreateCaseDto) { }
 *
 * @example
 * // Check if user can list all Cases
 * @CheckAbility(IAM_ACTIONS.Read, 'Case')
 * async findAll() { }
 */
export const CheckAbility = (action: IAM_ACTIONS, subject: Type<any> | 'all') =>
  SetMetadata(ABILITY_CHECK_KEY, { action, subject });
