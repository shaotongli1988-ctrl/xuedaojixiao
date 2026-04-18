/// <reference types="jest" />
/**
 * 培训课程服务测试。
 * 这里负责验证主题 7 的状态限制、删除限制、字段白名单和权限拒绝，不覆盖真实数据库或联调环境。
 */
import {
  assertCourseDeletable,
  buildCourseUpdatePatch,
  normalizeCourseAddPayload,
} from '../../src/modules/performance/service/course-helper';
import { PerformanceCourseService } from '../../src/modules/performance/service/course';

describe('performance course helper', () => {
  test('should create draft course by default', () => {
    expect(
      normalizeCourseAddPayload({
        title: '新员工训练营',
        code: '',
        category: '通用培训',
      })
    ).toEqual({
      title: '新员工训练营',
      code: null,
      category: '通用培训',
      description: null,
      startDate: null,
      endDate: null,
      status: 'draft',
    });
  });

  test('should only allow description endDate and close on published course', () => {
    expect(
      buildCourseUpdatePatch(
        {
          title: '晋升领导力训练营',
          code: 'LEAD-001',
          category: '管理培训',
          description: '旧描述',
          startDate: '2026-05-01',
          endDate: '2026-05-10',
          status: 'published',
        },
        {
          id: 1,
          title: '晋升领导力训练营',
          code: 'LEAD-001',
          category: '管理培训',
          description: '新描述',
          startDate: '2026-05-01',
          endDate: '2026-05-20',
          status: 'closed',
        }
      )
    ).toEqual({
      description: '新描述',
      endDate: '2026-05-20',
      status: 'closed',
    });
  });

  test('should reject title change on published course', () => {
    expect(() =>
      buildCourseUpdatePatch(
        {
          title: '晋升领导力训练营',
          code: 'LEAD-001',
          category: '管理培训',
          description: '旧描述',
          startDate: '2026-05-01',
          endDate: '2026-05-10',
          status: 'published',
        },
        {
          title: '新版标题',
          code: 'LEAD-001',
          category: '管理培训',
          startDate: '2026-05-01',
          endDate: '2026-05-10',
          status: 'published',
        }
      )
    ).toThrow('已发布课程不允许修改标题');
  });

  test('should only allow deleting draft course', () => {
    expect(() => assertCourseDeletable('draft')).not.toThrow();
    expect(() => assertCourseDeletable('published')).toThrow(
      '当前状态不允许删除'
    );
    expect(() => assertCourseDeletable('closed')).toThrow(
      '当前状态不允许删除'
    );
  });
});

describe('performance course service', () => {
  test('should reject manager enrollment page access', async () => {
    const service = new PerformanceCourseService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:course:page', 'performance:course:info']),
    };

    await expect(
      service.enrollmentPage({ page: 1, size: 20, courseId: 1 })
    ).rejects.toThrow('无权限查看课程报名列表');
  });

  test('should reject duplicated optional code on add', async () => {
    const service = new PerformanceCourseService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:course:add']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({ id: 9, code: 'TR-001' }),
    };

    await expect(
      service.add({
        title: '课程A',
        code: 'TR-001',
      })
    ).rejects.toThrow('课程编码已存在');
  });

  test('should return enrollment summary fields only', async () => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          userId: 7,
          userName: '张三',
          enrollTime: '2026-05-02 10:00:00',
          status: 'passed',
          score: '95.50',
          certificateName: '不应返回',
        },
      ]),
    };
    const service = new PerformanceCourseService() as any;
    service.ctx = {
      admin: {
        userId: 1,
        roleIds: [1],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:course:enrollmentPage']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 8,
        title: '课程A',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    await expect(
      service.enrollmentPage({ page: 1, size: 20, courseId: 8 })
    ).resolves.toEqual({
      list: [
        {
          userId: 7,
          userName: '张三',
          enrollTime: '2026-05-02 10:00:00',
          status: 'passed',
          score: 95.5,
        },
      ],
      pagination: {
        page: 1,
        size: 20,
        total: 1,
      },
    });
  });
});
