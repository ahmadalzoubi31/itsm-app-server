/**
 * CASL Guards - Choose the right guard for your use case:
 *
 * 1. AbilityGuard - For simple type-level checks (no :id)
 *    Use when: Checking if user can perform action on a subject TYPE
 *    Example: Can user create Cases? Can user list all Cases?
 *
 * 2. ResourcePoliciesGuard - For resource-specific checks (with :id)
 *    Use when: Checking if user can perform action on a SPECIFIC resource
 *    Example: Can user update THIS case? Can user delete THIS case?
 *
 * 3. PoliciesGuard - For flexible custom checks
 *    Use when: You need custom logic or complex conditions
 *    Example: Multiple checks, business rules, etc.
 */

export { AbilityGuard } from './ability.guard';
export { ResourcePoliciesGuard } from './resource-policies.guard';
export { PoliciesGuard } from './policies.guard';
