/**
 * Performance 领域模型 SSOT 注册中心入口。
 * 这里只负责聚合 errors、states、dicts、roles 四类主源，不负责运行时注入、OpenAPI 生成或旧逻辑兼容映射。
 * 关键依赖是后续 service、守卫脚本、OpenAPI 同步链和文档同步都通过这里读取统一入口。
 * 维护重点是这里必须保持 additive-first，Phase 1 不得改变现有运行行为。
 */

import {
  PERFORMANCE_BUSINESS_DICTS,
  type PerformanceBusinessDictDefinition,
} from '../dicts/catalog';
import {
  PERFORMANCE_DOMAIN_ERRORS,
  PERFORMANCE_DOMAIN_ERROR_BY_CODE,
  type PerformanceDomainErrorDefinition,
} from '../errors/catalog';
import {
  PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS,
  PERFORMANCE_CAPABILITIES,
  PERFORMANCE_PERSONAS,
  PERFORMANCE_PERSONA_OPTIONS_BY_KEY,
  PERFORMANCE_PERSONA_PRIORITY,
  PERFORMANCE_PERSONA_INFERENCE_RULES,
  PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY,
  PERFORMANCE_PERSONA_WORKBENCH_PAGES,
  PERFORMANCE_SURFACE_ACCESS_RULES,
  PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES,
  PERFORMANCE_SCOPES,
  PERFORMANCE_STATE_GUARDS,
  type PerformanceCapabilityScopeRuleGroupKey,
  type PerformanceCapabilityScopePresetKey,
  type PerformanceCapabilityDefinition,
  type PerformanceLegacyPermissionAlias,
  type PerformanceLegacyCapabilityScopeRule,
  type PerformancePersonaInferenceRule,
  type PerformancePersonaOption,
  type PerformancePersonaDefinition,
  type PerformanceRegisteredPersonaKey,
  type PerformanceRegisteredRoleKind,
  type PerformanceSurfaceAccessKey,
  type PerformanceSurfaceAccessRule,
  type PerformanceScopeDefinition,
  type PerformanceStateGuardDefinition,
  type PerformanceWorkbenchPageAccessRule,
  type PerformanceWorkbenchPageId,
} from '../roles/catalog';
import { APPROVAL_FLOW_STATE_MACHINE } from '../states/approval-flow';
import { ASSESSMENT_STATE_MACHINE } from '../states/assessment';
import type { PerformanceStateMachineDefinition } from '../states/types';

export const PERFORMANCE_DOMAIN_REGISTRY_VERSION = 'phase1-v1';

export const PERFORMANCE_STATE_MACHINES = [
  ASSESSMENT_STATE_MACHINE,
  APPROVAL_FLOW_STATE_MACHINE,
] as const satisfies readonly PerformanceStateMachineDefinition[];

export interface PerformanceDomainRegistry {
  version: string;
  errors: readonly PerformanceDomainErrorDefinition[];
  errorByCode: Readonly<Record<string, PerformanceDomainErrorDefinition>>;
  stateMachines: readonly PerformanceStateMachineDefinition[];
  businessDicts: readonly PerformanceBusinessDictDefinition[];
  personas: readonly PerformancePersonaDefinition[];
  personaOptionsByKey: Readonly<
    Record<PerformanceRegisteredPersonaKey, PerformancePersonaOption>
  >;
  personaPriority: readonly PerformanceRegisteredPersonaKey[];
  personaInferenceRules: Readonly<
    Record<PerformanceRegisteredPersonaKey, PerformancePersonaInferenceRule>
  >;
  personaRoleKindByKey: Readonly<
    Record<PerformanceRegisteredPersonaKey, PerformanceRegisteredRoleKind>
  >;
  personaWorkbenchPages: Readonly<
    Record<PerformanceRegisteredPersonaKey, readonly PerformanceWorkbenchPageId[]>
  >;
  surfaceAccessRules: Readonly<
    Record<PerformanceSurfaceAccessKey, PerformanceSurfaceAccessRule>
  >;
  workbenchPageAccessRules: Readonly<
    Record<PerformanceWorkbenchPageId, PerformanceWorkbenchPageAccessRule>
  >;
  capabilityScopeRuleGroups: Readonly<
    Record<
      PerformanceCapabilityScopeRuleGroupKey,
      readonly PerformanceLegacyCapabilityScopeRule[]
    >
  >;
  capabilities: readonly PerformanceCapabilityDefinition[];
  scopes: readonly PerformanceScopeDefinition[];
  stateGuards: readonly PerformanceStateGuardDefinition[];
}

export const PERFORMANCE_DOMAIN_REGISTRY: PerformanceDomainRegistry =
  Object.freeze({
    version: PERFORMANCE_DOMAIN_REGISTRY_VERSION,
    errors: PERFORMANCE_DOMAIN_ERRORS,
    errorByCode: PERFORMANCE_DOMAIN_ERROR_BY_CODE,
    stateMachines: PERFORMANCE_STATE_MACHINES,
    businessDicts: PERFORMANCE_BUSINESS_DICTS,
    personas: PERFORMANCE_PERSONAS,
    personaOptionsByKey: PERFORMANCE_PERSONA_OPTIONS_BY_KEY,
    personaPriority: PERFORMANCE_PERSONA_PRIORITY,
    personaInferenceRules: PERFORMANCE_PERSONA_INFERENCE_RULES,
    personaRoleKindByKey: PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY,
    personaWorkbenchPages: PERFORMANCE_PERSONA_WORKBENCH_PAGES,
    surfaceAccessRules: PERFORMANCE_SURFACE_ACCESS_RULES,
    workbenchPageAccessRules: PERFORMANCE_WORKBENCH_PAGE_ACCESS_RULES,
    capabilityScopeRuleGroups: PERFORMANCE_CAPABILITY_SCOPE_RULE_GROUPS,
    capabilities: PERFORMANCE_CAPABILITIES,
    scopes: PERFORMANCE_SCOPES,
    stateGuards: PERFORMANCE_STATE_GUARDS,
  });
