/// <reference types="jest" />
/**
 * 主题19班主任渠道合作核心服务测试。
 * 这里只验证冻结范围内的权限、脱敏和状态机主链，不覆盖真实数据库、控制器装饰器或联调脚本。
 * 维护重点是跟进前不可合作、partnered 才可建班、closed 班级锁死、只读账号脱敏不可漂移。
 */
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';
import { PerformanceTeacherChannelCoreService } from '../../src/modules/performance/service/teacher-channel-core';
import { resolvePermissionMask } from '../../src/modules/performance/constants/permission-bits';

function attachAccessContext(service: any) {
  const accessService = new PerformanceAccessContextService() as any;
  accessService.ctx = service.ctx;
  accessService.baseSysMenuService =
    service.baseSysMenuService || { getPerms: jest.fn().mockResolvedValue([]) };
  accessService.baseSysPermsService =
    service.baseSysPermsService || {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
  service.performanceAccessContextService = accessService;
  return service;
}

const ADMIN_PERMS = [
  'performance:teacherAgent:page',
  'performance:teacherAgent:info',
  'performance:teacherAgent:add',
  'performance:teacherAgent:update',
  'performance:teacherAgent:updateStatus',
  'performance:teacherAgent:blacklist',
  'performance:teacherAgent:unblacklist',
  'performance:teacherAgentRelation:page',
  'performance:teacherAgentRelation:add',
  'performance:teacherAgentRelation:update',
  'performance:teacherAgentRelation:delete',
  'performance:teacherAttribution:page',
  'performance:teacherAttribution:info',
  'performance:teacherAttribution:assign',
  'performance:teacherAttribution:change',
  'performance:teacherAttribution:remove',
  'performance:teacherAttributionConflict:page',
  'performance:teacherAttributionConflict:info',
  'performance:teacherAttributionConflict:create',
  'performance:teacherAttributionConflict:resolve',
  'performance:teacherAgentAudit:page',
  'performance:teacherAgentAudit:info',
  'performance:teacherInfo:page',
  'performance:teacherInfo:info',
  'performance:teacherInfo:add',
  'performance:teacherInfo:update',
  'performance:teacherInfo:assign',
  'performance:teacherInfo:updateStatus',
  'performance:teacherFollow:page',
  'performance:teacherFollow:add',
  'performance:teacherCooperation:mark',
  'performance:teacherClass:page',
  'performance:teacherClass:info',
  'performance:teacherClass:add',
  'performance:teacherClass:update',
  'performance:teacherClass:delete',
  'performance:teacherDashboard:summary',
  'performance:teacherTodo:page',
];

const READONLY_PERMS = [
  'performance:teacherAgent:page',
  'performance:teacherAgent:info',
  'performance:teacherAgentRelation:page',
  'performance:teacherAttribution:page',
  'performance:teacherAttribution:info',
  'performance:teacherAttributionConflict:page',
  'performance:teacherAttributionConflict:info',
  'performance:teacherAgentAudit:page',
  'performance:teacherAgentAudit:info',
  'performance:teacherInfo:page',
  'performance:teacherInfo:info',
  'performance:teacherFollow:page',
  'performance:teacherClass:page',
  'performance:teacherClass:info',
  'performance:teacherDashboard:summary',
  'performance:teacherTodo:page',
];

function createTeacher(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    teacherName: `班主任-${id}`,
    phone: '13812345678',
    wechat: 'wx_teacher_001',
    schoolName: '第一中学',
    schoolRegion: '上海',
    schoolType: '公立',
    grade: '高一',
    className: '1班',
    subject: '数学',
    projectTags: ['主题19'],
    intentionLevel: 'A',
    communicationStyle: '积极',
    cooperationStatus: 'uncontacted',
    ownerEmployeeId: 2,
    ownerDepartmentId: 11,
    lastFollowTime: null,
    nextFollowTime: null,
    cooperationTime: null,
    createTime: '2026-04-19 10:00:00',
    updateTime: '2026-04-19 10:00:00',
    ...overrides,
  };
}

