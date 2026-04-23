/**
 * Dict 模块业务字典聚合目录。
 * 这里只负责登记业务字典 provider、聚合当前 provider 产出的 group 快照，并提供按 key 查询入口。
 * 不负责数据库字典 CRUD，也不负责各业务域内部状态或枚举实现。
 * 维护重点是 provider 列表与 group key 快照必须稳定，避免业务字典再次散落回 service 层。
 */

import {
  PERFORMANCE_BUSINESS_DICT_BY_KEY,
} from '../../../performance/domain/dicts/catalog';
import {
  getAssessmentBusinessDictGroups,
} from '../../../performance/service/assessment-dict';
import { getCapabilityBusinessDictGroups } from '../../../performance/service/capability-dict';
import { getCertificateBusinessDictGroups } from '../../../performance/service/certificate-dict';
import { getContractBusinessDictGroups } from '../../../performance/service/contract-dict';
import { getCourseBusinessDictGroups } from '../../../performance/service/course-dict';
import { getCourseLearningBusinessDictGroups } from '../../../performance/service/course-learning-dict';
import { getDocumentCenterBusinessDictGroups } from '../../../performance/service/document-center-dict';
import { getFeedbackBusinessDictGroups } from '../../../performance/service/feedback-dict';
import { getGoalBusinessDictGroups } from '../../../performance/service/goal-dict';
import { getHiringBusinessDictGroups } from '../../../performance/service/hiring-dict';
import {
  getIndicatorBusinessDictGroups,
  type BusinessDictGroup,
} from '../../../performance/service/indicator-dict';
import { getInterviewBusinessDictGroups } from '../../../performance/service/interview-dict';
import { getJobStandardBusinessDictGroups } from '../../../performance/service/job-standard-dict';
import { getKnowledgeBaseBusinessDictGroups } from '../../../performance/service/knowledge-base-dict';
import { getMeetingBusinessDictGroups } from '../../../performance/service/meeting-dict';
import { getPipBusinessDictGroups } from '../../../performance/service/pip-dict';
import { getPromotionBusinessDictGroups } from '../../../performance/service/promotion-dict';
import { getPurchaseOrderBusinessDictGroups } from '../../../performance/service/purchase-order-dict';
import { getRecruitPlanBusinessDictGroups } from '../../../performance/service/recruit-plan-dict';
import { getResumePoolBusinessDictGroups } from '../../../performance/service/resume-pool-dict';
import { getSalaryBusinessDictGroups } from '../../../performance/service/salary-dict';
import { getSuggestionBusinessDictGroups } from '../../../performance/service/suggestion-dict';
import { getSupplierBusinessDictGroups } from '../../../performance/service/supplier-dict';
import { getTalentAssetBusinessDictGroups } from '../../../performance/service/talent-asset-dict';
import { getTeacherChannelBusinessDictGroups } from '../../../performance/service/teacher-channel-dict';
import { getWorkPlanBusinessDictGroups } from '../../../performance/service/work-plan-dict';

export interface DictBusinessDictProviderDefinition {
  key: string;
  owner: string;
  sourcePaths: readonly string[];
  getGroups: () => BusinessDictGroup[];
}

export interface DictBusinessDictCatalog {
  providers: readonly DictBusinessDictProviderDefinition[];
  groups: readonly BusinessDictGroup[];
  groupByKey: Readonly<Record<string, BusinessDictGroup>>;
}

