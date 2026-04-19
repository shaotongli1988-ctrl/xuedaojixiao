/// <reference types="jest" />
/**
 * 主题19班主任渠道合作核心服务测试。
 * 这里只验证冻结范围内的权限、脱敏和状态机主链，不覆盖真实数据库、控制器装饰器或联调脚本。
 * 维护重点是跟进前不可合作、partnered 才可建班、closed 班级锁死、只读账号脱敏不可漂移。
 */
import { PerformanceTeacherChannelCoreService } from '../../src/modules/performance/service/teacher-channel-core';

const ADMIN_PERMS = [
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

  return {
    service,
    teachers,
    classes,
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
        className: '关闭后再编辑',
        status: 'active',
      })
    ).rejects.toThrow('已关闭班级不可编辑');
    await expect(service.teacherClassDelete([teacherClass.id])).rejects.toThrow(
      '仅草稿班级允许删除'
    );
    expect(classes.has(Number(teacherClass.id))).toBe(true);
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
});
