/// <reference types="jest" />
/**
 * Performance 角色边界矩阵测试。
 * 这里负责把“persona -> capability -> scope -> surface/workbench”固化成可跑样例，
 * 不负责覆盖每个业务服务的完整状态机或控制器联调。
 */
import * as jwt from 'jsonwebtoken';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

const JWT_SECRET = '694f6e56-579e-413e-8da0-63379cb5cd31';

function createService(
  tokenPayload: Record<string, any>,
  perms: string[],
  departmentIds: number[]
) {
  const token = jwt.sign(tokenPayload, JWT_SECRET);
  const service = new PerformanceAccessContextService() as any;

  service.ctx = {
    headers: {
      authorization: token,
    },
    get: jest.fn().mockReturnValue(token),
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(perms),
  };
  service.baseSysPermsService = {
    departmentIds: jest.fn().mockResolvedValue(departmentIds),
  };

  return service as PerformanceAccessContextService;
}

type ScopeTarget = {
  subjectUserId?: number;
  ownerUserId?: number;
  departmentId?: number;
};

type CapabilityAssertion = {
  capabilityKey: string;
  expectedScopes: string[];
  allowedTargets?: ScopeTarget[];
  deniedTargets?: ScopeTarget[];
};

type RoleBoundaryCase = {
  name: string;
  requestedActivePersonaKey?: string | null;
  tokenPayload: Record<string, any>;
  perms: string[];
  departmentIds: number[];
  expectedAvailablePersonas: string[];
  expectedDefaultPersonaKey: string | null;
  expectedActivePersonaKey: string | null;
  expectedRoleKind: string;
  expectedCanSwitchPersona: boolean;
  expectedWorkbenchPages: string[];
  expectedSurfaceAccess: Partial<{
    workbench: boolean;
    assessmentMy: boolean;
    assessmentInitiated: boolean;
    assessmentPending: boolean;
    approvalConfig: boolean;
    approvalInstance: boolean;
    dashboardSummary: boolean;
    dashboardCrossSummary: boolean;
  }>;
  capabilityAssertions: CapabilityAssertion[];
};