function createUser(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    username: `user_${id}`,
    name: `用户-${id}`,
    nickName: `用户-${id}`,
    status: 1,
    departmentId: 11,
    ...overrides,
  };
}

function createDepartment(id: number, name: string) {
  return {
    id,
    name,
  };
}

function createAgent(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    name: `代理-${id}`,
    agentType: 'institution',
    level: 'A',
    region: '上海',
    cooperationStatus: 'active',
    status: 'active',
    blacklistStatus: 'normal',
    remark: null,
    ownerEmployeeId: 2,
    ownerDepartmentId: 11,
    createTime: '2026-04-19 10:00:00',
    updateTime: '2026-04-19 10:00:00',
    ...overrides,
  };
}

function createAttribution(id: number, overrides: Partial<any> = {}) {
  return {
    id,
    teacherId: 1,
    agentId: 1,
    attributionType: 'agent',
    status: 'active',
    sourceType: 'assign',
    sourceRemark: null,
    effectiveTime: '2026-04-19 10:00:00',
    operatorId: 1,
    operatorName: '管理员',
    createTime: '2026-04-19 10:00:00',
    updateTime: '2026-04-19 10:00:00',
    ...overrides,
  };
}

function createService(options?: {
  perms?: string[];
  admin?: Partial<any>;
  departmentIds?: number[];
}) {
  const teachers = new Map<number, any>([
    [1, createTeacher(1)],
    [2, createTeacher(2, { cooperationStatus: 'contacted', ownerEmployeeId: 3 })],
    [3, createTeacher(3, { cooperationStatus: 'partnered', ownerEmployeeId: 2 })],
  ]);
  const follows = new Map<number, any>();
  const classes = new Map<number, any>();
  const agents = new Map<number, any>([
    [1, createAgent(1, { name: '直营代理主体', agentType: 'direct' })],
    [2, createAgent(2, { name: '平台合作代理' })],
    [3, createAgent(3, { name: '停用代理', status: 'inactive' })],
    [4, createAgent(4, { name: '黑名单代理', blacklistStatus: 'blacklisted' })],
  ]);
  const relations = new Map<number, any>();
  const attributions = new Map<number, any>();
  const conflicts = new Map<number, any>();
  const audits = new Map<number, any>();
  const users = new Map<number, any>([
    [1, createUser(1, { username: 'admin', name: '管理员', departmentId: 11 })],
    [2, createUser(2, { username: 'manager_rd', name: '部门负责人', departmentId: 11 })],
    [3, createUser(3, { username: 'employee_platform', name: '部门员工', departmentId: 11 })],
    [4, createUser(4, { username: 'readonly_teacher', name: '只读账号', departmentId: 11 })],
    [5, createUser(5, { username: 'target_user', name: '目标人员', departmentId: 12 })],
    [6, createUser(6, { username: 'outsider_user', name: '外部人员', departmentId: 99 })],
  ]);
  const departments = new Map<number, any>([
    [11, createDepartment(11, '平台部')],
    [12, createDepartment(12, '教研部')],
    [99, createDepartment(99, '销售部')],
  ]);
  let followId = 100;
  let classId = 200;
  let relationId = 300;
  let attributionId = 400;
  let conflictId = 500;
  let auditId = 600;

  const service = new PerformanceTeacherChannelCoreService() as any;
  service.ctx = {
    admin: {
      userId: 1,
      username: 'admin',
      roleIds: [1],
      isAdmin: true,
      ...options?.admin,
    },
  };
  service.baseSysMenuService = {
    getPerms: jest.fn().mockResolvedValue(options?.perms || ADMIN_PERMS),
  };
  service.baseSysPermsService = {
    departmentIds: jest
      .fn()
      .mockResolvedValue(options?.departmentIds === undefined ? [11, 12] : options.departmentIds),
  };
  service.baseSysUserEntity = {
    findOneBy: jest.fn().mockImplementation(({ id }: any) => Promise.resolve(users.get(Number(id)) || null)),
    findBy: jest.fn().mockImplementation(({ id }: any) => {
      const ids = Array.isArray(id?._value) ? id._value : Array.isArray(id) ? id : [];
      return Promise.resolve(ids.map((item: number) => users.get(Number(item))).filter(Boolean));
    }),
  };
  service.baseSysDepartmentEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(departments.get(Number(id)) || null)),
    findBy: jest.fn().mockImplementation(({ id }: any) => {
      const ids = Array.isArray(id?._value) ? id._value : Array.isArray(id) ? id : [];
      return Promise.resolve(ids.map((item: number) => departments.get(Number(item))).filter(Boolean));
    }),
  };
  service.performanceTeacherInfoEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(teachers.get(Number(id)) || null)),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = teachers.get(Number(id));
      teachers.set(Number(id), {
        ...current,
        ...payload,
      });
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const nextId = teachers.size + 1;
      const saved = createTeacher(nextId, payload);
      teachers.set(nextId, saved);
      return saved;
    }),
    find: jest.fn().mockResolvedValue(Array.from(teachers.values())),
  };
  service.performanceTeacherFollowEntity = {
    count: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(
        Array.from(follows.values()).filter(item => Number(item.teacherId) === Number(where.teacherId)).length
      );
    }),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++followId,
        createTime: '2026-04-19 11:00:00',
        ...payload,
      };
      follows.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
  };
  service.performanceTeacherClassEntity = {
    count: jest.fn().mockImplementation(({ where }: any) => {
      return Promise.resolve(
        Array.from(classes.values()).filter(item => Number(item.teacherId) === Number(where.teacherId)).length
      );
    }),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++classId,
        createTime: '2026-04-19 12:00:00',
        updateTime: '2026-04-19 12:00:00',
        ...payload,
      };
      classes.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = classes.get(Number(id));
      classes.set(Number(id), {
        ...current,
        ...payload,
      });
    }),
    delete: jest.fn().mockImplementation(async (ids: number[]) => {
      ids.forEach(id => classes.delete(Number(id)));
    }),
    findBy: jest.fn().mockImplementation(({ id, teacherId }: any) => {
      if (id) {
        const ids = Array.isArray(id?._value) ? id._value : [];
        return Promise.resolve(ids.map((item: number) => classes.get(Number(item))).filter(Boolean));
      }
      if (teacherId) {
        const ids = Array.isArray(teacherId?._value) ? teacherId._value : [];
        return Promise.resolve(
          Array.from(classes.values()).filter(item => ids.includes(Number(item.teacherId)))
        );
      }
      return Promise.resolve(Array.from(classes.values()));
    }),
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(classes.get(Number(id)) || null)),
    find: jest.fn().mockResolvedValue(Array.from(classes.values())),
  };
  service.performanceTeacherAgentEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(agents.get(Number(id)) || null)),
    find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(agents.values()))),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const nextId = payload.id ? Number(payload.id) : agents.size + 1;
      const saved = createAgent(nextId, payload);
      agents.set(nextId, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = agents.get(Number(id));
      agents.set(Number(id), {
        ...current,
        ...payload,
        id: Number(id),
      });
    }),
  };
  service.performanceTeacherAgentRelationEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(relations.get(Number(id)) || null)),
    find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(relations.values()))),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++relationId,
        createTime: '2026-04-19 12:30:00',
        updateTime: '2026-04-19 12:30:00',
        ...payload,
      };
      relations.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = relations.get(Number(id));
      relations.set(Number(id), {
        ...current,
        ...payload,
        id: Number(id),
      });
    }),
  };
  service.performanceTeacherAttributionEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(attributions.get(Number(id)) || null)),
    find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(attributions.values()))),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++attributionId,
        createTime: '2026-04-19 13:00:00',
        updateTime: '2026-04-19 13:00:00',
        ...payload,
      };
      attributions.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = attributions.get(Number(id));
      attributions.set(Number(id), {
        ...current,
        ...payload,
        id: Number(id),
      });
    }),
  };
  service.performanceTeacherAttributionConflictEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(conflicts.get(Number(id)) || null)),
    find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(conflicts.values()))),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++conflictId,
        createTime: '2026-04-19 13:30:00',
        updateTime: '2026-04-19 13:30:00',
        ...payload,
      };
      conflicts.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
    update: jest.fn().mockImplementation(async ({ id }: any, payload: any) => {
      const current = conflicts.get(Number(id));
      conflicts.set(Number(id), {
        ...current,
        ...payload,
        id: Number(id),
      });
    }),
  };
  service.performanceTeacherAgentAuditEntity = {
    findOneBy: jest
      .fn()
      .mockImplementation(({ id }: any) => Promise.resolve(audits.get(Number(id)) || null)),
    find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(audits.values()))),
    save: jest.fn().mockImplementation(async (payload: any) => {
      const saved = {
        id: ++auditId,
        createTime: '2026-04-19 14:00:00',
        updateTime: '2026-04-19 14:00:00',
        ...payload,
      };
      audits.set(saved.id, saved);
      return saved;
    }),
    create: jest.fn().mockImplementation((payload: any) => payload),
  };
  attachAccessContext(service);

  return {
    service,
    teachers,
    classes,
    agents,
    relations,
    attributions,
    conflicts,
    audits,
  };
}

