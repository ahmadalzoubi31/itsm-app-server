/**
 * CASL Decorators - Choose the right decorator for your use case:
 *
 * 1. @CheckAbility(action, subject) - For simple type-level checks (no :id)
 *    Use when: Checking if user can perform action on a subject TYPE
 *    Example: @CheckAbility(IAM_ACTIONS.Create, 'Case')
 *
 * 2. @CheckResource(action, service, method, param) - For resource-specific checks (with :id)
 *    Use when: Checking if user can perform action on a SPECIFIC resource
 *    Example: @CheckResource(IAM_ACTIONS.Update, CaseService, 'getCase', 'id')
 *
 * 3. @CheckPolicies(...handlers) - For flexible custom checks
 *    Use when: You need custom logic or complex conditions
 *    Example: @CheckPolicies((ability) => ability.can(IAM_ACTIONS.Manage, 'Case'))
 */

export { CheckAbility } from './check-ability.decorator';
export { CheckResource } from './check-resource.decorator';
export { CheckPolicies } from './check-policies.decorator';
