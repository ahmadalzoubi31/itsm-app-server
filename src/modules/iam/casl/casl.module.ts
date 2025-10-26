import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { AbilityGuard } from './guards/ability.guard';
import { ResourcePoliciesGuard } from './guards/resource-policies.guard';
import { PoliciesGuard } from './guards/policies.guard';
import { IamCoreModule } from '../core/iam-core.module';

/**
 * CASL Module - Provides three types of permission guards:
 *
 * 1. AbilityGuard - Type-level checks (for endpoints without :id)
 * 2. ResourcePoliciesGuard - Resource-level checks (for endpoints with :id)
 * 3. PoliciesGuard - Custom flexible policy checks
 */
@Module({
  imports: [IamCoreModule],
  providers: [
    CaslAbilityFactory,
    AbilityGuard,
    ResourcePoliciesGuard,
    PoliciesGuard,
  ],
  exports: [
    CaslAbilityFactory,
    AbilityGuard,
    ResourcePoliciesGuard,
    PoliciesGuard,
  ],
})
export class CaslModule {}
