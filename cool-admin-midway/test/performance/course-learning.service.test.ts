/// <reference types="jest" />
/**
 * 课程学习增强服务测试。
 * 这里只验证主题14的本人范围、权限、状态流和考试摘要锁定规则，不覆盖真实数据库、菜单导入或外部 AI 评估实现。
 */
import { PerformanceCourseExamService } from '../../src/modules/performance/service/course-exam';
import { PerformanceCoursePracticeService } from '../../src/modules/performance/service/course-practice';
import { PerformanceCourseReciteService } from '../../src/modules/performance/service/course-recite';
import { PerformanceAccessContextService } from '../../src/modules/performance/service/access-context';

function attachAccessContextService(service: any) {
  if (!service.baseSysMenuService) {
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
  }
  if (!service.baseSysPermsService) {
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
  }
  service.performanceAccessContextService = Object.assign(
    new PerformanceAccessContextService(),
    {
      ctx: service.ctx,
      baseSysMenuService: service.baseSysMenuService,
      baseSysPermsService: service.baseSysPermsService,
    }
  );
}

describe('performance course learning services', () => {
  test('should return recite page with self-only summary fields', async () => {
    const service = new PerformanceCourseReciteService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseRecite:page']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
      }),
    };
    service.performanceCourseReciteEntity = {
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 101,
            courseId: 10,
            userId: 3,
            courseTitle: '新员工课程',
            title: '第一章背诵',
            promptText: '不应在分页返回',
            submissionText: '不应在分页返回',
            status: 'pending',
            latestScore: null,
            feedbackSummary: null,
            submittedAt: null,
            evaluatedAt: null,
          },
        ],
        1,
      ]),
    };
    attachAccessContextService(service);

    await expect(
      service.page({ page: 1, size: 20, courseId: 10 })
    ).resolves.toEqual({
      list: [
        {
          id: 101,
          courseId: 10,
          courseTitle: '新员工课程',
          title: '第一章背诵',
          taskType: 'recite',
          status: 'pending',
          latestScore: null,
          feedbackSummary: null,
          submittedAt: null,
          evaluatedAt: null,
        },
      ],
      pagination: {
        page: 1,
        size: 20,
        total: 1,
      },
    });
  });

  test('should reject recite info access for another user task', async () => {
    const service = new PerformanceCourseReciteService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseRecite:info']),
    };
    service.performanceCourseReciteEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 201,
        courseId: 10,
        userId: 99,
      }),
    };
    attachAccessContextService(service);

    await expect(service.info(201)).rejects.toThrow('无权访问该背诵任务');
  });

  test('should submit recite task with text only and keep submitted status', async () => {
    const service = new PerformanceCourseReciteService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['performance:courseRecite:submit', 'performance:courseRecite:info']),
    };
    service.performanceCourseReciteEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 301,
        courseId: 10,
        userId: 3,
        courseTitle: '新员工课程',
        title: '第一章背诵',
        promptText: '请背诵第一章',
        status: 'pending',
        submittedAt: null,
        evaluatedAt: null,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
      }),
    };
    service.info = jest.fn().mockResolvedValue({
      id: 301,
      status: 'submitted',
      submissionText: '我的文本提交',
    });
    attachAccessContextService(service);

    await expect(
      service.submit({
        id: 301,
        submissionText: '  我的文本提交  ',
      })
    ).resolves.toEqual({
      id: 301,
      status: 'submitted',
      submissionText: '我的文本提交',
    });

    expect(service.performanceCourseReciteEntity.update).toHaveBeenCalledWith(
      { id: 301 },
      expect.objectContaining({
        submissionText: '我的文本提交',
        status: 'submitted',
        latestScore: null,
        feedbackSummary: null,
        evaluatedAt: null,
      })
    );
  });

  test('should reject submitting evaluated recite task', async () => {
    const service = new PerformanceCourseReciteService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseRecite:submit']),
    };
    service.performanceCourseReciteEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 302,
        courseId: 10,
        userId: 3,
        status: 'evaluated',
      }),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
      }),
    };
    attachAccessContextService(service);

    await expect(
      service.submit({
        id: 302,
        submissionText: '再次提交',
      })
    ).rejects.toThrow('已评估任务不可再次提交');
  });

  test('should reject submitting evaluated practice task', async () => {
    const service = new PerformanceCoursePracticeService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:coursePractice:submit']),
    };
    service.performanceCoursePracticeEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 401,
        courseId: 10,
        userId: 3,
        status: 'evaluated',
      }),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
      }),
    };
    attachAccessContextService(service);

    await expect(
      service.submit({
        id: 401,
        submissionText: '再次提交',
      })
    ).rejects.toThrow('已评估任务不可再次提交');
  });

  test('should reject practice page without employee permission', async () => {
    const service = new PerformanceCoursePracticeService() as any;
    service.ctx = {
      admin: {
        userId: 2,
        roleIds: [2],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(
      service.page({ page: 1, size: 20, courseId: 10 })
    ).rejects.toThrow('无权限查看练习任务列表');
  });

  test('should return locked exam summary when prerequisite tasks are not met', async () => {
    const service = new PerformanceCourseExamService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseExam:summary']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
        score: null,
        updateTime: '2026-04-18 10:00:00',
      }),
    };
    attachAccessContextService(service);
    service.performanceCourseExamResultEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    service.performanceCourseReciteEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 501,
          courseId: 10,
          userId: 3,
          status: 'pending',
          updateTime: '2026-04-18 10:10:00',
        },
      ]),
    };
    service.performanceCoursePracticeEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.summary(10)).resolves.toEqual({
      courseId: 10,
      courseTitle: '新员工课程',
      resultStatus: 'locked',
      latestScore: null,
      passThreshold: null,
      summaryText: '前置学习任务未满足，结果摘要暂不可见',
      updatedAt: '2026-04-18 10:10:00',
    });
  });

  test('should return pending exam summary when tasks are submitted but not evaluated', async () => {
    const service = new PerformanceCourseExamService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseExam:summary']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'published',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'registered',
        score: null,
        updateTime: '2026-04-18 11:00:00',
      }),
    };
    service.performanceCourseExamResultEntity = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    service.performanceCourseReciteEntity = {
      findBy: jest.fn().mockResolvedValue([
        {
          id: 601,
          courseId: 10,
          userId: 3,
          status: 'submitted',
          submittedAt: '2026-04-18 11:05:00',
          updateTime: '2026-04-18 11:05:00',
        },
      ]),
    };
    service.performanceCoursePracticeEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    attachAccessContextService(service);

    await expect(service.summary(10)).resolves.toEqual({
      courseId: 10,
      courseTitle: '新员工课程',
      resultStatus: 'pending',
      latestScore: null,
      passThreshold: null,
      summaryText: '结果摘要生成中',
      updatedAt: '2026-04-18 11:05:00',
    });
  });

  test('should prefer saved exam summary when seeded record exists', async () => {
    const service = new PerformanceCourseExamService() as any;
    service.ctx = {
      admin: {
        userId: 3,
        roleIds: [3],
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['performance:courseExam:summary']),
    };
    service.performanceCourseEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 10,
        title: '新员工课程',
        status: 'closed',
      }),
    };
    service.performanceCourseEnrollmentEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        status: 'passed',
        score: 88.5,
        updateTime: '2026-04-18 12:00:00',
      }),
    };
    service.performanceCourseExamResultEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        courseId: 10,
        userId: 3,
        courseTitle: '新员工课程',
        resultStatus: 'passed',
        latestScore: 95.5,
        passThreshold: 60,
        summaryText: '课程学习闭环已完成，可进入后续应用。',
        updatedAt: '2026-04-18 12:20:00',
        vendor: '不应返回',
      }),
    };
    attachAccessContextService(service);

    const result = await service.summary(10);

    expect(result).toEqual({
      courseId: 10,
      courseTitle: '新员工课程',
      resultStatus: 'passed',
      latestScore: 95.5,
      passThreshold: 60,
      summaryText: '课程学习闭环已完成，可进入后续应用。',
      updatedAt: '2026-04-18 12:20:00',
    });
    expect(Object.prototype.hasOwnProperty.call(result, 'vendor')).toBe(false);
  });
});