const ROLE_BOUNDARY_CASES: RoleBoundaryCase[] = [
  {
    name: 'employee self-service boundary',
    tokenPayload: {
      userId: 3001,
      username: 'employee_case',
      roleIds: [3],
      passwordVersion: 1,
      isRefresh: false,
    },
    perms: [
      'performance:assessment:myPage',
      'performance:assessment:update',
      'performance:assessment:submit',
      'performance:goal:page',
      'performance:goal:info',
      'performance:feedback:page',
      'performance:feedback:submit',
      'performance:workPlan:page',
      'performance:coursePractice:page',
      'performance:coursePractice:submit',
      'performance:courseExam:summary',
    ],
    departmentIds: [],
    expectedAvailablePersonas: ['org.employee'],
    expectedDefaultPersonaKey: 'org.employee',
    expectedActivePersonaKey: 'org.employee',
    expectedRoleKind: 'employee',
    expectedCanSwitchPersona: false,
    expectedWorkbenchPages: [
      'my-assessment',
      'goal',
      'feedback',
      'course-learning',
      'work-plan',
    ],
    expectedSurfaceAccess: {
      workbench: true,
      assessmentMy: true,
      assessmentInitiated: false,
      assessmentPending: false,
      dashboardSummary: false,
      dashboardCrossSummary: false,
    },
    capabilityAssertions: [
      {
        capabilityKey: 'assessment.self.edit',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 3999 }],
      },
      {
        capabilityKey: 'goal.page_read',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 4001, departmentId: 11 }],
      },
      {
        capabilityKey: 'feedback.record.submit',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 3002 }],
      },
      {
        capabilityKey: 'feedback.task.read',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 3002, departmentId: 11 }],
      },
      {
        capabilityKey: 'workplan.read',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 3002 }],
      },
      {
        capabilityKey: 'course.practice.submit',
        expectedScopes: ['self'],
        allowedTargets: [{ subjectUserId: 3001 }],
        deniedTargets: [{ subjectUserId: 3010 }],
      },
    ],
  },
  {
    name: 'line manager boundary across approval, goal, feedback, workplan, recruit chain and teacher channel',
    requestedActivePersonaKey: 'org.line_manager',
    tokenPayload: {
      userId: 2001,
      username: 'manager_case',
      roleIds: [2],
      passwordVersion: 1,
      isRefresh: false,
    },
    perms: [
      'performance:assessment:pendingPage',
      'performance:assessment:approve',
      'performance:approvalFlow:info',
      'performance:approvalFlow:approve',
      'performance:dashboard:summary',
      'performance:goal:page',
      'performance:goal:add',
      'performance:feedback:page',
      'performance:feedback:add',
      'performance:workPlan:page',
      'performance:workPlan:add',
      'performance:promotion:page',
      'performance:promotion:add',
      'performance:pip:page',
      'performance:pip:add',
      'performance:suggestion:info',
      'performance:suggestion:reject',
      'performance:meeting:page',
      'performance:meeting:checkIn',
      'performance:purchaseReport:summary',
      'performance:purchaseOrder:page',
      'performance:interview:page',
      'performance:recruitPlan:page',
      'performance:recruitPlan:update',
      'performance:resumePool:page',
      'performance:resumePool:add',
      'performance:hiring:page',
      'performance:hiring:add',
      'performance:capabilityPortrait:info',
      'performance:certificate:recordPage',
      'performance:jobStandard:page',
      'performance:talentAsset:page',
      'performance:talentAsset:add',
      'performance:knowledgeBase:page',
      'performance:knowledgeBase:qaAdd',
      'performance:documentCenter:page',
      'performance:documentCenter:update',
      'performance:annualInspection:info',
      'performance:designCollab:add',
      'performance:teacherInfo:page',
      'performance:teacherInfo:assign',
    ],
    departmentIds: [11, 12],
    expectedAvailablePersonas: [
      'org.hrbp',
      'fn.performance_operator',
      'org.line_manager',
      'fn.analysis_viewer',
    ],
    expectedDefaultPersonaKey: 'org.hrbp',
    expectedActivePersonaKey: 'org.line_manager',
    expectedRoleKind: 'manager',
    expectedCanSwitchPersona: true,
    expectedWorkbenchPages: [
      'pending-approval',
      'goal',
      'feedback',
      'dashboard',
      'work-plan',
    ],
    expectedSurfaceAccess: {
      workbench: true,
      assessmentPending: true,
      approvalInstance: true,
      dashboardSummary: true,
      dashboardCrossSummary: false,
    },
    capabilityAssertions: [
      {
        capabilityKey: 'assessment.review.approve',
        expectedScopes: ['assigned_domain', 'department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 99 }],
      },
      {
        capabilityKey: 'approval.instance.approve',
        expectedScopes: ['assigned_domain', 'department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 88 }],
      },
      {
        capabilityKey: 'goal.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 99 }],
      },
      {
        capabilityKey: 'purchase_report.summary.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 99 }],
      },
      {
        capabilityKey: 'feedback.task.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 99 }],
      },
      {
        capabilityKey: 'workplan.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 77 }],
      },
      {
        capabilityKey: 'promotion.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 41 }],
      },
      {
        capabilityKey: 'pip.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 98 }],
      },
      {
        capabilityKey: 'interview.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 88 }],
      },
      {
        capabilityKey: 'recruit_plan.update',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 90 }],
      },
      {
        capabilityKey: 'resume_pool.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 80 }],
      },
      {
        capabilityKey: 'hiring.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 81 }],
      },
      {
        capabilityKey: 'suggestion.reject',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 82 }],
      },
      {
        capabilityKey: 'meeting.checkin',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 83 }],
      },
      {
        capabilityKey: 'capability.portrait.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 84 }],
      },
      {
        capabilityKey: 'certificate.record.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 85 }],
      },
      {
        capabilityKey: 'job_standard.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 86 }],
      },
      {
        capabilityKey: 'talent_asset.create',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [{ departmentId: 87 }],
      },
      {
        capabilityKey: 'knowledge_base.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 88 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'document.update',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 89 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'office.annual_inspection.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 90 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'office.design_collab.create',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 91 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'teacher_info.assign',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [{ departmentId: 66 }],
      },
    ],
  },
  {
    name: 'hrbp company-level boundary',
    tokenPayload: {
      userId: 1001,
      username: 'hrbp_case',
      roleIds: [1],
      passwordVersion: 1,
      isRefresh: false,
    },
    perms: [
      'performance:assessment:export',
      'performance:approvalFlow:configSave',
      'performance:approvalFlow:info',
      'performance:dashboard:summary',
      'performance:dashboard:crossSummary',
      'performance:salary:page',
      'performance:feedback:export',
      'performance:pip:export',
      'performance:purchaseOrder:delete',
      'performance:purchaseReport:summary',
      'performance:interview:delete',
      'performance:resumePool:export',
      'performance:hiring:all',
      'performance:hiring:page',
      'performance:suggestion:revoke',
      'performance:meeting:delete',
      'performance:capabilityModel:add',
      'performance:capabilityPortrait:info',
      'performance:certificate:issue',
      'performance:certificate:recordPage',
      'performance:jobStandard:setStatus',
      'performance:jobStandard:page',
      'performance:talentAsset:delete',
      'performance:talentAsset:page',
      'performance:documentCenter:page',
      'performance:documentCenter:update',
      'performance:knowledgeBase:page',
      'performance:knowledgeBase:qaAdd',
      'performance:annualInspection:info',
      'performance:designCollab:add',
    ],
    departmentIds: [],
    expectedAvailablePersonas: [
      'org.hrbp',
      'fn.performance_operator',
      'fn.analysis_viewer',
    ],
    expectedDefaultPersonaKey: 'org.hrbp',
    expectedActivePersonaKey: 'org.hrbp',
    expectedRoleKind: 'hr',
    expectedCanSwitchPersona: true,
    expectedWorkbenchPages: ['dashboard', 'salary'],
    expectedSurfaceAccess: {
      workbench: true,
      approvalConfig: true,
      approvalInstance: true,
      dashboardSummary: true,
      dashboardCrossSummary: true,
    },
    capabilityAssertions: [
      {
        capabilityKey: 'approval.config.write',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 999 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'salary.read',
        expectedScopes: ['company'],
        allowedTargets: [{ subjectUserId: 5001 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'purchase_order.delete',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 77 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'purchase_report.summary.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 77 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'feedback.export',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 8 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'pip.export',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 9 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'interview.delete',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 10 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'resume_pool.export',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 11 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'hiring.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 12 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'suggestion.revoke',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 13 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'meeting.delete',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 14 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'capability.portrait.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 15 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'certificate.record.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 16 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'job_standard.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 17 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'talent_asset.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 18 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'document.update',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 19 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'knowledge_base.qa_create',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 20 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'office.design_collab.create',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 21 }],
        deniedTargets: [],
      },
    ],
  },
  {
    name: 'performance operator can switch into company-level ops persona',
    requestedActivePersonaKey: 'fn.performance_operator',
    tokenPayload: {
      userId: 1002,
      username: 'ops_case',
      roleIds: [1],
      passwordVersion: 1,
      isRefresh: false,
    },
    perms: [
      'performance:assessment:page',
      'performance:assessment:export',
      'performance:dashboard:summary',
      'performance:salary:page',
      'performance:indicator:page',
      'performance:recruitPlan:page',
    ],
    departmentIds: [],
    expectedAvailablePersonas: [
      'org.hrbp',
      'fn.performance_operator',
      'fn.analysis_viewer',
    ],
    expectedDefaultPersonaKey: 'org.hrbp',
    expectedActivePersonaKey: 'fn.performance_operator',
    expectedRoleKind: 'hr',
    expectedCanSwitchPersona: true,
    expectedWorkbenchPages: [
      'initiated',
      'dashboard',
      'salary',
      'indicator-library',
      'recruit-plan',
    ],
    expectedSurfaceAccess: {
      workbench: true,
      assessmentInitiated: true,
      dashboardSummary: true,
      dashboardCrossSummary: false,
    },
    capabilityAssertions: [
      {
        capabilityKey: 'assessment.manage.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 1 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'indicator.read',
        expectedScopes: ['company'],
        allowedTargets: [{ departmentId: 2 }],
        deniedTargets: [],
      },
      {
        capabilityKey: 'salary.read',
        expectedScopes: ['company'],
        allowedTargets: [{ subjectUserId: 9001 }],
        deniedTargets: [],
      },
    ],
  },
  {
    name: 'analysis viewer stays readonly',
    tokenPayload: {
      userId: 4001,
      username: 'analysis_case',
      roleIds: [4],
      passwordVersion: 1,
      isRefresh: false,
    },
    perms: ['performance:dashboard:summary', 'performance:dashboard:crossSummary'],
    departmentIds: [21],
    expectedAvailablePersonas: ['fn.analysis_viewer'],
    expectedDefaultPersonaKey: 'fn.analysis_viewer',
    expectedActivePersonaKey: 'fn.analysis_viewer',
    expectedRoleKind: 'readonly',
    expectedCanSwitchPersona: false,
    expectedWorkbenchPages: ['dashboard'],
    expectedSurfaceAccess: {
      workbench: true,
      assessmentMy: false,
      assessmentInitiated: false,
      assessmentPending: false,
      dashboardSummary: true,
      dashboardCrossSummary: true,
    },
    capabilityAssertions: [
      {
        capabilityKey: 'dashboard.summary.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 21 }],
        deniedTargets: [{ departmentId: 99 }],
      },
      {
        capabilityKey: 'dashboard.cross_summary.read',
        expectedScopes: ['department_tree'],
        allowedTargets: [{ departmentId: 21 }],
        deniedTargets: [{ departmentId: 199 }],
      },
    ],
  },
];