describe('theme19 teacher channel core service', () => {
  test('should mask phone and wechat for readonly account detail', async () => {
    const { service } = createService({
      perms: READONLY_PERMS,
      admin: {
        userId: 4,
        username: 'readonly_teacher',
        isAdmin: false,
      },
      departmentIds: [11],
    });

    const result = await service.teacherInfoInfo(1);

    expect(result.phone).toBe('138****5678');
    expect(result.wechat).toBe('wx****01');
    await expect(
      service.teacherFollowAdd({
        teacherId: 1,
        content: '只读跟进',
      })
    ).rejects.toThrow('无权限新增跟进记录');
  });

  test('should not escalate empty department scope into global visibility', async () => {
    const { service } = createService({
      perms: READONLY_PERMS,
      admin: {
        userId: 4,
        username: 'readonly_teacher',
        isAdmin: false,
      },
      departmentIds: [],
    });

    const profile = await service.teacherAccessProfile();

    expect(profile?.scopeType).toBe('self');
    expect(profile?.scopedDepartmentIds).toEqual([]);
    expect(profile?.scopedTeacherIds).toEqual([]);
    expect(profile?.scopedClassIds).toEqual([]);

    await expect(service.teacherInfoInfo(1)).rejects.toThrow('无权查看该班主任资源');
  });

  test('should authorize teacher-domain reads from permissionMask without legacy string perms', async () => {
    const permissionMask = resolvePermissionMask(
      ['performance:teacherInfo:info'],
      { isAdmin: false }
    );
    const { service } = createService({
      perms: [],
      admin: {
        userId: 4,
        username: 'readonly_teacher',
        isAdmin: false,
        permissionMask,
      },
      departmentIds: [11],
    });

    const detail = await service.teacherInfoInfo(1);
    const profile = await service.teacherAccessProfile();

    expect(detail.id).toBe(1);
    expect(profile?.permissionMask).toBe(permissionMask);
    await expect(
      service.teacherFollowAdd({
        teacherId: 1,
        content: 'bit-only permission should still reject writes',
      })
    ).rejects.toThrow('无权限新增跟进记录');
  });

  test('should enforce follow before cooperation and partnered before class creation', async () => {
    const { service, teachers, classes } = createService();

    await expect(
      service.teacherCooperationMark({
        id: 1,
      })
    ).rejects.toThrow('至少存在一条跟进记录后才允许标记合作');

    const follow = await service.teacherFollowAdd({
      teacherId: 1,
      content: '首次联系建立合作意向',
      nextFollowTime: '2026-04-20 09:00:00',
    });

    expect(follow.followContent).toBe('首次联系建立合作意向');
    expect(teachers.get(1)?.cooperationStatus).toBe('contacted');

    await expect(
      service.teacherClassAdd({
        teacherId: 1,
        className: '越权建班',
      })
    ).rejects.toThrow('仅已合作班主任可创建班级');

    const negotiating = await service.teacherInfoUpdateStatus({
      id: 1,
      status: 'negotiating',
    });
    expect(negotiating.cooperationStatus).toBe('negotiating');

    const partnered = await service.teacherCooperationMark({
      teacherId: 1,
    });
    expect(partnered.cooperationStatus).toBe('partnered');

    const teacherClass = await service.teacherClassAdd({
      teacherId: 1,
      className: '主题19联调班',
      studentCount: 20,
    });
    expect(teacherClass.status).toBe('draft');
    expect(teacherClass.teacherName).toBe('班主任-1');

    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '草稿态直接关闭',
        status: 'closed',
      })
    ).rejects.toThrow('草稿班级仅允许更新为 draft 或 active');

    const activated = await service.teacherClassUpdate({
      id: teacherClass.id,
      className: '主题19联调班',
      status: 'active',
    });
    expect(activated.status).toBe('active');

    const closed = await service.teacherClassUpdate({
      id: teacherClass.id,
      className: '主题19联调班',
      status: 'closed',
    });
    expect(closed.status).toBe('closed');

    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '激活后回退草稿',
        status: 'draft',
      })
    ).rejects.toThrow('已关闭班级不可编辑');

    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '关闭后再编辑',
        status: 'active',
      })
    ).rejects.toThrow('已关闭班级不可编辑');
    await expect(service.teacherClassDelete([teacherClass.id])).rejects.toThrow(
      '仅草稿班级允许删除'
    );
    expect(classes.has(Number(teacherClass.id))).toBe(true);
  });

  test('should reject unsupported teacher cooperation transitions with shared semantics', async () => {
    const { service, teachers } = createService();

    await expect(
      service.teacherInfoUpdateStatus({
        id: 1,
        status: 'negotiating',
      })
    ).rejects.toThrow('当前状态不允许推进到洽谈中');

    teachers.set(1, {
      ...teachers.get(1),
      cooperationStatus: 'contacted',
    });
    await expect(
      service.teacherInfoUpdateStatus({
        id: 1,
        status: 'partnered',
      })
    ).rejects.toThrow('当前接口仅支持 negotiating 或 terminated');

    await expect(
      service.teacherCooperationMark({
        teacherId: 1,
      })
    ).rejects.toThrow('至少存在一条跟进记录后才允许标记合作');
  });

  test('should reject teacher termination and cooperation mark state misuse with shared semantics', async () => {
    const { service, teachers } = createService();

    teachers.set(1, {
      ...teachers.get(1),
      cooperationStatus: 'contacted',
    });
    await expect(
      service.teacherInfoUpdateStatus({
        id: 1,
        status: 'terminated',
      })
    ).rejects.toThrow('仅已合作班主任可终止合作');

    const employeeScopedService = createService({
      perms: ['performance:teacherInfo:updateStatus'],
      admin: {
        userId: 3,
        username: 'employee_platform',
        isAdmin: false,
      },
      departmentIds: [11],
    }).service;
    await expect(
      employeeScopedService.teacherInfoUpdateStatus({
        id: 2,
        status: 'terminated',
      })
    ).rejects.toThrow('仅管理层或部门负责人可终止合作');

    teachers.set(3, {
      ...teachers.get(3),
      cooperationStatus: 'partnered',
    });
    await service.teacherFollowAdd({
      teacherId: 3,
      content: '先联系但不推进合作',
    });
    await expect(
      service.teacherCooperationMark({
        teacherId: 3,
      })
    ).rejects.toThrow('当前合作状态不允许标记为已合作');
  });

  test('should reject class creation for terminated teacher with shared semantics', async () => {
    const { service, teachers } = createService();

    teachers.set(1, {
      ...teachers.get(1),
      cooperationStatus: 'terminated',
    });
    await expect(
      service.teacherClassAdd({
        teacherId: 1,
        className: '终止合作建班',
      })
    ).rejects.toThrow('已终止合作的班主任不可新建班级');
  });

  test('should reject invalid teacher, class, agent, and attribution status semantics', async () => {
    const { service } = createService();

    await expect(
      service.teacherInfoUpdateStatus({
        id: 1,
        status: 'paused',
      })
    ).rejects.toThrow('班主任合作状态不合法');
    await service.teacherFollowAdd({
      teacherId: 1,
      content: '为非法班级状态测试准备合作数据',
    });
    await service.teacherInfoUpdateStatus({
      id: 1,
      status: 'negotiating',
    });
    await service.teacherCooperationMark({
      teacherId: 1,
    });
    const teacherClass = await service.teacherClassAdd({
      teacherId: 1,
      className: '非法状态班级',
    });
    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '非法状态班级',
        status: 'paused',
      })
    ).rejects.toThrow('班级状态不合法');
    await expect(
      service.teacherAgentPage({ page: 1, size: 10, status: 'paused' })
    ).rejects.toThrow('代理主体状态不合法');
    await expect(
      service.teacherAgentAdd({
        name: '非法黑名单状态代理',
        agentType: 'institution',
        blacklistStatus: 'blocked',
      })
    ).rejects.toThrow('代理主体黑名单状态不合法');
    await expect(
      service.teacherAgentRelationAdd({
        parentAgentId: 1,
        childAgentId: 2,
        status: 'paused',
      })
    ).rejects.toThrow('代理关系状态不合法');

    await service.teacherAttributionAssign({
      teacherId: 1,
      agentId: 2,
      sourceRemark: '准备测试冲突处理结果',
    });
    await service.teacherAttributionChange({
      teacherId: 1,
      agentId: 1,
      sourceRemark: '制造冲突',
    });
    await expect(
      service.teacherAttributionPage({ page: 1, size: 10, status: 'paused' })
    ).rejects.toThrow('归因状态不合法');
    await expect(
      service.teacherAttributionConflictPage({ page: 1, size: 10, status: 'paused' })
    ).rejects.toThrow('归因冲突状态不合法');
    const conflictPage = await service.teacherAttributionConflictPage({
      page: 1,
      size: 10,
    });
    const conflictId = conflictPage.list[0]?.id;

    await expect(
      service.teacherAttributionConflictResolve({
        id: conflictId,
        resolution: 'ignored',
      })
    ).rejects.toThrow('归因冲突处理结果不合法');
  });

  test('should reject preset teacher cooperation status on add', async () => {
    const { service } = createService();

    await expect(
      service.teacherInfoAdd({
        teacherName: '预设合作状态班主任',
        cooperationStatus: 'partnered',
      })
    ).rejects.toThrow('新增或编辑班主任资源不可直接指定合作状态');
  });

  test('should reject illegal active class transition before closing', async () => {
    const { service } = createService();

    const follow = await service.teacherFollowAdd({
      teacherId: 1,
      content: '建立合作并建班',
      nextFollowTime: '2026-04-20 09:00:00',
    });
    expect(follow.followContent).toBe('建立合作并建班');
    await service.teacherInfoUpdateStatus({
      id: 1,
      status: 'negotiating',
    });
    await service.teacherCooperationMark({
      teacherId: 1,
    });

    const teacherClass = await service.teacherClassAdd({
      teacherId: 1,
      className: '非法流转班级',
      studentCount: 12,
    });
    await service.teacherClassUpdate({
      id: teacherClass.id,
      className: '非法流转班级',
      status: 'active',
    });

    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '活跃态回退草稿',
        status: 'draft',
      })
    ).rejects.toThrow('当前班级状态不允许执行该操作');
  });

  test('should limit manager assignment to department tree', async () => {
    const { service, teachers } = createService({
      admin: {
        userId: 2,
        username: 'manager_rd',
        isAdmin: false,
      },
      departmentIds: [11, 12],
    });

    const assigned = await service.teacherInfoAssign({
      id: 1,
      ownerEmployeeId: 5,
    });
    expect(assigned.ownerEmployeeId).toBe(5);
    expect(teachers.get(1)?.ownerDepartmentId).toBe(12);

    await expect(
      service.teacherInfoAssign({
        id: 1,
        ownerEmployeeId: 6,
      })
    ).rejects.toThrow('无权分配到目标归属部门');
  });

  test('should reject teacher assignment without assign capability', async () => {
    const { service } = createService({
      perms: [],
      admin: {
        userId: 3,
        username: 'employee_platform',
        isAdmin: false,
      },
      departmentIds: [11],
    });

    await expect(
      service.teacherInfoAssign({
        id: 1,
        ownerEmployeeId: 3,
      })
    ).rejects.toThrow('无权限分配班主任资源');
  });

  test('should support agent main flow, prevent cycles, and keep audit records', async () => {
    const { service, agents, audits } = createService();

    const added = await service.teacherAgentAdd({
      name: '新增代理主体',
      agentType: 'institution',
      level: 'B',
      region: '杭州',
    });
    expect(added.name).toBe('新增代理主体');
    expect(added.status).toBe('active');

    const blacklisted = await service.teacherAgentBlacklist({ id: 2 });
    expect(blacklisted.blacklistStatus).toBe('blacklisted');

    const relationPage = await service.teacherAgentRelationAdd({
      parentAgentId: 1,
      childAgentId: 2,
      effectiveTime: '2026-04-20 10:00:00',
    });
    expect(relationPage.list?.[0]?.parentAgentId || relationPage.parentAgentId).toBe(1);

    await expect(
      service.teacherAgentRelationAdd({
        parentAgentId: 2,
        childAgentId: 1,
      })
    ).rejects.toThrow('不允许形成循环代理树');

    expect(agents.get(2)?.blacklistStatus).toBe('blacklisted');
    expect(audits.size).toBeGreaterThan(0);
  });

  test('should reject closing active class without manager role', async () => {
    const { service } = createService({
      perms: [
        'performance:teacherFollow:add',
        'performance:teacherInfo:info',
        'performance:teacherInfo:updateStatus',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:info',
      ],
      admin: {
        userId: 3,
        username: 'employee_platform',
        isAdmin: false,
      },
      departmentIds: [11],
    });

    await service.teacherFollowAdd({
      teacherId: 2,
      content: '准备创建班级并测试关闭权限',
    });
    await service.teacherInfoUpdateStatus({
      id: 2,
      status: 'negotiating',
    });
    await service.teacherCooperationMark({
      teacherId: 2,
    });
    const teacherClass = await service.teacherClassAdd({
      teacherId: 2,
      className: '关闭权限校验班级',
    });
    await service.teacherClassUpdate({
      id: teacherClass.id,
      className: '关闭权限校验班级',
      status: 'active',
    });

    await expect(
      service.teacherClassUpdate({
        id: teacherClass.id,
        className: '关闭权限校验班级',
        status: 'closed',
      })
    ).rejects.toThrow('仅管理层或部门负责人可关闭班级');
  });

  test('should reject viewing agent audit outside self scope', async () => {
    const { service, audits } = createService({
      perms: ['performance:teacherAgentAudit:info'],
      admin: {
        userId: 3,
        username: 'employee_platform',
        isAdmin: false,
      },
      departmentIds: [],
    });

    audits.set(701, {
      id: 701,
      resourceType: 'teacherAgent',
      resourceId: 1,
      action: 'update',
      operatorId: 2,
      operatorName: '部门负责人',
      beforeSnapshot: { ownerDepartmentId: 11 },
      afterSnapshot: { ownerDepartmentId: 11 },
      createTime: '2026-04-20 10:00:00',
      updateTime: '2026-04-20 10:00:00',
    });

    await expect(service.teacherAgentAuditInfo(701)).rejects.toThrow(
      '无权查看该代理审计'
    );
  });

  test('should reject inactive agents as relation targets', async () => {
    const { service } = createService();

    await expect(
      service.teacherAgentRelationAdd({
        parentAgentId: 3,
        childAgentId: 2,
      })
    ).rejects.toThrow('停用代理不能作为新的关系目标');
  });

  test('should reject self-loop agent relations', async () => {
    const { service } = createService();

    await expect(
      service.teacherAgentRelationAdd({
        parentAgentId: 1,
        childAgentId: 1,
      })
    ).rejects.toThrow('代理关系不允许指向自身');
  });

  test('should enforce attribution uniqueness, create conflict and resolve it', async () => {
    const { service, conflicts, audits } = createService();

    const firstAttribution = await service.teacherAttributionAssign({
      teacherId: 1,
      agentId: 2,
      sourceRemark: '首次归因',
    });
    expect(firstAttribution.currentAttribution.agentId).toBe(2);

    await expect(
      service.teacherAttributionAssign({
        teacherId: 1,
        agentId: 4,
      })
    ).rejects.toThrow('黑名单代理不可新增归因');

    const changed = await service.teacherAttributionChange({
      teacherId: 1,
      agentId: 1,
      sourceRemark: '切换直营',
    });
    expect(changed.openConflictCount).toBe(1);
    expect(conflicts.size).toBe(1);

    const conflictId = Array.from(conflicts.keys())[0];
    const resolved = await service.teacherAttributionConflictResolve({
      id: conflictId,
      resolution: 'resolved',
      agentId: 1,
      resolutionRemark: '直营胜出',
    });
    expect(resolved.agentId).toBe(1);

    const attributionInfo = await service.teacherInfoAttributionInfo(1);
    expect(attributionInfo.currentAttribution.agentId).toBe(1);
    expect(attributionInfo.openConflictCount).toBe(0);
    expect(audits.size).toBeGreaterThan(1);
  });

  test('should reject inactive agents for attribution assignment', async () => {
    const { service } = createService();

    await expect(
      service.teacherAttributionAssign({
        teacherId: 1,
        agentId: 3,
      })
    ).rejects.toThrow('停用代理不可新增归因');
  });

  test('should reject attribution assignment for terminated teachers and duplicate assign flow', async () => {
    const { service, teachers } = createService();

    teachers.set(1, {
      ...teachers.get(1),
      cooperationStatus: 'terminated',
    });
    await expect(
      service.teacherAttributionAssign({
        teacherId: 1,
        agentId: 2,
      })
    ).rejects.toThrow('已终止合作班主任不可新建代理归因');

    teachers.set(1, {
      ...teachers.get(1),
      cooperationStatus: 'uncontacted',
    });
    await service.teacherAttributionAssign({
      teacherId: 1,
      agentId: 2,
      sourceRemark: '首次归因',
    });

    await expect(
      service.teacherAttributionAssign({
        teacherId: 1,
        agentId: 1,
        sourceRemark: '重复建立归因',
      })
    ).rejects.toThrow('当前班主任已存在有效归因，请使用归因调整或冲突处理');
  });

  test('should reject resolving a closed attribution conflict', async () => {
    const { service, conflicts } = createService();

    await service.teacherAttributionAssign({
      teacherId: 1,
      agentId: 2,
      sourceRemark: '首次归因',
    });
    await service.teacherAttributionChange({
      teacherId: 1,
      agentId: 1,
      sourceRemark: '切换直营',
    });

    const conflictId = Array.from(conflicts.keys())[0];
    await service.teacherAttributionConflictResolve({
      id: conflictId,
      resolution: 'cancelled',
      resolutionRemark: '人工关闭',
    });

    await expect(
      service.teacherAttributionConflictResolve({
        id: conflictId,
        resolution: 'resolved',
        agentId: 1,
        resolutionRemark: '重复处理',
      })
    ).rejects.toThrow('当前归因冲突已关闭');
  });

  test('should reject removing attribution when current attribution is missing', async () => {
    const { service } = createService();

    await expect(
      service.teacherAttributionRemove({
        teacherId: 1,
      })
    ).rejects.toThrow('当前班主任不存在有效归因');
  });

  test('should reject readonly writes and mask attribution info visibility by scope', async () => {
    const { service } = createService({
      perms: READONLY_PERMS,
      admin: {
        userId: 4,
        username: 'readonly_teacher',
        isAdmin: false,
      },
      departmentIds: [11],
    });

    await expect(
      service.teacherAgentAdd({
        name: '只读新增代理',
        agentType: 'institution',
      })
    ).rejects.toThrow('无权限新增代理主体');

    await expect(
      service.teacherAttributionConflictResolve({
        id: 1,
        resolution: 'cancelled',
      })
    ).rejects.toThrow('无权限处理归因冲突');
  });
});
