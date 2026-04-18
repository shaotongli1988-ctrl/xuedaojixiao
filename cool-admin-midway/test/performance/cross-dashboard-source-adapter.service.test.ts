/// <reference types="jest" />
/**
 * 跨模块驾驶舱来源快照读取适配层测试。
 * 这里负责验证快照输入统一化、缺失来源占位和契约校验，不负责 controller 或真实外部来源接入。
 */

const {
  PerformanceCrossDashboardSourceAdapter,
} = require('../../src/modules/performance/service/cross-dashboard-source-adapter');

describe('cross dashboard source adapter', () => {
  test('should adapt source snapshots into unified metric inputs without recalculating formulas', async () => {
    const recruitmentProvider = {
      domain: 'recruitment',
      readSnapshots: jest.fn().mockResolvedValue([
        {
          metricCode: 'recruitment_completion_rate',
          metricLabel: '招聘达成率',
          metricValue: '87.5',
          unit: '%',
          periodType: 'quarter',
          periodValue: '2026-Q2',
          scopeType: 'global',
          deptKey: null,
          updatedAt: '2026-04-18T08:00:00.000Z',
          sourceStatus: 'ready',
          statusText: '已就绪',
        },
      ]),
    };
    const trainingProvider = {
      domain: 'training',
      readSnapshots: jest.fn().mockResolvedValue([
        {
          metricCode: 'training_pass_rate',
          metricLabel: '内训通关率',
          metricValue: 92,
          unit: '%',
          periodType: 'quarter',
          periodValue: '2026-Q2',
          scopeType: 'global',
          deptKey: null,
          updatedAt: '2026-04-18T07:00:00.000Z',
          sourceStatus: 'delayed',
          statusText: '数据延迟',
        },
      ]),
    };
    const meetingProvider = {
      domain: 'meeting',
      readSnapshots: jest.fn().mockResolvedValue([
        {
          metricCode: 'meeting_effectiveness_index',
          metricLabel: '会议效能看板',
          metricValue: 74.25,
          unit: '分',
          periodType: 'quarter',
          periodValue: '2026-Q2',
          scopeType: 'global',
          deptKey: null,
          updatedAt: '2026-04-18T06:30:00.000Z',
          sourceStatus: 'ready',
          statusText: '已就绪',
        },
      ]),
    };

    const adapter = new PerformanceCrossDashboardSourceAdapter([
      recruitmentProvider,
      trainingProvider,
      meetingProvider,
    ]);

    const result = await adapter.readMetricInputs({
      periodType: 'quarter',
      periodValue: '2026-Q2',
      scopeType: 'global',
    });

    expect(result).toEqual([
      {
        metricCode: 'recruitment_completion_rate',
        metricLabel: '招聘达成率',
        sourceDomain: 'recruitment',
        metricValue: 87.5,
        unit: '%',
        periodType: 'quarter',
        periodValue: '2026-Q2',
        scopeType: 'global',
        departmentId: null,
        updatedAt: '2026-04-18T08:00:00.000Z',
        dataStatus: 'ready',
        statusText: '已就绪',
        sort: 1,
      },
      {
        metricCode: 'training_pass_rate',
        metricLabel: '内训通关率',
        sourceDomain: 'training',
        metricValue: 92,
        unit: '%',
        periodType: 'quarter',
        periodValue: '2026-Q2',
        scopeType: 'global',
        departmentId: null,
        updatedAt: '2026-04-18T07:00:00.000Z',
        dataStatus: 'delayed',
        statusText: '数据延迟',
        sort: 2,
      },
      {
        metricCode: 'meeting_effectiveness_index',
        metricLabel: '会议效能看板',
        sourceDomain: 'meeting',
        metricValue: 74.25,
        unit: '分',
        periodType: 'quarter',
        periodValue: '2026-Q2',
        scopeType: 'global',
        departmentId: null,
        updatedAt: '2026-04-18T06:30:00.000Z',
        dataStatus: 'ready',
        statusText: '已就绪',
        sort: 3,
      },
    ]);
    expect(recruitmentProvider.readSnapshots).toHaveBeenCalledWith({
      periodType: 'quarter',
      periodValue: '2026-Q2',
      scopeType: 'global',
      departmentId: null,
      metricCodes: ['recruitment_completion_rate'],
    });
  });

  test('should keep unavailable placeholders when source provider is missing or metric snapshot is absent', async () => {
    const recruitmentProvider = {
      domain: 'recruitment',
      readSnapshots: jest.fn().mockResolvedValue([
        {
          metricCode: 'recruitment_completion_rate',
          metricLabel: '招聘达成率',
          metricValue: 81,
          unit: '%',
          periodType: 'year',
          periodValue: '2026',
          scopeType: 'department_tree',
          deptKey: 11,
          updatedAt: '2026-04-18T09:00:00.000Z',
          sourceStatus: 'ready',
          statusText: '已就绪',
        },
      ]),
    };

    const adapter = new PerformanceCrossDashboardSourceAdapter([
      recruitmentProvider,
    ]);

    const result = await adapter.readMetricInputs({
      periodType: 'year',
      periodValue: '2026',
      scopeType: 'department_tree',
      departmentId: 11,
      metricCodes: [
        'recruitment_completion_rate',
        'training_pass_rate',
        'meeting_effectiveness_index',
      ],
    });

    expect(result[0]).toMatchObject({
      metricCode: 'recruitment_completion_rate',
      metricValue: 81,
      dataStatus: 'ready',
      departmentId: 11,
    });
    expect(result[1]).toEqual({
      metricCode: 'training_pass_rate',
      metricLabel: '内训通关率',
      sourceDomain: 'training',
      metricValue: null,
      unit: '',
      periodType: 'year',
      periodValue: '2026',
      scopeType: 'department_tree',
      departmentId: 11,
      updatedAt: null,
      dataStatus: 'unavailable',
      statusText: '暂不可用',
      sort: 2,
    });
    expect(result[2]).toEqual({
      metricCode: 'meeting_effectiveness_index',
      metricLabel: '会议效能看板',
      sourceDomain: 'meeting',
      metricValue: null,
      unit: '',
      periodType: 'year',
      periodValue: '2026',
      scopeType: 'department_tree',
      departmentId: 11,
      updatedAt: null,
      dataStatus: 'unavailable',
      statusText: '暂不可用',
      sort: 3,
    });
  });

  test('should reject source snapshots when scope or metric contract is invalid', async () => {
    const trainingProvider = {
      domain: 'training',
      readSnapshots: jest.fn().mockResolvedValue([
        {
          metricCode: 'training_pass_rate',
          metricLabel: '内训通关率',
          metricValue: 88,
          unit: '%',
          periodType: 'month',
          periodValue: '2026-04',
          scopeType: 'department_tree',
          deptKey: null,
          updatedAt: null,
          sourceStatus: 'ready',
          statusText: '已就绪',
        },
      ]),
    };

    const adapter = new PerformanceCrossDashboardSourceAdapter([
      trainingProvider,
    ]);

    await expect(
      adapter.readMetricInputs({
        periodType: 'month',
        periodValue: '2026-04',
        scopeType: 'department_tree',
        departmentId: 12,
        metricCodes: ['training_pass_rate'],
      })
    ).rejects.toMatchObject({
      message: '来源快照缺少合法的部门范围标识',
    });
  });
});
