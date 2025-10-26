/**
 * CASL Module - Comprehensive permission system
 *
 * This module provides three levels of permission checking:
 * 1. Type-level checks (AbilityGuard + CheckAbility)
 * 2. Resource-level checks (ResourcePoliciesGuard + CheckResource)
 * 3. Custom policy checks (PoliciesGuard + CheckPolicies)
 */

export * from './guards';
export * from './decorators';
export * from './casl-ability.factory';
export * from './utils/policy.handler';
export { CaslModule } from './casl.module';
