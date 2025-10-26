import { SetMetadata } from '@nestjs/common';
import { PolicyHandler } from '../utils/policy.handler';

export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * CheckPolicies Decorator - For flexible custom policy checks
 * Use this when you need custom logic or complex conditions
 *
 * @param handlers - One or more policy handler functions or classes
 *
 * @example
 * // Using inline policy handler
 * @CheckPolicies((ability) => ability.can(IAM_ACTIONS.Update, 'Case'))
 * async update() { }
 *
 * @example
 * // Using multiple policy handlers
 * @CheckPolicies(
 *   (ability) => ability.can(IAM_ACTIONS.Read, 'Case'),
 *   (ability) => ability.can(IAM_ACTIONS.Update, 'Case')
 * )
 * async complexOperation() { }
 *
 * @example
 * // Using a policy handler class
 * class CanManageCasePolicy implements IPolicyHandler {
 *   handle(ability: AppAbility) {
 *     return ability.can(IAM_ACTIONS.Manage, 'Case');
 *   }
 * }
 * @CheckPolicies(new CanManageCasePolicy())
 * async manage() { }
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
