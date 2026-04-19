/**
 * Stage-2 smoke verification for performance modules 1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, and 20.
 * This file checks captcha, login, menu scope, dashboard/assessment/goal APIs, theme-7 course boundary, and the minimum real API path for indicator/PIP/promotion/salary/meeting/talentAsset/capability/certificate/course-learning/asset.
 * It does not change business data, patch runtime config, or replace seed/bootstrap scripts.
 * Maintenance pitfall: assertions are coupled to seed-stage2-performance.mjs and the current stage-2 scope; update both sides together.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  resolveExpectedPort,
  resolveProjectGitHash,
  resolveProjectSourceHash,
  validateStage2RuntimeMeta,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const successCode = 1000;
const stage2LearningCourseCode = 'PMS-COURSE-PUBLISHED-001';
const learningForbiddenKeys = [
  'provider',
  'providerName',
  'model',
  'modelName',
  'promptTemplate',
  'promptVersion',
  'traceId',
  'questionList',
  'answerList',
  'scoringRules',
  'audioUrl',
];
const stage2PerformanceRequiredScopes = [
  'stage2-performance-core',
  'theme12-talentAsset',
  'theme13-capability-certificate',
  'theme14-course-learning',
  'theme20-asset-management',
];

const expectedUsers = [
  {
    username: 'hr_admin',
    label: 'HR管理员',
    menu: {
      routesPresent: [
        '/data-center/dashboard',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/indicator-library',
        '/performance/course',
        '/performance/capability',
        '/performance/certificate',
        '/performance/pip',
        '/performance/promotion',
        '/performance/salary',
        '/performance/meeting',
        '/performance/talentAsset',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/assignment',
        '/performance/asset/maintenance',
        '/performance/asset/report',
        '/performance/asset/procurement',
        '/performance/asset/transfer',
        '/performance/asset/inventory',
        '/performance/asset/depreciation',
        '/performance/asset/disposal',
      ],
      routesAbsent: ['/performance/course-learning'],
      permsPresent: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:assessment:myPage',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:export',
        'performance:feedback:export',
        'performance:goal:page',
        'performance:goal:add',
        'performance:goal:export',
        'performance:course:page',
        'performance:course:info',
        'performance:capabilityModel:page',
        'performance:capabilityModel:info',
        'performance:capabilityModel:add',
        'performance:capabilityModel:update',
        'performance:capabilityItem:info',
        'performance:capabilityPortrait:info',
        'performance:certificate:page',
        'performance:certificate:info',
        'performance:certificate:add',
        'performance:certificate:update',
        'performance:certificate:issue',
        'performance:certificate:recordPage',
        'performance:indicator:page',
        'performance:indicator:add',
        'performance:pip:page',
        'performance:pip:start',
        'performance:pip:export',
        'performance:promotion:page',
        'performance:promotion:review',
        'performance:salary:page',
        'performance:salary:changeAdd',
        'performance:meeting:page',
        'performance:meeting:add',
        'performance:meeting:update',
        'performance:meeting:checkIn',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetInfo:add',
        'performance:assetInfo:update',
        'performance:assetInfo:delete',
        'performance:assetInfo:updateStatus',
        'performance:assetAssignment:page',
        'performance:assetAssignment:add',
        'performance:assetAssignment:update',
        'performance:assetAssignment:return',
        'performance:assetAssignment:markLost',
        'performance:assetAssignment:delete',
        'performance:assetMaintenance:page',
        'performance:assetMaintenance:add',
        'performance:assetMaintenance:update',
        'performance:assetMaintenance:complete',
        'performance:assetMaintenance:cancel',
        'performance:assetMaintenance:delete',
        'performance:assetProcurement:page',
        'performance:assetProcurement:info',
        'performance:assetProcurement:add',
        'performance:assetProcurement:update',
        'performance:assetProcurement:submit',
        'performance:assetProcurement:receive',
        'performance:assetProcurement:cancel',
        'performance:assetTransfer:page',
        'performance:assetTransfer:info',
        'performance:assetTransfer:add',
        'performance:assetTransfer:update',
        'performance:assetTransfer:submit',
        'performance:assetTransfer:complete',
        'performance:assetTransfer:cancel',
        'performance:assetInventory:page',
        'performance:assetInventory:info',
        'performance:assetInventory:add',
        'performance:assetInventory:update',
        'performance:assetInventory:start',
        'performance:assetInventory:complete',
        'performance:assetInventory:close',
        'performance:assetDepreciation:page',
        'performance:assetDepreciation:summary',
        'performance:assetDepreciation:recalculate',
        'performance:assetDisposal:page',
        'performance:assetDisposal:info',
        'performance:assetDisposal:add',
        'performance:assetDisposal:update',
        'performance:assetDisposal:submit',
        'performance:assetDisposal:approve',
        'performance:assetDisposal:execute',
        'performance:assetDisposal:cancel',
        'performance:assetReport:summary',
        'performance:assetReport:page',
        'performance:assetReport:export',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
        'performance:talentAsset:delete',
      ],
      permsAbsent: [
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:assessment:submit',
        'performance:courseRecite:page',
        'performance:courseRecite:info',
        'performance:courseRecite:submit',
        'performance:coursePractice:page',
        'performance:coursePractice:info',
        'performance:coursePractice:submit',
        'performance:courseExam:summary',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 0,
        includeCodes: [],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: true,
        expectedTotal: 5,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
          'PMS-STAGE2-HIDDEN-001',
        ],
        excludeCodes: [],
      },
      {
        mode: 'pending',
        expectSuccess: true,
        expectedTotal: 2,
        includeCodes: ['PMS-STAGE2-SUBMITTED-001', 'PMS-STAGE2-HIDDEN-001'],
        excludeCodes: [],
      },
    ],
    dashboardSummary: {
      expectSuccess: true,
      expectEmptyScope: false,
    },
    crossSummary: {
      expectSuccess: true,
      expectedScopeType: 'global',
      expectDeniedDepartment: false,
    },
    goalPage: {
      expectedTotal: 4,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
        '联调-销售中心隐藏目标',
      ],
      excludeTitles: [],
    },
    indicatorPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includeCodes: [
        'PMS-STAGE2-IND-DELIVERY',
        'PMS-STAGE2-IND-COLLAB',
        'PMS-STAGE2-IND-STABILITY',
        'PMS-STAGE2-IND-DISABLED',
      ],
      excludeCodes: [],
      enabledFilter: {
        expectedTotal: 3,
        includeCodes: [
          'PMS-STAGE2-IND-DELIVERY',
          'PMS-STAGE2-IND-COLLAB',
          'PMS-STAGE2-IND-STABILITY',
        ],
        excludeCodes: ['PMS-STAGE2-IND-DISABLED'],
      },
    },
    pipPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
        '联调-PIP-隐藏-销售员工',
      ],
      excludeTitles: [],
    },
    feedbackExport: {
      expectSuccess: true,
      expectedTotal: 1,
      includeTitles: ['联调-平台组360反馈任务'],
      excludeTitles: [],
      forbiddenKeys: ['records'],
    },
    pipExport: {
      expectSuccess: true,
      expectedTotal: 4,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
        '联调-PIP-隐藏-销售员工',
      ],
      excludeTitles: [],
      forbiddenKeys: ['improvementGoal', 'sourceReason', 'resultSummary', 'trackRecords'],
    },
    promotionPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includePositions: [
        '阶段2-销售主管',
        '阶段2-平台高级工程师',
        '阶段2-平台技术专家',
        '阶段2-平台架构师',
      ],
      excludePositions: [],
    },
    salaryPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeKeys: [
        '平台员工:confirmed',
        '平台员工:archived',
        '销售员工:archived',
      ],
      excludeKeys: [],
      expectSensitiveFields: true,
    },
    meetingPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-主题9排期会',
        '联调-主题9进行中晨会',
        '联调-主题9销售复盘会',
      ],
      excludeTitles: [],
      checkInTitle: '联调-主题9进行中晨会',
    },
    talentAsset: {
      expectSuccess: true,
      expectedTotal: 2,
      includeNames: ['联调-主题12平台人才', '联调-主题12销售人才'],
      excludeNames: [],
      infoName: '联调-主题12平台人才',
      canDelete: true,
      canUpdate: false,
      outOfScopeDepartmentId: null,
    },
    courseManagement: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-新员工训练营',
        '联调-晋升领导力训练营',
        '联调-平台架构复盘课',
      ],
      excludeTitles: [],
    },
    capabilityManagement: {
      expectSuccess: true,
      expectedTotal: 2,
      includeNames: ['联调-平台岗位通用能力模型', '联调-销售岗位能力模型'],
      excludeNames: [],
      canMaintain: true,
      expectedPortraitEmployee: '平台员工',
    },
    certificateManagement: {
      expectSuccess: true,
      expectedTotal: 2,
      includeNames: ['联调-PMP认证', '联调-销售能力认证'],
      excludeNames: [],
      canIssue: true,
      recordExpectedTotal: 2,
      recordIncludeEmployees: ['平台员工', '销售员工'],
      recordExcludeEmployees: [],
    },
    courseLearning: {
      expectSuccess: false,
    },
  },
  {
    username: 'manager_rd',
    label: '部门经理',
    menu: {
      routesPresent: [
        '/data-center/dashboard',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/course',
        '/performance/capability',
        '/performance/certificate',
        '/performance/pip',
        '/performance/promotion',
        '/performance/meeting',
        '/performance/talentAsset',
        '/performance/asset/dashboard',
        '/performance/asset/ledger',
        '/performance/asset/assignment',
        '/performance/asset/maintenance',
        '/performance/asset/report',
        '/performance/asset/transfer',
        '/performance/asset/inventory',
        '/performance/asset/disposal',
      ],
      routesAbsent: [
        '/performance/indicator-library',
        '/performance/salary',
        '/performance/course-learning',
        '/performance/asset/procurement',
        '/performance/asset/depreciation',
      ],
      permsPresent: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:assessment:myPage',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:goal:page',
        'performance:goal:add',
        'performance:goal:export',
        'performance:feedback:export',
        'performance:course:page',
        'performance:course:info',
        'performance:capabilityModel:page',
        'performance:capabilityModel:info',
        'performance:capabilityItem:info',
        'performance:capabilityPortrait:info',
        'performance:certificate:page',
        'performance:certificate:info',
        'performance:certificate:recordPage',
        'performance:pip:page',
        'performance:pip:track',
        'performance:pip:export',
        'performance:promotion:page',
        'performance:promotion:review',
        'performance:meeting:page',
        'performance:meeting:add',
        'performance:meeting:update',
        'performance:meeting:checkIn',
        'performance:assetDashboard:summary',
        'performance:assetInfo:page',
        'performance:assetInfo:info',
        'performance:assetAssignment:page',
        'performance:assetAssignment:add',
        'performance:assetAssignment:update',
        'performance:assetAssignment:return',
        'performance:assetMaintenance:page',
        'performance:assetMaintenance:add',
        'performance:assetMaintenance:update',
        'performance:assetMaintenance:complete',
        'performance:assetMaintenance:cancel',
        'performance:assetTransfer:page',
        'performance:assetTransfer:info',
        'performance:assetTransfer:add',
        'performance:assetTransfer:update',
        'performance:assetTransfer:submit',
        'performance:assetTransfer:complete',
        'performance:assetTransfer:cancel',
        'performance:assetInventory:page',
        'performance:assetInventory:info',
        'performance:assetInventory:add',
        'performance:assetInventory:update',
        'performance:assetInventory:start',
        'performance:assetInventory:complete',
        'performance:assetInventory:close',
        'performance:assetDisposal:page',
        'performance:assetDisposal:info',
        'performance:assetDisposal:add',
        'performance:assetDisposal:update',
        'performance:assetDisposal:submit',
        'performance:assetDisposal:approve',
        'performance:assetDisposal:execute',
        'performance:assetDisposal:cancel',
        'performance:assetReport:summary',
        'performance:assetReport:page',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
      ],
      permsAbsent: [
        'performance:assessment:export',
        'performance:assessment:submit',
        'performance:indicator:page',
        'performance:salary:page',
        'performance:courseRecite:page',
        'performance:courseRecite:info',
        'performance:courseRecite:submit',
        'performance:coursePractice:page',
        'performance:coursePractice:info',
        'performance:coursePractice:submit',
        'performance:courseExam:summary',
        'performance:capabilityModel:add',
        'performance:capabilityModel:update',
        'performance:certificate:add',
        'performance:certificate:update',
        'performance:certificate:issue',
        'performance:assetInfo:add',
        'performance:assetInfo:update',
        'performance:assetInfo:delete',
        'performance:assetInfo:updateStatus',
        'performance:assetAssignment:markLost',
        'performance:assetAssignment:delete',
        'performance:assetMaintenance:delete',
        'performance:assetProcurement:page',
        'performance:assetProcurement:info',
        'performance:assetProcurement:add',
        'performance:assetProcurement:update',
        'performance:assetProcurement:submit',
        'performance:assetProcurement:receive',
        'performance:assetProcurement:cancel',
        'performance:assetDepreciation:page',
        'performance:assetDepreciation:summary',
        'performance:assetDepreciation:recalculate',
        'performance:assetReport:export',
        'performance:talentAsset:delete',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 0,
        includeCodes: [],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: true,
        expectedTotal: 4,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
        ],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'pending',
        expectSuccess: true,
        expectedTotal: 1,
        includeCodes: ['PMS-STAGE2-SUBMITTED-001'],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
    ],
    dashboardSummary: {
      expectSuccess: true,
      expectEmptyScope: true,
    },
    crossSummary: {
      expectSuccess: true,
      expectedScopeType: 'department_tree',
      expectDeniedDepartment: true,
    },
    goalPage: {
      expectedTotal: 3,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
      ],
      excludeTitles: ['联调-销售中心隐藏目标'],
    },
    indicatorPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看指标库',
    },
    pipPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
      ],
      excludeTitles: ['联调-PIP-隐藏-销售员工'],
    },
    feedbackExport: {
      expectSuccess: true,
      expectedTotal: 1,
      includeTitles: ['联调-平台组360反馈任务'],
      excludeTitles: [],
      forbiddenKeys: ['records'],
    },
    pipExport: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
      ],
      excludeTitles: ['联调-PIP-隐藏-销售员工'],
      forbiddenKeys: ['improvementGoal', 'sourceReason', 'resultSummary', 'trackRecords'],
    },
    promotionPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includePositions: [
        '阶段2-平台高级工程师',
        '阶段2-平台技术专家',
        '阶段2-平台架构师',
      ],
      excludePositions: ['阶段2-销售主管'],
    },
    salaryPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看薪资管理',
    },
    meetingPage: {
      expectSuccess: true,
      expectedTotal: 2,
      includeTitles: ['联调-主题9排期会', '联调-主题9进行中晨会'],
      excludeTitles: ['联调-主题9销售复盘会'],
      checkInTitle: '联调-主题9进行中晨会',
    },
    talentAsset: {
      expectSuccess: true,
      expectedTotal: 1,
      includeNames: ['联调-主题12平台人才'],
      excludeNames: ['联调-主题12销售人才'],
      infoName: '联调-主题12平台人才',
      canDelete: false,
      canUpdate: true,
      outOfScopeDepartmentId: 3,
    },
    courseManagement: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-新员工训练营',
        '联调-晋升领导力训练营',
        '联调-平台架构复盘课',
      ],
      excludeTitles: [],
    },
    capabilityManagement: {
      expectSuccess: true,
      expectedTotal: 2,
      includeNames: ['联调-平台岗位通用能力模型', '联调-销售岗位能力模型'],
      excludeNames: [],
      canMaintain: false,
      expectedPortraitEmployee: '平台员工',
    },
    certificateManagement: {
      expectSuccess: true,
      expectedTotal: 2,
      includeNames: ['联调-PMP认证', '联调-销售能力认证'],
      excludeNames: [],
      canIssue: false,
      recordExpectedTotal: 1,
      recordIncludeEmployees: ['平台员工'],
      recordExcludeEmployees: ['销售员工'],
    },
    courseLearning: {
      expectSuccess: false,
    },
  },
  {
    username: 'employee_platform',
    label: '普通员工',
    menu: {
      routesPresent: [
        '/performance/my-assessment',
        '/performance/goals',
        '/performance/course-learning',
      ],
      routesAbsent: [
        '/data-center/dashboard',
        '/performance/initiated',
        '/performance/pending',
        '/performance/indicator-library',
        '/performance/course',
        '/performance/capability',
        '/performance/certificate',
        '/performance/pip',
        '/performance/promotion',
        '/performance/salary',
        '/performance/meeting',
        '/performance/talentAsset',
      ],
      permsPresent: [
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:update',
        'performance:assessment:submit',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
        'performance:courseRecite:page',
        'performance:courseRecite:info',
        'performance:courseRecite:submit',
        'performance:coursePractice:page',
        'performance:coursePractice:info',
        'performance:coursePractice:submit',
        'performance:courseExam:summary',
      ],
      permsAbsent: [
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:add',
        'performance:assessment:delete',
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:assessment:export',
        'performance:course:page',
        'performance:course:info',
        'performance:course:enrollmentPage',
        'performance:capabilityModel:page',
        'performance:capabilityModel:info',
        'performance:capabilityItem:info',
        'performance:capabilityPortrait:info',
        'performance:capabilityModel:add',
        'performance:capabilityModel:update',
        'performance:certificate:page',
        'performance:certificate:info',
        'performance:certificate:add',
        'performance:certificate:update',
        'performance:certificate:issue',
        'performance:certificate:recordPage',
        'performance:goal:add',
        'performance:goal:delete',
        'performance:goal:export',
        'performance:feedback:export',
        'performance:indicator:page',
        'performance:pip:page',
        'performance:pip:export',
        'performance:promotion:page',
        'performance:salary:page',
        'performance:meeting:page',
        'performance:meeting:checkIn',
        'performance:talentAsset:page',
        'performance:talentAsset:info',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
        'performance:talentAsset:delete',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 4,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
        ],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: false,
        expectedMessage: '无权限查看已发起考核',
      },
      {
        mode: 'pending',
        expectSuccess: false,
        expectedMessage: '无权限查看待我审批',
      },
    ],
    dashboardSummary: {
      expectSuccess: false,
      expectedMessage: '无权限查看绩效驾驶舱',
    },
    crossSummary: {
      expectSuccess: false,
      expectedMessage: '无权限查看跨模块驾驶舱',
    },
    goalPage: {
      expectedTotal: 3,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
      ],
      excludeTitles: ['联调-销售中心隐藏目标'],
    },
    indicatorPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看指标库',
    },
    pipPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看 PIP',
    },
    feedbackExport: {
      expectSuccess: false,
      expectedMessage: '无权限导出该数据',
    },
    pipExport: {
      expectSuccess: false,
      expectedMessage: '无权限导出该数据',
    },
    promotionPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看晋升列表',
    },
    salaryPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看薪资管理',
    },
    meetingPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看会议列表',
    },
    talentAsset: {
      expectSuccess: false,
      expectedMessage: '无权限查看人才资产列表',
    },
    courseManagement: {
      expectSuccess: false,
      expectedMessage: '无权限查看课程列表',
    },
    capabilityManagement: {
      expectSuccess: false,
      expectedMessage: '无权限查看能力模型列表',
    },
    certificateManagement: {
      expectSuccess: false,
      expectedMessage: '无权限查看证书列表',
    },
    courseLearning: {
      expectSuccess: true,
      recite: {
        expectedTotal: 2,
        includeTitles: ['联调-主题14背诵任务-待提交', '联调-主题14背诵任务-已评估'],
        excludeTitles: ['联调-主题14背诵任务-销售员工'],
        submitTitle: '联调-主题14背诵任务-待提交',
        submitText: '阶段2联调补提交：我会先明确目标，再对齐预期，最后回收反馈并确认行动。',
        allowedPostSubmitStatuses: ['submitted', 'evaluated'],
      },
      practice: {
        expectedTotal: 2,
        includeTitles: ['联调-主题14练习任务-待提交', '联调-主题14练习任务-已评估'],
        excludeTitles: ['联调-主题14练习任务-销售员工'],
        submitTitle: '联调-主题14练习任务-待提交',
        submitText: '阶段2联调练习补提交：本次练习会聚焦目标拆解、风险说明和后续行动确认。',
        allowedPostSubmitStatuses: ['submitted', 'evaluated'],
      },
      exam: {
        expectedResultStatus: 'passed',
        expectedLatestScore: 95.5,
        expectedPassThreshold: 60,
        expectedSummaryText: '课程学习闭环已完成，可进入后续应用。',
      },
    },
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.STAGE2_SMOKE_BASE_URL || '',
    password: process.env.STAGE2_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.STAGE2_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }
    if (current === '--base-url') {
      options.baseUrl = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--password') {
      options.password = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--cache-dir') {
      options.cacheDir = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${current}`);
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set STAGE2_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/smoke-stage2-performance.mjs [--base-url URL] [--password PASS] [--cache-dir DIR]

Environment variables:
  STAGE2_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8061
  STAGE2_SMOKE_PASSWORD   Override shared password. Default: ${defaultPassword}
  STAGE2_SMOKE_CACHE_DIR  Override local cache directory resolved from src/config/config.default.ts

Notes:
  - This script only performs stage-2 smoke checks.
  - It depends on the current backend being reachable and the stage-2 seed data already loaded.
  - It does not modify login config, permissions middleware, or business data.`);
}

function resolveDefaultCacheDir() {
  const keyCandidates = [
    path.join(projectRoot, 'dist/config/config.default.js'),
    path.join(projectRoot, 'src/config/config.default.ts'),
  ];

  for (const candidate of keyCandidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const content = fs.readFileSync(candidate, 'utf8');
    const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
    if (matched?.[1]) {
      const projectHash = md5(matched[1]);
      return path.join(os.homedir(), '.cool-admin', projectHash, 'cache');
    }
  }

  throw new Error(
    'Unable to resolve cache directory from dist/config/config.default.js or src/config/config.default.ts'
  );
}

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function printSummary(reporter) {
  const stats = reporter.summary();
  console.log('');
  console.log('Summary');
  console.log(`PASS: ${stats.PASS}`);
  console.log(`FAIL: ${stats.FAIL}`);
  console.log(`SKIP: ${stats.SKIP}`);
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

class Reporter {
  constructor() {
    this.records = [];
  }

  pass(scope, detail) {
    this.records.push({ status: 'PASS', scope, detail });
    console.log(`[PASS] ${scope} - ${detail}`);
  }

  fail(scope, detail) {
    this.records.push({ status: 'FAIL', scope, detail });
    console.log(`[FAIL] ${scope} - ${detail}`);
  }

  skip(scope, detail) {
    this.records.push({ status: 'SKIP', scope, detail });
    console.log(`[SKIP] ${scope} - ${detail}`);
  }

  summary() {
    const stats = { PASS: 0, FAIL: 0, SKIP: 0 };
    for (const record of this.records) {
      stats[record.status] += 1;
    }
    return stats;
  }

  hasFailures() {
    return this.records.some(record => record.status === 'FAIL');
  }
}

async function requestJson(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const rawText = await response.text();
    let body;
    try {
      body = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      body = rawText;
    }
    return {
      status: response.status,
      ok: response.ok,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyRuntimePreflight(reporter, options) {
  const response = await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`);

  if (response.body?.code !== successCode) {
    reporter.fail('runtimeMeta', formatResponse(response.body));
    return false;
  }

  const runtimeMeta = response.body?.data;
  const allowRuntimeMismatch = process.env.STAGE2_SMOKE_ALLOW_RUNTIME_MISMATCH === '1';
  const problems = validateStage2RuntimeMeta(runtimeMeta, {
    expectedGitHash: resolveProjectGitHash(projectRoot),
    expectedSourceHash: resolveProjectSourceHash(projectRoot),
    expectedPort: resolveExpectedPort(options.baseUrl),
    requiredScopes: stage2PerformanceRequiredScopes,
  });
  const remainingProblems = allowRuntimeMismatch
    ? problems.filter(problem => {
        return (
          !problem.startsWith('gitHash mismatch expected ') &&
          !problem.startsWith('sourceHash mismatch expected ') &&
          !problem.startsWith('port mismatch expected ')
        );
      })
    : problems;

  if (remainingProblems.length) {
    reporter.fail('runtimeMeta', remainingProblems.join('; '));
    return false;
  }

  reporter.pass(
    'runtimeMeta',
    allowRuntimeMismatch && remainingProblems.length !== problems.length
      ? `git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version} (runtime fingerprint mismatch tolerated by STAGE2_SMOKE_ALLOW_RUNTIME_MISMATCH=1)`
      : `git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version}`
  );
  return true;
}

function shouldSkipRuntimeMismatchDbOverload(body) {
  if (process.env.STAGE2_SMOKE_ALLOW_RUNTIME_MISMATCH !== '1') {
    return false;
  }
  return body?.code === 1001 && String(body?.message || '').includes('Too many connections');
}

function cacheFilePath(cacheDir, key) {
  return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

async function readCaptchaValue(cacheDir, captchaId) {
  const key = `verify:img:${captchaId}`;
  const targetFile = cacheFilePath(cacheDir, key);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (fs.existsSync(targetFile)) {
      const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (parsed?.key === key && parsed?.val) {
        return {
          key,
          value: parsed.val,
          file: targetFile,
        };
      }
    }
    await sleep(100);
  }

  throw new Error(`Captcha cache file not found for ${captchaId} under ${cacheDir}`);
}

function flattenMenuRouters(menus = [], output = new Set()) {
  for (const menu of menus) {
    if (menu?.router) {
      output.add(menu.router);
    }
    flattenMenuRouters(menu?.childMenus || [], output);
  }
  return output;
}

function listCodes(responseBody) {
  return (responseBody?.data?.list || []).map(item => item.code).filter(Boolean);
}

function listTitles(responseBody) {
  return (responseBody?.data?.list || []).map(item => item.title).filter(Boolean);
}

function listNames(responseBody) {
  return (responseBody?.data?.list || []).map(item => item.name).filter(Boolean);
}

function listEmployeeNames(responseBody) {
  return (responseBody?.data?.list || [])
    .map(item => item.employeeName)
    .filter(Boolean);
}

function listItems(responseBody) {
  return responseBody?.data?.list || [];
}

function listPositions(responseBody) {
  return (responseBody?.data?.list || [])
    .map(item => item.toPosition)
    .filter(Boolean);
}

function listSalaryKeys(responseBody) {
  return (responseBody?.data?.list || [])
    .map(item => `${item.employeeName}:${item.status}`)
    .filter(Boolean);
}

function listStageKeys(responseBody) {
  return (responseBody?.data?.stageProgress || [])
    .map(item => item.stageKey)
    .filter(Boolean);
}

function listExportTitles(responseBody) {
  return (Array.isArray(responseBody?.data) ? responseBody.data : [])
    .map(item => item.title)
    .filter(Boolean);
}

function totalFromPage(responseBody) {
  return (
    responseBody?.data?.pagination?.total ??
    responseBody?.data?.total ??
    responseBody?.data?.list?.length ??
    0
  );
}

function validateDeniedResponse(response, expectedMessage) {
  if (response.body?.code === successCode) {
    return 'expected denial but request succeeded';
  }

  if (!expectedMessage) {
    return null;
  }

  const message = String(response.body?.message || '');
  if (!message.includes(expectedMessage)) {
    return `expected message "${expectedMessage}", got "${message}"`;
  }

  return null;
}

function collectForbiddenKeys(source, forbiddenKeys) {
  if (!source || typeof source !== 'object') {
    return [];
  }

  return forbiddenKeys.filter(key => Object.prototype.hasOwnProperty.call(source, key));
}

async function fetchCaptchaAndLogin(reporter, options, user) {
  const captchaScope = `${user.username} captcha`;
  const captchaResponse = await requestJson(
    `${options.baseUrl}/admin/base/open/captcha`
  );

  if (captchaResponse.body?.code !== successCode) {
    reporter.fail(
      captchaScope,
      `captcha API failed: ${formatResponse(captchaResponse.body)}`
    );
    return null;
  }

  const captchaId = captchaResponse.body?.data?.captchaId;
  const captchaData = captchaResponse.body?.data?.data;

  if (!captchaId || !String(captchaData || '').startsWith('data:image/svg+xml;base64,')) {
    reporter.fail(captchaScope, 'captcha response missing captchaId or svg payload');
    return null;
  }

  reporter.pass(captchaScope, `captchaId=${captchaId}`);

  try {
    const cached = await readCaptchaValue(options.cacheDir, captchaId);
    reporter.pass(
      `${user.username} captcha-cache`,
      `read ${cached.file} -> ${cached.value}`
    );

    const loginResponse = await requestJson(
      `${options.baseUrl}/admin/base/open/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: options.password,
          captchaId,
          verifyCode: cached.value,
        }),
      }
    );

    if (loginResponse.body?.code !== successCode) {
      reporter.fail(
        `${user.username} login`,
        formatResponse(loginResponse.body)
      );
      return null;
    }

    const token = loginResponse.body?.data?.token;
    if (!token) {
      reporter.fail(`${user.username} login`, 'login succeeded without token');
      return null;
    }

    reporter.pass(`${user.username} login`, 'token acquired');
    return { token };
  } catch (error) {
    reporter.fail(`${user.username} captcha-cache`, error.message);
    return null;
  }
}

async function verifyPermMenu(reporter, options, user, token) {
  const response = await requestJson(
    `${options.baseUrl}/admin/base/comm/permmenu`,
    {
      headers: { Authorization: token },
    }
  );

  if (response.body?.code !== successCode) {
    reporter.fail(`${user.username} permmenu`, formatResponse(response.body));
    return;
  }

  const routers = flattenMenuRouters(response.body?.data?.menus || []);
  const perms = new Set(response.body?.data?.perms || []);
  const problems = [];

  for (const route of user.menu.routesPresent) {
    if (!routers.has(route)) {
      problems.push(`missing route ${route}`);
    }
  }
  for (const route of user.menu.routesAbsent) {
    if (routers.has(route)) {
      problems.push(`unexpected route ${route}`);
    }
  }
  for (const perm of user.menu.permsPresent) {
    if (!perms.has(perm)) {
      problems.push(`missing perm ${perm}`);
    }
  }
  for (const perm of user.menu.permsAbsent) {
    if (perms.has(perm)) {
      problems.push(`unexpected perm ${perm}`);
    }
  }

  if (problems.length) {
    reporter.fail(`${user.username} permmenu`, problems.join('; '));
    return;
  }

  reporter.pass(
    `${user.username} permmenu`,
    `routes=${routers.size} perms=${perms.size}`
  );
}

async function verifyAssessmentPages(reporter, options, user, token) {
  for (const check of user.assessmentModes) {
    const scope = `${user.username} assessment:${check.mode}`;
    const response = await requestJson(
      `${options.baseUrl}/admin/performance/assessment/page`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 1,
          size: 20,
          mode: check.mode,
        }),
      }
    );

    if (!check.expectSuccess) {
      if (response.body?.code === successCode) {
        reporter.fail(scope, 'expected denial but request succeeded');
        continue;
      }
      const message = String(response.body?.message || '');
      if (!message.includes(check.expectedMessage)) {
        reporter.fail(scope, `expected message "${check.expectedMessage}", got "${message}"`);
        continue;
      }
      reporter.pass(scope, `denied as expected: ${message}`);
      continue;
    }

    if (response.body?.code !== successCode) {
      reporter.fail(scope, formatResponse(response.body));
      continue;
    }

    const total = totalFromPage(response.body);
    const codes = listCodes(response.body);
    const problems = [];

    if (total !== check.expectedTotal) {
      problems.push(`expected total ${check.expectedTotal}, got ${total}`);
    }

    for (const code of check.includeCodes) {
      if (!codes.includes(code)) {
        problems.push(`missing code ${code}`);
      }
    }

    for (const code of check.excludeCodes) {
      if (codes.includes(code)) {
        problems.push(`unexpected code ${code}`);
      }
    }

    if (problems.length) {
      reporter.fail(scope, problems.join('; '));
      continue;
    }

    reporter.pass(scope, `total=${total} codes=${codes.join(', ') || 'none'}`);
  }
}

async function verifyGoalPage(reporter, options, user, token) {
  const scope = `${user.username} goal:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/goal/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (response.body?.code !== successCode) {
    if (shouldSkipRuntimeMismatchDbOverload(response.body)) {
      reporter.skip(scope, `environment overload while using fallback runtime: ${formatResponse(response.body)}`);
      return;
    }
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const titles = listTitles(response.body);
  const problems = [];

  if (total !== user.goalPage.expectedTotal) {
    problems.push(`expected total ${user.goalPage.expectedTotal}, got ${total}`);
  }

  for (const title of user.goalPage.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of user.goalPage.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
}

async function verifyDashboardSummary(reporter, options, user, token) {
  const config = user.dashboardSummary;
  const scope = `${user.username} dashboard:summary`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/summary`
      + '?periodType=quarter&periodValue=2026-Q2',
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    if (shouldSkipRuntimeMismatchDbOverload(response.body)) {
      reporter.skip(scope, `environment overload while using fallback runtime: ${formatResponse(response.body)}`);
      return;
    }
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const data = response.body?.data || {};
  const stageKeys = listStageKeys(response.body);
  const requiredStageKeys = [
    'indicatorConfigured',
    'assessmentCreated',
    'selfSubmitted',
    'managerApproved',
    'resultArchived',
  ];
  const problems = [];

  if (typeof data.averageScore !== 'number') {
    problems.push('averageScore is not a number');
  }
  if (typeof data.pendingApprovalCount !== 'number') {
    problems.push('pendingApprovalCount is not a number');
  }
  if (typeof data.goalCompletionRate !== 'number') {
    problems.push('goalCompletionRate is not a number');
  }
  if (!Array.isArray(data.departmentDistribution)) {
    problems.push('departmentDistribution is not an array');
  }
  if (!Array.isArray(data.gradeDistribution)) {
    problems.push('gradeDistribution is not an array');
  }
  if (!Array.isArray(data.stageProgress) || data.stageProgress.length !== 5) {
    problems.push(`expected 5 stageProgress items, got ${data.stageProgress?.length ?? 'invalid'}`);
  }

  for (const key of requiredStageKeys) {
    if (!stageKeys.includes(key)) {
      problems.push(`missing stageKey ${key}`);
    }
  }

  if (data.gradeDistribution?.length !== 4) {
    problems.push(`expected 4 grade buckets, got ${data.gradeDistribution?.length ?? 'invalid'}`);
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(
    scope,
    `stageKeys=${stageKeys.join(', ')} pending=${data.pendingApprovalCount}`
  );

  if (!config.expectEmptyScope) {
    return;
  }

  const emptyScope = `${user.username} dashboard:summary:out-of-scope`;
  const emptyResponse = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/summary`
      + '?periodType=quarter&periodValue=2026-Q2&departmentId=999999',
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (emptyResponse.body?.code !== successCode) {
    if (shouldSkipRuntimeMismatchDbOverload(emptyResponse.body)) {
      reporter.skip(emptyScope, `environment overload while using fallback runtime: ${formatResponse(emptyResponse.body)}`);
      return;
    }
    reporter.fail(emptyScope, formatResponse(emptyResponse.body));
    return;
  }

  const emptyData = emptyResponse.body?.data || {};
  const emptyProblems = [];

  if (emptyData.averageScore !== 0) {
    emptyProblems.push(`expected averageScore 0, got ${emptyData.averageScore}`);
  }
  if (emptyData.pendingApprovalCount !== 0) {
    emptyProblems.push(
      `expected pendingApprovalCount 0, got ${emptyData.pendingApprovalCount}`
    );
  }
  if (emptyData.goalCompletionRate !== 0) {
    emptyProblems.push(`expected goalCompletionRate 0, got ${emptyData.goalCompletionRate}`);
  }
  if ((emptyData.departmentDistribution || []).length !== 0) {
    emptyProblems.push('expected empty departmentDistribution');
  }
  if ((emptyData.stageProgress || []).some(item => item.totalCount !== 0 || item.completedCount !== 0)) {
    emptyProblems.push('expected empty stageProgress counts for out-of-scope department');
  }

  if (emptyProblems.length) {
    reporter.fail(emptyScope, emptyProblems.join('; '));
    return;
  }

  reporter.pass(emptyScope, 'empty scope summary returned as expected');
}

async function verifyCrossSummary(reporter, options, user, token) {
  const config = user.crossSummary;
  const scope = `${user.username} dashboard:crossSummary`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/crossSummary`
      + '?periodType=quarter&periodValue=2026-Q2'
      + (config.expectedDepartmentId ? `&departmentId=${config.expectedDepartmentId}` : ''),
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const cards = response.body?.data?.metricCards || [];
  const problems = [];
  const requiredCodes = [
    'recruitment_completion_rate',
    'training_pass_rate',
    'meeting_effectiveness_index',
  ];

  if (!Array.isArray(cards) || cards.length !== 3) {
    problems.push(`expected 3 metricCards, got ${cards?.length ?? 'invalid'}`);
  }

  const codes = cards.map(item => item.metricCode);

  for (const code of requiredCodes) {
    if (!codes.includes(code)) {
      problems.push(`missing metricCode ${code}`);
    }
  }

  for (const item of cards) {
    if (item.metricValue !== null && typeof item.metricValue !== 'number') {
      problems.push(`metricValue type invalid for ${item.metricCode}`);
    }
    if (item.scopeType !== config.expectedScopeType) {
      problems.push(
        `expected scopeType ${config.expectedScopeType} for ${item.metricCode}, got ${item.scopeType}`
      );
    }
    if (item.updatedAt !== null && typeof item.updatedAt !== 'string') {
      problems.push(`updatedAt type invalid for ${item.metricCode}`);
    }
    if (!['ready', 'delayed', 'unavailable'].includes(item.dataStatus)) {
      problems.push(`dataStatus invalid for ${item.metricCode}: ${item.dataStatus}`);
    }
    if (typeof item.statusText !== 'string' || !item.statusText) {
      problems.push(`statusText invalid for ${item.metricCode}`);
    }
    if (typeof item.unit !== 'string') {
      problems.push(`unit type invalid for ${item.metricCode}`);
    }
    if (item.periodType !== 'quarter' || item.periodValue !== '2026-Q2') {
      problems.push(`period echo invalid for ${item.metricCode}`);
    }
  }

  if (config.expectedDepartmentId) {
    for (const item of cards) {
      if (item.departmentId !== config.expectedDepartmentId) {
        problems.push(
          `expected departmentId ${config.expectedDepartmentId} for ${item.metricCode}, got ${item.departmentId}`
        );
      }
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `codes=${codes.join(', ')} scopeType=${config.expectedScopeType}`);

  if (!config.expectDeniedDepartment) {
    return;
  }

  const deniedScope = `${user.username} dashboard:crossSummary:out-of-scope`;
  const deniedResponse = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/crossSummary`
      + '?periodType=quarter&periodValue=2026-Q2&departmentId=999999',
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (deniedResponse.body?.code === successCode) {
    reporter.fail(deniedScope, 'expected denial for out-of-scope department but request succeeded');
    return;
  }

  const message = String(deniedResponse.body?.message || '');

  if (!message.includes('无权查看该部门范围跨模块驾驶舱')) {
    reporter.fail(
      deniedScope,
      `expected out-of-scope denial message, got "${message}"`
    );
    return;
  }

  reporter.pass(deniedScope, `denied as expected: ${message}`);
}

async function verifyIndicatorPage(reporter, options, user, token) {
  const config = user.indicatorPage;
  const scope = `${user.username} indicator:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/indicator/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const codes = listCodes(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const code of config.includeCodes) {
    if (!codes.includes(code)) {
      problems.push(`missing code ${code}`);
    }
  }

  for (const code of config.excludeCodes) {
    if (codes.includes(code)) {
      problems.push(`unexpected code ${code}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} codes=${codes.join(', ')}`);

  if (!config.enabledFilter) {
    return;
  }

  const filterScope = `${user.username} indicator:page:enabled`;
  const filterResponse = await requestJson(
    `${options.baseUrl}/admin/performance/indicator/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        status: 1,
      }),
    }
  );

  if (filterResponse.body?.code !== successCode) {
    reporter.fail(filterScope, formatResponse(filterResponse.body));
    return;
  }

  const filterTotal = totalFromPage(filterResponse.body);
  const filterCodes = listCodes(filterResponse.body);
  const filterProblems = [];

  if (filterTotal !== config.enabledFilter.expectedTotal) {
    filterProblems.push(
      `expected total ${config.enabledFilter.expectedTotal}, got ${filterTotal}`
    );
  }

  for (const code of config.enabledFilter.includeCodes) {
    if (!filterCodes.includes(code)) {
      filterProblems.push(`missing code ${code}`);
    }
  }

  for (const code of config.enabledFilter.excludeCodes) {
    if (filterCodes.includes(code)) {
      filterProblems.push(`unexpected code ${code}`);
    }
  }

  if (filterProblems.length) {
    reporter.fail(filterScope, filterProblems.join('; '));
    return;
  }

  reporter.pass(filterScope, `total=${filterTotal} codes=${filterCodes.join(', ')}`);
}

async function verifyPipPage(reporter, options, user, token) {
  const config = user.pipPage;
  const scope = `${user.username} pip:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/pip/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: '联调-PIP-',
    }),
  });

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const titles = listTitles(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
}

async function verifyFeedbackExport(reporter, options, user, token) {
  const config = user.feedbackExport;
  const scope = `${user.username} feedback:export`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/feedback/export`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: '联调-平台组360反馈任务',
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const list = Array.isArray(response.body?.data) ? response.body.data : [];
  const titles = listExportTitles(response.body);
  const problems = [];

  if (list.length !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${list.length}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  const sample = list[0] || {};
  for (const key of config.forbiddenKeys) {
    if (key in sample) {
      problems.push(`unexpected field ${key}`);
    }
  }

  if (typeof sample.averageScore !== 'number') {
    problems.push('averageScore is not a number');
  }
  if (typeof sample.submittedCount !== 'number') {
    problems.push('submittedCount is not a number');
  }
  if (typeof sample.totalCount !== 'number') {
    problems.push('totalCount is not a number');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${list.length} titles=${titles.join(', ')}`);
}

async function verifyPipExport(reporter, options, user, token) {
  const config = user.pipExport;
  const scope = `${user.username} pip:export`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/pip/export`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: '联调-PIP-',
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const list = Array.isArray(response.body?.data) ? response.body.data : [];
  const titles = listExportTitles(response.body);
  const problems = [];

  if (list.length !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${list.length}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  const sample = list[0] || {};
  for (const key of config.forbiddenKeys) {
    if (key in sample) {
      problems.push(`unexpected field ${key}`);
    }
  }

  if (typeof sample.employeeName !== 'string' || !sample.employeeName) {
    problems.push('employeeName is missing');
  }
  if (typeof sample.ownerName !== 'string' || !sample.ownerName) {
    problems.push('ownerName is missing');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${list.length} titles=${titles.join(', ')}`);
}

async function verifyPromotionPage(reporter, options, user, token) {
  const config = user.promotionPage;
  const scope = `${user.username} promotion:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/promotion/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        toPosition: '阶段2-',
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const positions = listPositions(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const position of config.includePositions) {
    if (!positions.includes(position)) {
      problems.push(`missing position ${position}`);
    }
  }

  for (const position of config.excludePositions) {
    if (positions.includes(position)) {
      problems.push(`unexpected position ${position}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} positions=${positions.join(', ')}`);
}

async function verifySalaryPage(reporter, options, user, token) {
  const config = user.salaryPage;
  const scope = `${user.username} salary:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/salary/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      periodValue: '2026-STAGE2-Q2',
    }),
  });

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const keys = listSalaryKeys(response.body);
  const list = response.body?.data?.list || [];
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const key of config.includeKeys) {
    if (!keys.includes(key)) {
      problems.push(`missing row ${key}`);
    }
  }

  for (const key of config.excludeKeys) {
    if (keys.includes(key)) {
      problems.push(`unexpected row ${key}`);
    }
  }

  if (config.expectSensitiveFields) {
    const sample = list[0] || {};
    if (
      typeof sample.baseSalary !== 'number' ||
      typeof sample.performanceBonus !== 'number' ||
      typeof sample.adjustAmount !== 'number' ||
      typeof sample.finalAmount !== 'number'
    ) {
      problems.push('sensitive salary fields are not visible to HR');
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} rows=${keys.join(', ')}`);
}

async function verifyMeetingPage(reporter, options, user, token) {
  const config = user.meetingPage;
  const scope = `${user.username} meeting:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/meeting/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
    }),
  });

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const list = response.body?.data?.list || [];
  const titles = listTitles(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing meeting ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected meeting ${title}`);
    }
  }

  if (
    list.some(
      item =>
        Object.prototype.hasOwnProperty.call(item, 'participantIds') ||
        typeof item.participantCount !== 'number'
    )
  ) {
    problems.push('page response leaked participantIds or participantCount is missing');
  }

  const detailTarget =
    list.find(item => item.title === config.checkInTitle) || list[0] || null;

  if (!detailTarget?.id) {
    problems.push('missing detail target meeting');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);

  const infoScope = `${user.username} meeting:info`;
  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/meeting/info?id=${detailTarget.id}`,
    {
      headers: { Authorization: token },
    }
  );

  if (infoResponse.body?.code !== successCode) {
    reporter.fail(infoScope, formatResponse(infoResponse.body));
    return;
  }

  const infoData = infoResponse.body?.data || {};
  if (
    Object.prototype.hasOwnProperty.call(infoData, 'participantIds') ||
    typeof infoData.participantCount !== 'number'
  ) {
    reporter.fail(infoScope, 'info response leaked participantIds or participantCount is missing');
    return;
  }

  reporter.pass(infoScope, `participantCount=${infoData.participantCount}`);

  if (!config.checkInTitle) {
    return;
  }

  const checkInScope = `${user.username} meeting:checkIn`;
  const checkInResponse = await requestJson(
    `${options.baseUrl}/admin/performance/meeting/checkIn`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: detailTarget.id,
      }),
    }
  );

  if (checkInResponse.body?.code !== successCode) {
    reporter.fail(checkInScope, formatResponse(checkInResponse.body));
    return;
  }

  const checkInData = checkInResponse.body?.data || {};
  if (
    Object.prototype.hasOwnProperty.call(checkInData, 'participantIds') ||
    typeof checkInData.participantCount !== 'number'
  ) {
    reporter.fail(checkInScope, 'checkIn response leaked participantIds or participantCount is missing');
    return;
  }

  reporter.pass(checkInScope, `participantCount=${checkInData.participantCount}`);
}

async function verifyTalentAssetManagement(reporter, options, user, token) {
  const config = user.talentAsset;
  const scope = `${user.username} talentAsset:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/talentAsset/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: '联调-主题12',
    }),
  });

  if (!config.expectSuccess) {
    const problem = validateDeniedResponse(response, config.expectedMessage);
    if (problem) {
      reporter.fail(scope, problem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const list = listItems(response.body);
  const names = list
    .map(item => item.candidateName)
    .filter(Boolean);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const name of config.includeNames) {
    if (!names.includes(name)) {
      problems.push(`missing talentAsset ${name}`);
    }
  }

  for (const name of config.excludeNames) {
    if (names.includes(name)) {
      problems.push(`unexpected talentAsset ${name}`);
    }
  }

  const infoTarget = list.find(item => item.candidateName === config.infoName) || list[0] || null;

  if (!infoTarget?.id) {
    problems.push('missing talentAsset info target');
  }

  const pageForbiddenKeys = ['phone', 'mobile', 'email', 'wechat', 'resumeText', 'attachments'];
  const leakedPageFields = list.flatMap(item => collectForbiddenKeys(item, pageForbiddenKeys));

  if (leakedPageFields.length) {
    problems.push(`page leaked forbidden fields: ${[...new Set(leakedPageFields)].join(', ')}`);
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} names=${names.join(', ')}`);

  const infoScope = `${user.username} talentAsset:info`;
  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/talentAsset/info?id=${infoTarget.id}`,
    {
      headers: { Authorization: token },
    }
  );

  if (infoResponse.body?.code !== successCode) {
    reporter.fail(infoScope, formatResponse(infoResponse.body));
    return;
  }

  const infoData = infoResponse.body?.data || {};
  const infoForbiddenKeys = [
    'phone',
    'mobile',
    'email',
    'wechat',
    'address',
    'idCardNo',
    'passportNo',
    'resumeText',
    'resumeUrl',
    'attachments',
  ];
  const leakedInfoFields = collectForbiddenKeys(infoData, infoForbiddenKeys);

  if (leakedInfoFields.length) {
    reporter.fail(infoScope, `info leaked forbidden fields: ${leakedInfoFields.join(', ')}`);
    return;
  }

  if (!infoData.targetDepartmentName) {
    reporter.fail(infoScope, 'targetDepartmentName is missing');
    return;
  }

  reporter.pass(
    infoScope,
    `candidate=${infoData.candidateName} department=${infoData.targetDepartmentName}`
  );

  if (config.canUpdate) {
    const updateScope = `${user.username} talentAsset:update`;
    const updateResponse = await requestJson(
      `${options.baseUrl}/admin/performance/talentAsset/update`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: infoTarget.id,
          followUpSummary: '主题12 smoke：经理范围内更新已完成。',
          status: 'tracking',
        }),
      }
    );

    if (updateResponse.body?.code !== successCode) {
      reporter.fail(updateScope, formatResponse(updateResponse.body));
      return;
    }

    const updateData = updateResponse.body?.data || {};
    if (updateData.status !== 'tracking') {
      reporter.fail(updateScope, `expected tracking, got ${updateData.status}`);
      return;
    }

    reporter.pass(updateScope, `id=${updateData.id} status=${updateData.status}`);

    const deniedAddScope = `${user.username} talentAsset:add:out-of-scope`;
    const deniedAddResponse = await requestJson(
      `${options.baseUrl}/admin/performance/talentAsset/add`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: '烟测-主题12越权人才',
          code: null,
          targetDepartmentId: config.outOfScopeDepartmentId,
          targetPosition: '销售顾问',
          source: '烟测',
          tagList: ['越权'],
          followUpSummary: '不应创建成功',
          nextFollowUpDate: '2026-05-10',
        }),
      }
    );

    const addProblem = validateDeniedResponse(deniedAddResponse, '无权操作该人才资产');
    if (addProblem) {
      reporter.fail(deniedAddScope, addProblem);
      return;
    }

    reporter.pass(deniedAddScope, `denied as expected: ${deniedAddResponse.body?.message}`);
  }

  if (config.canDelete) {
    const addScope = `${user.username} talentAsset:add`;
    const tempCode = `PMS-TALENT-SMOKE-${Date.now()}`;
    const addResponse = await requestJson(
      `${options.baseUrl}/admin/performance/talentAsset/add`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: '烟测-主题12删除样例',
          code: tempCode,
          targetDepartmentId: Number(infoData.targetDepartmentId),
          targetPosition: '平台工程师',
          source: '烟测',
          tagList: ['删除校验'],
          followUpSummary: '用于验证 HR 删除链路。',
          nextFollowUpDate: '2026-05-09',
        }),
      }
    );

    if (addResponse.body?.code !== successCode) {
      reporter.fail(addScope, formatResponse(addResponse.body));
      return;
    }

    const created = addResponse.body?.data || {};
    if (created.status !== 'new') {
      reporter.fail(addScope, `expected new, got ${created.status}`);
      return;
    }

    reporter.pass(addScope, `id=${created.id} code=${created.code || tempCode}`);

    const deleteScope = `${user.username} talentAsset:delete`;
    const deleteResponse = await requestJson(
      `${options.baseUrl}/admin/performance/talentAsset/delete`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [created.id],
        }),
      }
    );

    if (deleteResponse.body?.code !== successCode) {
      reporter.fail(deleteScope, formatResponse(deleteResponse.body));
      return;
    }

    reporter.pass(deleteScope, `deleted id=${created.id}`);
    return;
  }

  const deniedDeleteScope = `${user.username} talentAsset:delete`;
  const deniedDeleteResponse = await requestJson(
    `${options.baseUrl}/admin/performance/talentAsset/delete`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [infoTarget.id],
      }),
    }
  );

  const deleteProblem = validateDeniedResponse(deniedDeleteResponse, '无权限删除人才资产');
  if (deleteProblem) {
    reporter.fail(deniedDeleteScope, deleteProblem);
    return;
  }

  reporter.pass(deniedDeleteScope, `denied as expected: ${deniedDeleteResponse.body?.message}`);
}

async function resolveLearningCourseContext(reporter, options, token, runtimeState) {
  if (runtimeState.courseId) {
    return runtimeState;
  }

  const scope = 'fixture course-learning-context';
  const response = await requestJson(`${options.baseUrl}/admin/performance/course/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: stage2LearningCourseCode,
    }),
  });

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const target = listItems(response.body).find(
    item => item.code === stage2LearningCourseCode
  );

  if (!target?.id) {
    reporter.fail(scope, `missing seeded course ${stage2LearningCourseCode}`);
    return null;
  }

  runtimeState.courseId = Number(target.id);
  runtimeState.courseTitle = target.title;
  reporter.pass(scope, `courseId=${runtimeState.courseId} title=${runtimeState.courseTitle}`);
  return runtimeState;
}

async function verifyCourseManagementPage(reporter, options, user, token, runtimeState) {
  const config = user.courseManagement;
  const scope = `${user.username} course:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/course/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: '联调-',
    }),
  });

  if (!config.expectSuccess) {
    const deniedProblem = validateDeniedResponse(response, config.expectedMessage);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const titles = listTitles(response.body);
  const list = listItems(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing course ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected course ${title}`);
    }
  }

  const learningCourse = list.find(item => item.code === stage2LearningCourseCode);
  if (!learningCourse?.id) {
    problems.push(`missing seeded course ${stage2LearningCourseCode}`);
  } else if (!runtimeState.courseId) {
    runtimeState.courseId = Number(learningCourse.id);
    runtimeState.courseTitle = learningCourse.title;
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
}

async function verifyCapabilityManagement(reporter, options, user, token) {
  const config = user.capabilityManagement;
  const scope = `${user.username} capabilityModel:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/capabilityModel/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (!config.expectSuccess) {
    const deniedProblem = validateDeniedResponse(response, config.expectedMessage);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const names = listNames(response.body);
  const firstRow = listItems(response.body)[0];
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const name of config.includeNames) {
    if (!names.includes(name)) {
      problems.push(`missing model ${name}`);
    }
  }

  for (const name of config.excludeNames) {
    if (names.includes(name)) {
      problems.push(`unexpected model ${name}`);
    }
  }

  if (!firstRow?.id) {
    problems.push('capability page did not return an id');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/capabilityModel/info?id=${firstRow.id}`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (infoResponse.body?.code !== successCode) {
    reporter.fail(`${user.username} capabilityModel:info`, formatResponse(infoResponse.body));
    return;
  }

  const detail = infoResponse.body?.data || {};
  if (Array.isArray(detail.items) || Object.prototype.hasOwnProperty.call(detail, 'resume')) {
    reporter.fail(`${user.username} capabilityModel:info`, 'detail leaked non-frozen fields');
    return;
  }

  if (!config.canMaintain) {
    const deniedResponse = await requestJson(
      `${options.baseUrl}/admin/performance/capabilityModel/add`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'smoke-deny-check',
        }),
      }
    );

    if (deniedResponse.body?.code === successCode) {
      reporter.fail(`${user.username} capabilityModel:add`, 'expected denial but request succeeded');
      return;
    }
  }

  reporter.pass(scope, `total=${total} names=${names.join(', ')}`);
}

async function verifyCertificateManagement(reporter, options, user, token) {
  const config = user.certificateManagement;
  const scope = `${user.username} certificate:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/certificate/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (!config.expectSuccess) {
    const deniedProblem = validateDeniedResponse(response, config.expectedMessage);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const names = listNames(response.body);
  const firstCertificate = listItems(response.body)[0];
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const name of config.includeNames) {
    if (!names.includes(name)) {
      problems.push(`missing certificate ${name}`);
    }
  }

  for (const name of config.excludeNames) {
    if (names.includes(name)) {
      problems.push(`unexpected certificate ${name}`);
    }
  }

  if (!firstCertificate?.id) {
    problems.push('certificate page did not return an id');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/certificate/info?id=${firstCertificate.id}`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (infoResponse.body?.code !== successCode) {
    reporter.fail(`${user.username} certificate:info`, formatResponse(infoResponse.body));
    return;
  }

  const detail = infoResponse.body?.data || {};
  if (
    Object.prototype.hasOwnProperty.call(detail, 'attachmentUrl') ||
    Object.prototype.hasOwnProperty.call(detail, 'remark')
  ) {
    reporter.fail(`${user.username} certificate:info`, 'detail leaked non-frozen fields');
    return;
  }

  const recordResponse = await requestJson(
    `${options.baseUrl}/admin/performance/certificate/recordPage`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (recordResponse.body?.code !== successCode) {
    reporter.fail(`${user.username} certificate:recordPage`, formatResponse(recordResponse.body));
    return;
  }

  const recordTotal = totalFromPage(recordResponse.body);
  const recordItems = listItems(recordResponse.body);
  const employeeNames = listEmployeeNames(recordResponse.body);
  const firstRecord = recordItems[0];
  const recordProblems = [];

  if (recordTotal !== config.recordExpectedTotal) {
    recordProblems.push(`expected record total ${config.recordExpectedTotal}, got ${recordTotal}`);
  }

  for (const name of config.recordIncludeEmployees) {
    if (!employeeNames.includes(name)) {
      recordProblems.push(`missing employee ${name}`);
    }
  }

  for (const name of config.recordExcludeEmployees) {
    if (employeeNames.includes(name)) {
      recordProblems.push(`unexpected employee ${name}`);
    }
  }

  if (firstRecord && Object.prototype.hasOwnProperty.call(firstRecord, 'remark')) {
    recordProblems.push('record page leaked remark');
  }

  if (recordProblems.length) {
    reporter.fail(`${user.username} certificate:recordPage`, recordProblems.join('; '));
    return;
  }

  const portraitTargetRecord =
    recordItems.find(item => item.employeeName === config.recordIncludeEmployees[0]) ||
    firstRecord;

  if (portraitTargetRecord?.employeeId) {
    const portraitResponse = await requestJson(
      `${options.baseUrl}/admin/performance/capabilityPortrait/info?employeeId=${portraitTargetRecord.employeeId}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    if (portraitResponse.body?.code !== successCode) {
      reporter.fail(
        `${user.username} capabilityPortrait:info`,
        formatResponse(portraitResponse.body)
      );
      return;
    }

    const portrait = portraitResponse.body?.data || {};
    if (portrait.employeeName !== portraitTargetRecord.employeeName) {
      reporter.fail(
        `${user.username} capabilityPortrait:info`,
        `unexpected employee ${portrait.employeeName}`
      );
      return;
    }
  }

  if (!config.canIssue) {
    const deniedResponse = await requestJson(
      `${options.baseUrl}/admin/performance/certificate/issue`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateId: firstCertificate.id,
          employeeId: firstRecord?.employeeId || 1,
          issuedAt: '2026-05-15 10:00:00',
        }),
      }
    );

    if (deniedResponse.body?.code === successCode) {
      reporter.fail(`${user.username} certificate:issue`, 'expected denial but request succeeded');
      return;
    }
  }

  reporter.pass(
    scope,
    `total=${total} names=${names.join(', ')} records=${employeeNames.join(', ')}`
  );
}

async function verifyLearningTaskFlow(
  reporter,
  options,
  token,
  runtimeState,
  user,
  taskKind,
  config
) {
  const resourceName = taskKind === 'recite' ? 'courseRecite' : 'coursePractice';
  const scope = `${user.username} ${resourceName}:page`;
  const pageResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${resourceName}/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        courseId: runtimeState.courseId,
      }),
    }
  );

  if (!user.courseLearning.expectSuccess) {
    const deniedProblem = validateDeniedResponse(pageResponse);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(pageResponse.body)}`);
    return;
  }

  if (pageResponse.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(pageResponse.body));
    return;
  }

  const total = totalFromPage(pageResponse.body);
  const titles = listTitles(pageResponse.body);
  const list = listItems(pageResponse.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing task ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected task ${title}`);
    }
  }

  for (const item of list) {
    if (Number(item.courseId) !== Number(runtimeState.courseId)) {
      problems.push(`task ${item.title} returned unexpected courseId ${item.courseId}`);
    }
    if (item.taskType !== taskKind) {
      problems.push(`task ${item.title} returned taskType=${item.taskType}`);
    }
    if (Object.prototype.hasOwnProperty.call(item, 'submissionText')) {
      problems.push(`page response leaked submissionText for ${item.title}`);
    }
    const leakedKeys = collectForbiddenKeys(item, learningForbiddenKeys);
    if (leakedKeys.length) {
      problems.push(`page response leaked ${leakedKeys.join(', ')} for ${item.title}`);
    }
  }

  const submitTarget = list.find(item => item.title === config.submitTitle) || null;
  if (!submitTarget?.id) {
    problems.push(`missing submit target ${config.submitTitle}`);
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);

  const infoScope = `${user.username} ${resourceName}:info`;
  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${resourceName}/info?id=${submitTarget.id}`,
    {
      headers: { Authorization: token },
    }
  );

  if (infoResponse.body?.code !== successCode) {
    reporter.fail(infoScope, formatResponse(infoResponse.body));
    return;
  }

  const infoData = infoResponse.body?.data || {};
  const infoProblems = [];

  if (Number(infoData.courseId) !== Number(runtimeState.courseId)) {
    infoProblems.push(`expected courseId ${runtimeState.courseId}, got ${infoData.courseId}`);
  }
  if (infoData.taskType !== taskKind) {
    infoProblems.push(`expected taskType ${taskKind}, got ${infoData.taskType}`);
  }
  if (infoData.title !== config.submitTitle) {
    infoProblems.push(`expected title ${config.submitTitle}, got ${infoData.title}`);
  }
  if (typeof infoData.promptText !== 'string' || !infoData.promptText) {
    infoProblems.push('promptText is missing');
  }
  const leakedInfoKeys = collectForbiddenKeys(infoData, learningForbiddenKeys);
  if (leakedInfoKeys.length) {
    infoProblems.push(`info response leaked ${leakedInfoKeys.join(', ')}`);
  }

  if (infoProblems.length) {
    reporter.fail(infoScope, infoProblems.join('; '));
    return;
  }

  reporter.pass(infoScope, `title=${infoData.title} status=${infoData.status}`);

  const submitScope = `${user.username} ${resourceName}:submit`;
  if (config.allowedPostSubmitStatuses.includes(infoData.status)) {
    reporter.pass(submitScope, `already ${infoData.status}`);
    reporter.pass(`${user.username} ${resourceName}:post-submit`, `status=${infoData.status}`);
    return;
  }

  const submitResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${resourceName}/submit`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: submitTarget.id,
        submissionText: config.submitText,
      }),
    }
  );

  if (submitResponse.body?.code !== successCode) {
    reporter.fail(submitScope, formatResponse(submitResponse.body));
    return;
  }

  const submitData = submitResponse.body?.data || {};
  const leakedSubmitKeys = collectForbiddenKeys(submitData, learningForbiddenKeys);
  if (leakedSubmitKeys.length) {
    reporter.fail(submitScope, `submit response leaked ${leakedSubmitKeys.join(', ')}`);
    return;
  }

  reporter.pass(submitScope, 'submit accepted');

  const postInfoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${resourceName}/info?id=${submitTarget.id}`,
    {
      headers: { Authorization: token },
    }
  );

  const postInfoScope = `${user.username} ${resourceName}:post-submit`;
  if (postInfoResponse.body?.code !== successCode) {
    reporter.fail(postInfoScope, formatResponse(postInfoResponse.body));
    return;
  }

  const postInfoData = postInfoResponse.body?.data || {};
  if (!config.allowedPostSubmitStatuses.includes(postInfoData.status)) {
    reporter.fail(
      postInfoScope,
      `expected status in ${config.allowedPostSubmitStatuses.join(', ')}, got ${postInfoData.status}`
    );
    return;
  }

  reporter.pass(postInfoScope, `status=${postInfoData.status}`);
}

async function verifyCourseLearning(reporter, options, user, token, runtimeState) {
  let context = runtimeState;
  if (!context.courseId) {
    context = await resolveLearningCourseContext(reporter, options, token, runtimeState);
  }

  if (!context?.courseId) {
    reporter.skip(`${user.username} courseLearning`, 'skipped because learning course context is unavailable');
    return;
  }

  await verifyLearningTaskFlow(
    reporter,
    options,
    token,
    context,
    user,
    'recite',
    user.courseLearning.recite || {}
  );

  await verifyLearningTaskFlow(
    reporter,
    options,
    token,
    context,
    user,
    'practice',
    user.courseLearning.practice || {}
  );

  const examScope = `${user.username} courseExam:summary`;
  const examResponse = await requestJson(
    `${options.baseUrl}/admin/performance/courseExam/summary?courseId=${context.courseId}`,
    {
      headers: { Authorization: token },
    }
  );

  if (!user.courseLearning.expectSuccess) {
    const deniedProblem = validateDeniedResponse(examResponse);
    if (deniedProblem) {
      reporter.fail(examScope, deniedProblem);
      return;
    }
    reporter.pass(examScope, `denied as expected: ${formatResponse(examResponse.body)}`);
    return;
  }

  if (examResponse.body?.code !== successCode) {
    reporter.fail(examScope, formatResponse(examResponse.body));
    return;
  }

  const examData = examResponse.body?.data || {};
  const problems = [];
  const config = user.courseLearning.exam;

  if (Number(examData.courseId) !== Number(context.courseId)) {
    problems.push(`expected courseId ${context.courseId}, got ${examData.courseId}`);
  }
  if (examData.courseTitle !== context.courseTitle) {
    problems.push(`expected courseTitle ${context.courseTitle}, got ${examData.courseTitle}`);
  }
  if (examData.resultStatus !== config.expectedResultStatus) {
    problems.push(`expected resultStatus ${config.expectedResultStatus}, got ${examData.resultStatus}`);
  }
  if (Number(examData.latestScore) !== config.expectedLatestScore) {
    problems.push(`expected latestScore ${config.expectedLatestScore}, got ${examData.latestScore}`);
  }
  if (Number(examData.passThreshold) !== config.expectedPassThreshold) {
    problems.push(`expected passThreshold ${config.expectedPassThreshold}, got ${examData.passThreshold}`);
  }
  if (examData.summaryText !== config.expectedSummaryText) {
    problems.push(`expected summaryText ${config.expectedSummaryText}, got ${examData.summaryText}`);
  }
  const leakedKeys = collectForbiddenKeys(examData, learningForbiddenKeys);
  if (leakedKeys.length) {
    problems.push(`summary response leaked ${leakedKeys.join(', ')}`);
  }

  if (problems.length) {
    reporter.fail(examScope, problems.join('; '));
    return;
  }

  reporter.pass(examScope, `status=${examData.resultStatus} score=${examData.latestScore}`);
}

function userHasPerm(user, perm) {
  return Boolean(user?.menu?.permsPresent?.includes(perm));
}

async function verifyAssetDashboardSummary(reporter, options, user, token) {
  const scope = `${user.username} assetDashboard:summary`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/assetDashboard/summary`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!userHasPerm(user, 'performance:assetDashboard:summary')) {
    const denied = validateDeniedResponse(response, '无权限查看资产首页');
    if (denied) {
      reporter.fail(scope, denied);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const data = response.body?.data || {};
  const numericFields = [
    'totalAssetCount',
    'pendingInboundCount',
    'availableCount',
    'assignedCount',
    'maintenanceCount',
    'inventoryingCount',
    'scrappedCount',
    'lostCount',
    'totalOriginalAmount',
    'monthlyDepreciationAmount',
    'pendingDisposalCount',
    'expiringWarrantyCount',
  ];
  const problems = [];

  for (const field of numericFields) {
    if (typeof data[field] !== 'number') {
      problems.push(`${field} is not a number`);
    }
  }

  if (!Array.isArray(data.statusDistribution)) {
    problems.push('statusDistribution is not an array');
  }
  if (!Array.isArray(data.categoryDistribution)) {
    problems.push('categoryDistribution is not an array');
  }
  if (!Array.isArray(data.recentActivities)) {
    problems.push('recentActivities is not an array');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `assets=${data.totalAssetCount} available=${data.availableCount}`);
}

async function verifyAssetInfoPage(reporter, options, user, token) {
  const scope = `${user.username} assetInfo:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/assetInfo/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 10,
    }),
  });

  if (!userHasPerm(user, 'performance:assetInfo:page')) {
    const denied = validateDeniedResponse(response, '无权限查看资产台账');
    if (denied) {
      reporter.fail(scope, denied);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const list = listItems(response.body);
  const total = totalFromPage(response.body);
  const problems = [];

  if (!Array.isArray(list)) {
    problems.push('list is not an array');
  }
  if (typeof total !== 'number') {
    problems.push('total is not a number');
  }
  if (list.some(item => typeof item.name !== 'string' || typeof item.assetNo !== 'string')) {
    problems.push('list item missing assetNo or name');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} first=${list[0]?.assetNo || 'none'}`);
}

async function verifyAssetReportPage(reporter, options, user, token) {
  const scope = `${user.username} assetReport:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/assetReport/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 10,
      reportDate: '2026-04',
    }),
  });

  if (!userHasPerm(user, 'performance:assetReport:page')) {
    const denied = validateDeniedResponse(response, '无权限查看资产报表');
    if (denied) {
      reporter.fail(scope, denied);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const list = listItems(response.body);
  const total = totalFromPage(response.body);
  const problems = [];

  if (!Array.isArray(list)) {
    problems.push('list is not an array');
  }
  if (typeof total !== 'number') {
    problems.push('total is not a number');
  }
  if (list.some(item => typeof item.assetName !== 'string' || typeof item.assetNo !== 'string')) {
    problems.push('list item missing assetNo or assetName');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} reportRows=${list.length}`);
}

async function verifyAssetDepreciationSummary(reporter, options, user, token) {
  const scope = `${user.username} assetDepreciation:summary`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/assetDepreciation/summary?depreciationMonth=2026-04`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!userHasPerm(user, 'performance:assetDepreciation:summary')) {
    const denied = validateDeniedResponse(response, '无权限查看折旧汇总');
    if (denied) {
      reporter.fail(scope, denied);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const data = response.body?.data || {};
  const numericFields = [
    'assetCount',
    'totalOriginalAmount',
    'totalAccumulatedDepreciation',
    'totalNetValue',
    'currentMonthDepreciation',
  ];
  const problems = [];

  for (const field of numericFields) {
    if (typeof data[field] !== 'number') {
      problems.push(`${field} is not a number`);
    }
  }

  if (typeof data.month !== 'string' || !data.month) {
    problems.push('month missing');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `month=${data.month} assets=${data.assetCount}`);
}

async function verifyAssetReportExport(reporter, options, user, token) {
  const scope = `${user.username} assetReport:export`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/assetReport/export?reportDate=2026-04`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!userHasPerm(user, 'performance:assetReport:export')) {
    const denied = validateDeniedResponse(response, '无权限导出资产报表');
    if (denied) {
      reporter.fail(scope, denied);
      return;
    }
    reporter.pass(scope, `denied as expected: ${response.body?.message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const list = Array.isArray(response.body?.data) ? response.body.data : null;
  if (!list) {
    reporter.fail(scope, 'export payload is not an array');
    return;
  }

  reporter.pass(scope, `rows=${list.length}`);
}

async function verifyAssetManagement(reporter, options, user, token) {
  await verifyAssetDashboardSummary(reporter, options, user, token);
  await verifyAssetInfoPage(reporter, options, user, token);
  await verifyAssetReportPage(reporter, options, user, token);
  await verifyAssetDepreciationSummary(reporter, options, user, token);
  await verifyAssetReportExport(reporter, options, user, token);
}

function formatResponse(body) {
  if (!body) {
    return 'empty response';
  }
  if (typeof body === 'string') {
    return body;
  }
  const code = body.code ?? 'unknown';
  const message = body.message ?? JSON.stringify(body);
  return `code=${code} message=${message}`;
}

async function run() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));
  const runtimeState = {
    courseId: null,
    courseTitle: null,
  };

  console.log('Stage-2 performance smoke check');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Cache Dir: ${options.cacheDir}`);

  const runtimeReady = await verifyRuntimePreflight(reporter, options);
  if (!runtimeReady) {
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(options.cacheDir)) {
    reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
  }

  for (const user of expectedUsers) {
    const session = await fetchCaptchaAndLogin(reporter, options, user);
    if (!session?.token) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} dashboard:summary`, 'skipped because login failed');
      reporter.skip(`${user.username} dashboard:crossSummary`, 'skipped because login failed');
      reporter.skip(`${user.username} assessment`, 'skipped because login failed');
      reporter.skip(`${user.username} goal:page`, 'skipped because login failed');
      reporter.skip(`${user.username} indicator:page`, 'skipped because login failed');
      reporter.skip(`${user.username} pip:page`, 'skipped because login failed');
      reporter.skip(`${user.username} feedback:export`, 'skipped because login failed');
      reporter.skip(`${user.username} pip:export`, 'skipped because login failed');
      reporter.skip(`${user.username} promotion:page`, 'skipped because login failed');
      reporter.skip(`${user.username} salary:page`, 'skipped because login failed');
      reporter.skip(`${user.username} course:page`, 'skipped because login failed');
      reporter.skip(`${user.username} capabilityModel:page`, 'skipped because login failed');
      reporter.skip(`${user.username} capabilityModel:info`, 'skipped because login failed');
      reporter.skip(`${user.username} certificate:page`, 'skipped because login failed');
      reporter.skip(`${user.username} certificate:recordPage`, 'skipped because login failed');
      reporter.skip(`${user.username} capabilityPortrait:info`, 'skipped because login failed');
      reporter.skip(`${user.username} courseRecite:page`, 'skipped because login failed');
      reporter.skip(`${user.username} courseRecite:info`, 'skipped because login failed');
      reporter.skip(`${user.username} courseRecite:submit`, 'skipped because login failed');
      reporter.skip(`${user.username} coursePractice:page`, 'skipped because login failed');
      reporter.skip(`${user.username} coursePractice:info`, 'skipped because login failed');
      reporter.skip(`${user.username} coursePractice:submit`, 'skipped because login failed');
      reporter.skip(`${user.username} courseExam:summary`, 'skipped because login failed');
      reporter.skip(`${user.username} meeting:page`, 'skipped because login failed');
      reporter.skip(`${user.username} meeting:info`, 'skipped because login failed');
      reporter.skip(`${user.username} meeting:checkIn`, 'skipped because login failed');
      reporter.skip(`${user.username} talentAsset:page`, 'skipped because login failed');
      reporter.skip(`${user.username} talentAsset:info`, 'skipped because login failed');
      reporter.skip(`${user.username} talentAsset:add`, 'skipped because login failed');
      reporter.skip(`${user.username} talentAsset:update`, 'skipped because login failed');
      reporter.skip(`${user.username} talentAsset:delete`, 'skipped because login failed');
      reporter.skip(`${user.username} assetDashboard:summary`, 'skipped because login failed');
      reporter.skip(`${user.username} assetInfo:page`, 'skipped because login failed');
      reporter.skip(`${user.username} assetReport:page`, 'skipped because login failed');
      reporter.skip(`${user.username} assetDepreciation:summary`, 'skipped because login failed');
      reporter.skip(`${user.username} assetReport:export`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, session.token);
    await verifyDashboardSummary(reporter, options, user, session.token);
    await verifyCrossSummary(reporter, options, user, session.token);
    await verifyAssessmentPages(reporter, options, user, session.token);
    await verifyGoalPage(reporter, options, user, session.token);
    await verifyIndicatorPage(reporter, options, user, session.token);
    await verifyPipPage(reporter, options, user, session.token);
    await verifyFeedbackExport(reporter, options, user, session.token);
    await verifyPipExport(reporter, options, user, session.token);
    await verifyPromotionPage(reporter, options, user, session.token);
    await verifySalaryPage(reporter, options, user, session.token);
    await verifyCourseManagementPage(reporter, options, user, session.token, runtimeState);
    await verifyCapabilityManagement(reporter, options, user, session.token);
    await verifyCertificateManagement(reporter, options, user, session.token);
    await verifyCourseLearning(reporter, options, user, session.token, runtimeState);
    await verifyMeetingPage(reporter, options, user, session.token);
    await verifyTalentAssetManagement(reporter, options, user, session.token);
    await verifyAssetManagement(reporter, options, user, session.token);
  }

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
