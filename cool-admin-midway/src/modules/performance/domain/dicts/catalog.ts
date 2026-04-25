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
    key: 'performance.capability.status',
    owner: 'capability',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.documentCenter.category',
    owner: 'document-center',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.documentCenter.fileType',
    owner: 'document-center',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.documentCenter.storage',
    owner: 'document-center',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.documentCenter.confidentiality',
    owner: 'document-center',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.documentCenter.status',
    owner: 'document-center',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.course.status',
    owner: 'course',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.courseLearning.taskStatus',
    owner: 'course-learning',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.courseLearning.examStatus',
    owner: 'course-learning',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.certificate.status',
    owner: 'certificate',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.certificate.recordStatus',
    owner: 'certificate',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.contract.type',
    owner: 'contract',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.contract.status',
    owner: 'contract',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.hiring.status',
    owner: 'hiring',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.hiring.sourceType',
    owner: 'hiring',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.interview.status',
    owner: 'interview',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.interview.type',
    owner: 'interview',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.knowledgeBase.status',
    owner: 'knowledge-base',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.feedback.taskStatus',
    owner: 'feedback',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.indicator.category',
    owner: 'indicator',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.indicator.status',
    owner: 'indicator',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.indicator.applyScope',
    owner: 'indicator',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.feedback.recordStatus',
    owner: 'feedback',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.feedback.relationType',
    owner: 'feedback',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.jobStandard.status',
    owner: 'job-standard',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.meeting.status',
    owner: 'meeting',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.pip.status',
    owner: 'pip',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.goal.status',
    owner: 'goal',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.goal.sourceType',
    owner: 'goal',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.goal.periodType',
    owner: 'goal',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.goal.planStatus',
    owner: 'goal',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.goal.reportStatus',
    owner: 'goal',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.purchaseOrder.status',
    owner: 'purchase-order',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.promotion.status',
    owner: 'promotion',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.recruitPlan.status',
    owner: 'recruit-plan',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.resumePool.status',
    owner: 'resume-pool',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.resumePool.sourceType',
    owner: 'resume-pool',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.salary.status',
    owner: 'salary',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.suggestion.type',
    owner: 'suggestion',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.suggestion.status',
    owner: 'suggestion',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.suggestion.revokeReasonCode',
    owner: 'suggestion',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.supplier.status',
    owner: 'supplier',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.talentAsset.status',
    owner: 'talent-asset',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.teacherChannel.cooperationStatus',
    owner: 'teacher-channel',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.teacherChannel.classStatus',
    owner: 'teacher-channel',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.teacherChannel.todoBucket',
    owner: 'teacher-channel',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.workPlan.status',
    owner: 'work-plan',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.workPlan.priority',
    owner: 'work-plan',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.workPlan.sourceType',
    owner: 'work-plan',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.workPlan.sourceStatus',
    owner: 'work-plan',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.approvalFlow.status',
    owner: 'approval-flow',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.workbench.persona',
    owner: 'workbench',
    version: 'phase1-v1',
    rolloutState: 'shadow',
  },
  {
    key: 'performance.dashboard.scope',
    owner: 'dashboard',
    version: 'phase1-v1',
    rolloutState: 'shadow',
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
