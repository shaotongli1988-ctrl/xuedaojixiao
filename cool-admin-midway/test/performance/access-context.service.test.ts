/// <reference types="jest" />
/**
 * 绩效角色访问上下文最小测试。
 * 这里负责验证 persona 解析、持久化偏好回退和 scope 命中，不负责控制器联调。
 */
import * as jwt from 'jsonwebtoken';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

const JWT_SECRET = '694f6e56-579e-413e-8da0-63379cb5cd31';

function createService(
  tokenPayload: Record<string, any>,
  perms: string[],
  departmentIds: number[],
  options: {
    persistedActivePersonaKey?: string | null;
  } = {}
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
  service.baseSysUserEntity = {
    findOne: jest.fn().mockResolvedValue({
      id: tokenPayload.userId,
      activePerformancePersonaKey:
        options.persistedActivePersonaKey ?? null,
    }),
    update: jest.fn().mockResolvedValue({
      affected: 1,
    }),
  };

  return service as PerformanceAccessContextService;
}

describe('performance access context service', () => {
  test('should resolve line manager persona and manager workbench pages from existing approval/dashboard perms', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:pendingPage',
        'performance:assessment:page',
        'performance:dashboard:summary',
        'performance:goal:page',
        'performance:feedback:page',
        'performance:workPlan:page',
      ],
      [11, 12]
    );

    const context = await service.resolvePublicContext();

    expect(context.availablePersonas.map(item => item.key)).toContain(
      'org.line_manager'
    );
    expect(context.activePersonaKey).toBe('org.line_manager');
    expect(context.roleKind).toBe('manager');
    expect(context.workbenchPages).toEqual(
      expect.arrayContaining([
        'pending-approval',
        'initiated',
        'dashboard',
        'goal',
        'feedback',
        'work-plan',
      ])
    );
  });

  test('should resolve hrbp default persona and allow persona switching for global operator accounts', async () => {
    const service = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:page',
        'performance:assessment:export',
        'performance:approvalFlow:configSave',
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:salary:page',
        'performance:recruitPlan:page',
      ],
      []
    );

    const context = await service.resolvePublicContext();

    expect(context.availablePersonas.map(item => item.key)).toEqual(
      expect.arrayContaining([
        'org.hrbp',
        'fn.performance_operator',
        'fn.analysis_viewer',
      ])
    );
    expect(context.activePersonaKey).toBe('org.hrbp');
    expect(context.roleKind).toBe('hr');
    expect(context.canSwitchPersona).toBe(true);
    expect(context.workbenchPages).toEqual(
      expect.arrayContaining(['dashboard', 'initiated', 'salary', 'recruit-plan'])
    );
  });

  test('should prefer persisted persona when it remains valid for the current account', async () => {
    const service = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:page',
        'performance:assessment:export',
        'performance:approvalFlow:configSave',
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:salary:page',
        'performance:recruitPlan:page',
      ],
      [],
      {
        persistedActivePersonaKey: 'fn.performance_operator',
      }
    );

    const context = await service.resolvePublicContext();

    expect(context.defaultPersonaKey).toBe('org.hrbp');
    expect(context.activePersonaKey).toBe('fn.performance_operator');
    expect(context.roleKind).toBe('hr');
  });

  test('should fall back to default persona when persisted persona is no longer valid', async () => {
    const service = createService(
      {
        userId: 3001,
        username: 'employee_learning',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:coursePractice:page', 'performance:courseExam:summary'],
      [],
      {
        persistedActivePersonaKey: 'org.hrbp',
      }
    );

    const context = await service.resolvePublicContext();

    expect(context.defaultPersonaKey).toBe('org.employee');
    expect(context.activePersonaKey).toBe('org.employee');
    expect(context.roleKind).toBe('employee');
  });

  test('should persist a valid requested persona preference and return refreshed public context', async () => {
    const service = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:page',
        'performance:assessment:export',
        'performance:approvalFlow:configSave',
        'performance:dashboard:summary',
        'performance:dashboard:crossSummary',
        'performance:salary:page',
        'performance:recruitPlan:page',
      ],
      []
    ) as any;

    service.baseSysUserEntity.update = jest
      .fn()
      .mockImplementation(async (_where, payload) => {
        service.baseSysUserEntity.findOne = jest.fn().mockResolvedValue({
          id: 1001,
          activePerformancePersonaKey: payload.activePerformancePersonaKey,
        });
        return { affected: 1 };
      });

    const context = await service.savePublicContextPreference(
      'fn.performance_operator'
    );

    expect(service.baseSysUserEntity.update).toHaveBeenCalledWith(
      { id: 1001 },
      { activePerformancePersonaKey: 'fn.performance_operator' }
    );
    expect(context.activePersonaKey).toBe('fn.performance_operator');
    expect(context.roleKind).toBe('hr');
  });

  test('should reject saving persona preferences outside current available personas', async () => {
    const service = createService(
      {
        userId: 3001,
        username: 'employee_learning',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:coursePractice:page', 'performance:courseExam:summary'],
      []
    );

    await expect(
      service.savePublicContextPreference('org.hrbp')
    ).rejects.toThrow('当前账号不可切换到该绩效视角');
  });

  test('should match self, assigned_domain and department_tree scopes correctly', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:pendingPage',
        'performance:assessment:approve',
        'performance:assessment:update',
      ],
      [11, 12]
    );

    const context = await service.resolveAccessContext();

    expect(
      service.matchesScope(
        context,
        service.capabilityScopes(context, 'assessment.self.edit'),
        {
          subjectUserId: 2001,
        }
      )
    ).toBe(true);
    expect(
      service.matchesScope(
        context,
        service.capabilityScopes(context, 'assessment.review.approve'),
        {
          ownerUserId: 3001,
          departmentId: 11,
        }
      )
    ).toBe(true);
    expect(
      service.matchesScope(
        context,
        service.capabilityScopes(context, 'assessment.review.approve'),
        {
          ownerUserId: 3001,
          departmentId: 99,
        }
      )
    ).toBe(false);
  });

  test('should not derive line manager persona from company-scoped suggestion access', async () => {
    const service = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:suggestion:info', 'performance:salary:page'],
      []
    );

    const context = await service.resolvePublicContext();
    const personaKeys = context.availablePersonas.map(item => item.key);

    expect(personaKeys).toContain('org.hrbp');
    expect(personaKeys).not.toContain('org.line_manager');
  });

  test('should derive line manager persona from department-scoped suggestion access', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:suggestion:info'],
      [11]
    );

    const context = await service.resolvePublicContext();

    expect(context.availablePersonas.map(item => item.key)).toContain(
      'org.line_manager'
    );
  });

  test('should derive employee persona from self-scoped course learning access', async () => {
    const service = createService(
      {
        userId: 3001,
        username: 'employee_learning',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:coursePractice:page', 'performance:courseExam:summary'],
      []
    );

    const context = await service.resolvePublicContext();

    expect(context.availablePersonas.map(item => item.key)).toContain(
      'org.employee'
    );
    expect(context.roleKind).toBe('employee');
    expect(context.workbenchPages).toContain('course-learning');
  });

  test('should not derive initiated or pending assessment access from assessment info alone', async () => {
    const service = createService(
      {
        userId: 3001,
        username: 'employee_learning',
        roleIds: [3],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:update',
        'performance:assessment:submit',
      ],
      []
    );

    const context = await service.resolveAccessContext();

    expect(
      service.capabilityScopes(context, 'assessment.manage.read')
    ).toEqual([]);
    expect(
      service.capabilityScopes(context, 'assessment.review.read')
    ).toEqual([]);
    expect(context.surfaceAccess.assessmentInitiated).toBe(false);
    expect(context.surfaceAccess.assessmentPending).toBe(false);
  });

  test('should keep allowEmptyRoleIds compatibility by resolving empty access context', async () => {
    const service = new PerformanceAccessContextService() as any;

    service.ctx = {};
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };

    await expect(service.resolveAccessContext()).rejects.toThrow('登录上下文缺失');

    await expect(
      service.resolveAccessContext(undefined, {
        allowEmptyRoleIds: true,
        missingAuthMessage: '登录状态已失效',
      })
    ).resolves.toMatchObject({
      userId: 0,
      departmentIds: [],
      perms: [],
      availablePersonas: [],
      activePersonaKey: null,
      defaultPersonaKey: null,
    });
  });

  test('should keep purchase report scoped unless purchase-order delete grants company scope', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:purchaseReport:summary'],
      [11]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(
        managerContext,
        'purchase_report.summary.read'
      )
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:purchaseReport:summary',
        'performance:purchaseOrder:delete',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(
      hrService.capabilityScopes(hrContext, 'purchase_report.summary.read')
    ).toEqual(['company']);
  });

  test('should map batch-one capability scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:capabilityPortrait:info',
        'performance:certificate:recordPage',
        'performance:jobStandard:page',
        'performance:talentAsset:page',
        'performance:talentAsset:add',
        'performance:talentAsset:update',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'capability.portrait.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'certificate.record.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'job_standard.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'talent_asset.create')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'talent_asset.update')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:capabilityModel:add',
        'performance:capabilityPortrait:info',
        'performance:certificate:issue',
        'performance:certificate:recordPage',
        'performance:jobStandard:setStatus',
        'performance:jobStandard:page',
        'performance:talentAsset:delete',
        'performance:talentAsset:page',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(
      hrService.capabilityScopes(hrContext, 'capability.portrait.read')
    ).toEqual(['company']);
    expect(
      hrService.capabilityScopes(hrContext, 'certificate.record.read')
    ).toEqual(['company']);
    expect(hrService.capabilityScopes(hrContext, 'job_standard.read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'talent_asset.read')).toEqual([
      'company',
    ]);
  });

  test('should map batch-two capability scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:purchaseReport:summary',
        'performance:capabilityPortrait:info',
        'performance:certificate:recordPage',
        'performance:courseRecite:page',
        'performance:coursePractice:submit',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'purchase_report.summary.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'capability.portrait.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'certificate.record.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'course.recite.read')
    ).toEqual(['self']);
    expect(
      managerService.capabilityScopes(managerContext, 'course.practice.submit')
    ).toEqual(['self']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:capabilityModel:add',
        'performance:capabilityPortrait:info',
        'performance:certificate:issue',
        'performance:certificate:recordPage',
        'performance:contract:page',
        'performance:indicator:page',
        'performance:intellectualProperty:stats',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(
      hrService.capabilityScopes(hrContext, 'capability.portrait.read')
    ).toEqual(['company']);
    expect(
      hrService.capabilityScopes(hrContext, 'certificate.record.read')
    ).toEqual(['company']);
    expect(hrService.capabilityScopes(hrContext, 'contract.read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'indicator.read')).toEqual([
      'company',
    ]);
    expect(
      hrService.capabilityScopes(hrContext, 'intellectual_property.stats')
    ).toEqual(['company']);
  });

  test('should map recruitment-chain scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:interview:page',
        'performance:interview:add',
        'performance:interview:update',
        'performance:recruitPlan:page',
        'performance:recruitPlan:update',
        'performance:resumePool:page',
        'performance:resumePool:add',
        'performance:resumePool:createInterview',
        'performance:hiring:page',
        'performance:hiring:add',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(managerService.capabilityScopes(managerContext, 'interview.read')).toEqual([
      'department_tree',
    ]);
    expect(
      managerService.capabilityScopes(managerContext, 'recruit_plan.update')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'resume_pool.create')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'resume_pool.create_interview')
    ).toEqual(['department_tree']);
    expect(managerService.capabilityScopes(managerContext, 'hiring.create')).toEqual([
      'department_tree',
    ]);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:interview:delete',
        'performance:interview:page',
        'performance:resumePool:export',
        'performance:resumePool:page',
        'performance:hiring:all',
        'performance:hiring:page',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'interview.read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'interview.delete')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'resume_pool.read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'resume_pool.export')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'hiring.read')).toEqual([
      'company',
    ]);
  });

  test('should map batch-three scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:add',
        'performance:goal:update',
        'performance:goal:progressUpdate',
        'performance:goal:opsManage',
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:update',
        'performance:assetInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:assign',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(managerService.capabilityScopes(managerContext, 'goal.page_read')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'goal.detail.read')).toEqual([
      'self',
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'goal.ops.read')).toEqual([
      'self',
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'goal.ops.manage')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'purchase_order.update')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'asset_info.read')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'teacher_info.read')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'teacher_info.assign')).toEqual([
      'department_tree',
    ]);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:salary:page',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:add',
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:delete',
        'performance:assetInfo:page',
        'performance:assetInfo:add',
        'performance:teacherInfo:info',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'goal.page_read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'goal.create')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'purchase_order.read')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'purchase_order.delete')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'asset_info.read')).toEqual([
      'company',
    ]);

    const readonlyTeacherService = createService(
      {
        userId: 4001,
        username: 'readonly_teacher',
        roleIds: [4],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:teacherInfo:info'],
      []
    );

    const readonlyTeacherContext = await readonlyTeacherService.resolveAccessContext();
    expect(
      readonlyTeacherService.capabilityScopes(readonlyTeacherContext, 'teacher_info.read')
    ).toEqual(['self']);
  });

  test('should map knowledge-base and office-collab scopes to company-level ssot capabilities', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:knowledgeBase:page',
        'performance:knowledgeBase:qaAdd',
        'performance:annualInspection:info',
        'performance:annualInspection:stats',
        'performance:designCollab:add',
        'performance:expressCollab:delete',
      ],
      [11, 12]
    );

    const context = await service.resolveAccessContext();
    expect(service.capabilityScopes(context, 'knowledge_base.read')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'knowledge_base.qa_create')).toEqual([
      'company',
    ]);
    expect(
      service.capabilityScopes(context, 'office.annual_inspection.read')
    ).toEqual(['company']);
    expect(
      service.capabilityScopes(context, 'office.annual_inspection.stats')
    ).toEqual(['company']);
    expect(
      service.capabilityScopes(context, 'office.design_collab.create')
    ).toEqual(['company']);
    expect(
      service.capabilityScopes(context, 'office.express_collab.delete')
    ).toEqual(['company']);
  });

  test('should map supplier vehicle and document-center scopes to company-level ssot capabilities', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:supplier:page',
        'performance:vehicle:stats',
        'performance:documentCenter:page',
        'performance:documentCenter:update',
      ],
      [11, 12]
    );

    const context = await service.resolveAccessContext();
    expect(service.capabilityScopes(context, 'supplier.read')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'vehicle.stats')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'document.read')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'document.update')).toEqual([
      'company',
    ]);
  });

  test('should map asset-domain scopes to global-or-department-tree ssot capabilities', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assetInfo:page',
        'performance:assetAssignmentRequest:assign',
        'performance:assetTransfer:complete',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'asset_info.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(
        managerContext,
        'asset_assignment_request.assign'
      )
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'asset_transfer.complete')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:assetInfo:add',
        'performance:assetProcurement:receive',
        'performance:assetReport:page',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'asset_info.create')).toEqual([
      'company',
    ]);
    expect(
      hrService.capabilityScopes(hrContext, 'asset_procurement.receive')
    ).toEqual(['company']);
    expect(hrService.capabilityScopes(hrContext, 'asset_report.read')).toEqual([
      'company',
    ]);
  });

  test('should map material-domain scopes to company-level ssot capabilities', async () => {
    const service = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:materialCatalog:page',
        'performance:materialInbound:submit',
        'performance:materialIssue:issue',
        'performance:materialStockLog:page',
      ],
      [11, 12]
    );

    const context = await service.resolveAccessContext();
    expect(service.capabilityScopes(context, 'material.catalog.read')).toEqual([
      'company',
    ]);
    expect(
      service.capabilityScopes(context, 'material.inbound.submit')
    ).toEqual(['company']);
    expect(service.capabilityScopes(context, 'material.issue.issue')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'material.stocklog.read')).toEqual([
      'company',
    ]);
  });

  test('should map salary-domain scopes to company-level ssot capabilities', async () => {
    const service = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:salary:page',
        'performance:salary:confirm',
        'performance:salary:changeAdd',
      ],
      [11]
    );

    const context = await service.resolveAccessContext();
    expect(service.capabilityScopes(context, 'salary.read')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'salary.confirm')).toEqual([
      'company',
    ]);
    expect(service.capabilityScopes(context, 'salary.change_add')).toEqual([
      'company',
    ]);
  });

  test('should map suggestion and promotion scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:suggestion:info',
        'performance:suggestion:reject',
        'performance:promotion:page',
        'performance:promotion:submit',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(managerService.capabilityScopes(managerContext, 'suggestion.read')).toEqual([
      'department_tree',
    ]);
    expect(
      managerService.capabilityScopes(managerContext, 'suggestion.reject')
    ).toEqual(['department_tree']);
    expect(managerService.capabilityScopes(managerContext, 'promotion.read')).toEqual([
      'department_tree',
    ]);
    expect(
      managerService.capabilityScopes(managerContext, 'promotion.submit')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:salary:page',
        'performance:suggestion:revoke',
        'performance:promotion:review',
      ],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'suggestion.revoke')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'promotion.review')).toEqual([
      'department_tree',
    ]);
  });

  test('should map meeting scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:meeting:page', 'performance:meeting:checkIn'],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(managerService.capabilityScopes(managerContext, 'meeting.page')).toEqual([
      'department_tree',
    ]);
    expect(
      managerService.capabilityScopes(managerContext, 'meeting.checkin')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:salary:page', 'performance:meeting:delete'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'meeting.delete')).toEqual([
      'company',
    ]);
  });

  test('should map pip scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:pip:page', 'performance:pip:start', 'performance:pip:export'],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(managerService.capabilityScopes(managerContext, 'pip.read')).toEqual([
      'self',
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'pip.start')).toEqual([
      'department_tree',
    ]);
    expect(managerService.capabilityScopes(managerContext, 'pip.export')).toEqual([
      'department_tree',
    ]);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:salary:page', 'performance:pip:info', 'performance:pip:export'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'pip.read')).toEqual([
      'self',
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'pip.export')).toEqual([
      'company',
    ]);
  });

  test('should map workplan scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:workPlan:page',
        'performance:workPlan:start',
        'performance:workPlan:sync',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'workplan.read')
    ).toEqual(['self', 'department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'workplan.start')
    ).toEqual(['self', 'department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'workplan.sync')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:salary:page', 'performance:workPlan:info'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'workplan.read')).toEqual([
      'self',
      'company',
    ]);
  });

  test('should map feedback scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:feedback:page',
        'performance:feedback:add',
        'performance:feedback:summary',
        'performance:feedback:export',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'feedback.task.read')
    ).toEqual(['self', 'department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'feedback.task.create')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'feedback.summary.read')
    ).toEqual(['self', 'department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'feedback.export')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:salary:page', 'performance:feedback:summary'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(
      hrService.capabilityScopes(hrContext, 'feedback.summary.read')
    ).toEqual(['self', 'company']);
  });

  test('should map goal extended scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:goal:update',
        'performance:goal:progressUpdate',
        'performance:goal:export',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'goal.ops.personal_write')
    ).toEqual(['self']);
    expect(
      managerService.capabilityScopes(managerContext, 'goal.progress_update')
    ).toEqual(['self', 'department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'goal.export')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:salary:page', 'performance:goal:opsGlobalScope'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'goal.ops.global')).toEqual([
      'company',
    ]);
  });

  test('should map purchase-order scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:submitApproval',
        'performance:purchaseOrder:receive',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'purchase_order.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(
        managerContext,
        'purchase_order.submit_approval'
      )
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'purchase_order.receive')
    ).toEqual(['department_tree']);

    const hrService = createService(
      {
        userId: 1001,
        username: 'hrbp_ops',
        roleIds: [1],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:purchaseOrder:delete', 'performance:purchaseOrder:reject'],
      [11]
    );

    const hrContext = await hrService.resolveAccessContext();
    expect(hrService.capabilityScopes(hrContext, 'purchase_order.delete')).toEqual([
      'company',
    ]);
    expect(hrService.capabilityScopes(hrContext, 'purchase_order.reject')).toEqual([
      'company',
    ]);
  });

  test('should map teacher-domain scopes to the same ssot semantics as legacy modules', async () => {
    const managerService = createService(
      {
        userId: 2001,
        username: 'manager_rd',
        roleIds: [2],
        passwordVersion: 1,
        isRefresh: false,
      },
      [
        'performance:teacherInfo:info',
        'performance:teacherInfo:assign',
        'performance:teacherAgentRelation:add',
        'performance:teacherTodo:page',
      ],
      [11, 12]
    );

    const managerContext = await managerService.resolveAccessContext();
    expect(
      managerService.capabilityScopes(managerContext, 'teacher_info.read')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(
        managerContext,
        'teacher_agent_relation.create'
      )
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'teacher_info.assign')
    ).toEqual(['department_tree']);
    expect(
      managerService.capabilityScopes(managerContext, 'teacher_todo.read')
    ).toEqual(['department_tree']);

    const readonlyTeacherService = createService(
      {
        userId: 4001,
        username: 'readonly_teacher',
        roleIds: [4],
        passwordVersion: 1,
        isRefresh: false,
      },
      ['performance:teacherInfo:info', 'performance:teacherDashboard:summary'],
      []
    );

    const readonlyTeacherContext =
      await readonlyTeacherService.resolveAccessContext();
    expect(
      readonlyTeacherService.capabilityScopes(
        readonlyTeacherContext,
        'teacher_info.read'
      )
    ).toEqual(['self']);
    expect(
      readonlyTeacherService.capabilityScopes(
        readonlyTeacherContext,
        'teacher_dashboard.summary'
      )
    ).toEqual(['self']);
  });
});