describe('performance role boundary matrix', () => {
  test.each(ROLE_BOUNDARY_CASES)('$name', async roleBoundaryCase => {
    const service = createService(
      roleBoundaryCase.tokenPayload,
      roleBoundaryCase.perms,
      roleBoundaryCase.departmentIds
    );

    const context = await service.resolveAccessContext(
      roleBoundaryCase.requestedActivePersonaKey
    );

    expect(context.availablePersonas.map(item => item.key)).toEqual(
      roleBoundaryCase.expectedAvailablePersonas
    );
    expect(context.defaultPersonaKey).toBe(
      roleBoundaryCase.expectedDefaultPersonaKey
    );
    expect(context.activePersonaKey).toBe(roleBoundaryCase.expectedActivePersonaKey);
    expect(context.roleKind).toBe(roleBoundaryCase.expectedRoleKind);
    expect(context.canSwitchPersona).toBe(roleBoundaryCase.expectedCanSwitchPersona);
    expect(context.workbenchPages).toEqual(roleBoundaryCase.expectedWorkbenchPages);
    expect(context.surfaceAccess).toMatchObject(
      roleBoundaryCase.expectedSurfaceAccess
    );

    for (const capabilityAssertion of roleBoundaryCase.capabilityAssertions) {
      expect(
        service.capabilityScopes(
          context,
          capabilityAssertion.capabilityKey as any
        )
      ).toEqual(capabilityAssertion.expectedScopes);

      for (const target of capabilityAssertion.allowedTargets || []) {
        expect(
          service.matchesScope(
            context,
            service.capabilityScopes(
              context,
              capabilityAssertion.capabilityKey as any
            ),
            target
          )
        ).toBe(true);
      }

      for (const target of capabilityAssertion.deniedTargets || []) {
        expect(
          service.matchesScope(
            context,
            service.capabilityScopes(
              context,
              capabilityAssertion.capabilityKey as any
            ),
            target
          )
        ).toBe(false);
      }
    }
  });
});
