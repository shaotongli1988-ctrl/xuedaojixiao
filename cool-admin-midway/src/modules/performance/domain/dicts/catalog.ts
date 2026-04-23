/**
 * Performance 业务字典注册目录。
 * 这里只负责登记业务字典 key、owner、版本和迁移状态，不负责直接下发字典 items。
 * 关键依赖是后续 dict provider、守卫脚本和迁移跟踪都能从同一目录识别“哪些字典应当存在”。
 * 维护重点是 key 命名和 rolloutState 必须稳定，避免 registry 与现有 provider 名称分叉。
 */

export type PerformanceBusinessDictRolloutState =
  | 'planned'
  | 'shadow'
  | 'active';

export interface PerformanceBusinessDictDefinition {
  key: string;
  owner: string;
  version: string;
  rolloutState: PerformanceBusinessDictRolloutState;
}

export const PERFORMANCE_BUSINESS_DICTS = [
  {
    key: 'performance.assessment.status',
    owner: 'assessment',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.approvalFlow.status',
    owner: 'approval-flow',
    version: 'phase1-v1',
    rolloutState: 'planned',
  },
  {
    key: 'performance.workbench.persona',
    owner: 'workbench',
    version: 'phase1-v1',
    rolloutState: 'planned',
  },
  {
    key: 'performance.dashboard.scope',
    owner: 'dashboard',
    version: 'phase1-v1',
    rolloutState: 'planned',
  },
] as const satisfies readonly PerformanceBusinessDictDefinition[];

export const PERFORMANCE_BUSINESS_DICT_BY_KEY = Object.freeze(
  PERFORMANCE_BUSINESS_DICTS.reduce<
    Record<string, PerformanceBusinessDictDefinition>
  >((result, dictDefinition) => {
    result[dictDefinition.key] = dictDefinition;
    return result;
  }, {})
);