export const DICT_BUSINESS_DICT_PROVIDERS = [
  {
    key: 'performance.assessment',
    owner: 'performance.assessment',
    sourcePaths: ['src/modules/performance/service/assessment-dict.ts'],
    getGroups: getAssessmentBusinessDictGroups,
  },
  {
    key: 'performance.capability',
    owner: 'performance.capability',
    sourcePaths: ['src/modules/performance/service/capability-dict.ts'],
    getGroups: getCapabilityBusinessDictGroups,
  },
  {
    key: 'performance.contract',
    owner: 'performance.contract',
    sourcePaths: ['src/modules/performance/service/contract-dict.ts'],
    getGroups: getContractBusinessDictGroups,
  },
  {
    key: 'performance.indicator',
    owner: 'performance.indicator',
    sourcePaths: ['src/modules/performance/service/indicator-dict.ts'],
    getGroups: getIndicatorBusinessDictGroups,
  },
  {
    key: 'performance.course',
    owner: 'performance.course',
    sourcePaths: ['src/modules/performance/service/course-dict.ts'],
    getGroups: getCourseBusinessDictGroups,
  },
  {
    key: 'performance.course_learning',
    owner: 'performance.course_learning',
    sourcePaths: ['src/modules/performance/service/course-learning-dict.ts'],
    getGroups: getCourseLearningBusinessDictGroups,
  },
  {
    key: 'performance.document_center',
    owner: 'performance.document_center',
    sourcePaths: ['src/modules/performance/service/document-center-dict.ts'],
    getGroups: getDocumentCenterBusinessDictGroups,
  },
  {
    key: 'performance.feedback',
    owner: 'performance.feedback',
    sourcePaths: ['src/modules/performance/service/feedback-dict.ts'],
    getGroups: getFeedbackBusinessDictGroups,
  },
  {
    key: 'performance.goal',
    owner: 'performance.goal',
    sourcePaths: ['src/modules/performance/service/goal-dict.ts'],
    getGroups: getGoalBusinessDictGroups,
  },
  {
    key: 'performance.hiring',
    owner: 'performance.hiring',
    sourcePaths: ['src/modules/performance/service/hiring-dict.ts'],
    getGroups: getHiringBusinessDictGroups,
  },
  {
    key: 'performance.interview',
    owner: 'performance.interview',
    sourcePaths: ['src/modules/performance/service/interview-dict.ts'],
    getGroups: getInterviewBusinessDictGroups,
  },
  {
    key: 'performance.job_standard',
    owner: 'performance.job_standard',
    sourcePaths: ['src/modules/performance/service/job-standard-dict.ts'],
    getGroups: getJobStandardBusinessDictGroups,
  },
  {
    key: 'performance.knowledge_base',
    owner: 'performance.knowledge_base',
    sourcePaths: ['src/modules/performance/service/knowledge-base-dict.ts'],
    getGroups: getKnowledgeBaseBusinessDictGroups,
  },
  {
    key: 'performance.meeting',
    owner: 'performance.meeting',
    sourcePaths: ['src/modules/performance/service/meeting-dict.ts'],
    getGroups: getMeetingBusinessDictGroups,
  },
  {
    key: 'performance.pip',
    owner: 'performance.pip',
    sourcePaths: ['src/modules/performance/service/pip-dict.ts'],
    getGroups: getPipBusinessDictGroups,
  },
  {
    key: 'performance.promotion',
    owner: 'performance.promotion',
    sourcePaths: ['src/modules/performance/service/promotion-dict.ts'],
    getGroups: getPromotionBusinessDictGroups,
  },
  {
    key: 'performance.purchase_order',
    owner: 'performance.purchase_order',
    sourcePaths: ['src/modules/performance/service/purchase-order-dict.ts'],
    getGroups: getPurchaseOrderBusinessDictGroups,
  },
  {
    key: 'performance.certificate',
    owner: 'performance.certificate',
    sourcePaths: ['src/modules/performance/service/certificate-dict.ts'],
    getGroups: getCertificateBusinessDictGroups,
  },
  {
    key: 'performance.recruit_plan',
    owner: 'performance.recruit_plan',
    sourcePaths: ['src/modules/performance/service/recruit-plan-dict.ts'],
    getGroups: getRecruitPlanBusinessDictGroups,
  },
  {
    key: 'performance.resume_pool',
    owner: 'performance.resume_pool',
    sourcePaths: ['src/modules/performance/service/resume-pool-dict.ts'],
    getGroups: getResumePoolBusinessDictGroups,
  },
  {
    key: 'performance.salary',
    owner: 'performance.salary',
    sourcePaths: ['src/modules/performance/service/salary-dict.ts'],
    getGroups: getSalaryBusinessDictGroups,
  },
  {
    key: 'performance.suggestion',
    owner: 'performance.suggestion',
    sourcePaths: ['src/modules/performance/service/suggestion-dict.ts'],
    getGroups: getSuggestionBusinessDictGroups,
  },
  {
    key: 'performance.supplier',
    owner: 'performance.supplier',
    sourcePaths: ['src/modules/performance/service/supplier-dict.ts'],
    getGroups: getSupplierBusinessDictGroups,
  },
  {
    key: 'performance.talent_asset',
    owner: 'performance.talent_asset',
    sourcePaths: ['src/modules/performance/service/talent-asset-dict.ts'],
    getGroups: getTalentAssetBusinessDictGroups,
  },
  {
    key: 'performance.teacher_channel',
    owner: 'performance.teacher_channel',
    sourcePaths: ['src/modules/performance/service/teacher-channel-dict.ts'],
    getGroups: getTeacherChannelBusinessDictGroups,
  },
  {
    key: 'performance.work_plan',
    owner: 'performance.work_plan',
    sourcePaths: ['src/modules/performance/service/work-plan-dict.ts'],
    getGroups: getWorkPlanBusinessDictGroups,
  },
] as const satisfies readonly DictBusinessDictProviderDefinition[];

export const DICT_BUSINESS_DICT_GROUPS = Object.freeze(
  DICT_BUSINESS_DICT_PROVIDERS.flatMap(provider => provider.getGroups())
);

export const DICT_BUSINESS_DICT_BY_KEY = Object.freeze(
  DICT_BUSINESS_DICT_GROUPS.reduce<Record<string, BusinessDictGroup>>(
    (result, group) => {
      result[group.key] = group;
      return result;
    },
    {}
  )
);

export const DICT_BUSINESS_DICT_CATALOG: DictBusinessDictCatalog =
  Object.freeze({
    providers: DICT_BUSINESS_DICT_PROVIDERS,
    groups: DICT_BUSINESS_DICT_GROUPS,
    groupByKey: DICT_BUSINESS_DICT_BY_KEY,
  });

export function resolveBusinessDictGroups(keys?: string[]) {
  const requestedKeys = Array.from(
    new Set((keys || []).map(key => String(key || '').trim()).filter(Boolean))
  );

  if (!requestedKeys.length) {
    return {};
  }

  const requestedSet = new Set(requestedKeys);
  const resolvedGroups = requestedKeys.reduce<Record<string, BusinessDictGroup>>(
    (result, requestedKey) => {
      const matchedGroup = DICT_BUSINESS_DICT_BY_KEY[requestedKey];
      if (matchedGroup && requestedSet.has(requestedKey)) {
        result[requestedKey] = matchedGroup;
      }
      return result;
    },
    {}
  );

  for (const requestedKey of requestedKeys) {
    const registryDefinition = PERFORMANCE_BUSINESS_DICT_BY_KEY[requestedKey];
    if (
      registryDefinition &&
      registryDefinition.rolloutState !== 'planned' &&
      !resolvedGroups[requestedKey]
    ) {
      throw new Error(
        `Registered business dict key is missing provider output: ${requestedKey}`
      );
    }
  }

  return resolvedGroups;
}
