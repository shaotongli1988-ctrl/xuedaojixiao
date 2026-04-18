/// <reference types="jest" />
/**
 * 自动审批流控制器契约测试。
 * 这里负责验证冻结接口到 service 方法的参数转发关系，不负责数据库、权限或状态机细节。
 * 维护重点是接口名、入参形状和调用目标必须与阶段 0 冻结包保持一致。
 */
jest.mock('@midwayjs/core', () => ({
  ALL: 'ALL',
  Body: () => () => undefined,
  Get: () => () => undefined,
  Inject: () => () => undefined,
  Post: () => () => undefined,
  Provide: () => (target: any) => target,
  Query: () => () => undefined,
}));

jest.mock('@cool-midway/core', () => ({
  BaseController: class {
    ok(data: any) {
      return data;
    }
  },
  CoolController: () => (target: any) => target,
}));

jest.mock('../../src/modules/performance/service/approval-flow', () => ({
  PerformanceApprovalFlowService: class {},
}));

const {
  AdminPerformanceApprovalFlowController,
} = require('../../src/modules/performance/controller/admin/approval-flow');

function createController() {
  const service = {
    configInfo: jest.fn().mockResolvedValue({ ok: 'configInfo' }),
    configSave: jest.fn().mockResolvedValue({ ok: 'configSave' }),
    info: jest.fn().mockResolvedValue({ ok: 'info' }),
    approve: jest.fn().mockResolvedValue({ ok: 'approve' }),
    reject: jest.fn().mockResolvedValue({ ok: 'reject' }),
    transfer: jest.fn().mockResolvedValue({ ok: 'transfer' }),
    withdraw: jest.fn().mockResolvedValue({ ok: 'withdraw' }),
    remind: jest.fn().mockResolvedValue({ ok: 'remind' }),
    resolve: jest.fn().mockResolvedValue({ ok: 'resolve' }),
    fallback: jest.fn().mockResolvedValue({ ok: 'fallback' }),
    terminate: jest.fn().mockResolvedValue({ ok: 'terminate' }),
  };

  const controller = new AdminPerformanceApprovalFlowController() as any;
  controller.performanceApprovalFlowService = service;
  controller.ok = jest.fn((data: any) => data);

  return { controller, service };
}

describe('approval-flow controller contract', () => {
  test('should forward configInfo objectType', async () => {
    const { controller, service } = createController();

    await expect(controller.configInfo('assessment')).resolves.toEqual({
      ok: 'configInfo',
    });
    expect(service.configInfo).toHaveBeenCalledWith('assessment');
  });

  test('should forward configSave payload', async () => {
    const { controller, service } = createController();
    const payload = {
      objectType: 'assessment',
      enabled: true,
      version: 'v1',
      nodes: [],
    };

    await expect(controller.configSave(payload)).resolves.toEqual({
      ok: 'configSave',
    });
    expect(service.configSave).toHaveBeenCalledWith(payload);
  });

  test('should forward infoDetail id as number', async () => {
    const { controller, service } = createController();

    await expect(controller.infoDetail('12' as any)).resolves.toEqual({
      ok: 'info',
    });
    expect(service.info).toHaveBeenCalledWith(12);
  });

  test('should forward approve payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, comment: '通过' };

    await expect(controller.approve(payload)).resolves.toEqual({ ok: 'approve' });
    expect(service.approve).toHaveBeenCalledWith(payload);
  });

  test('should forward reject payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, comment: '驳回' };

    await expect(controller.reject(payload)).resolves.toEqual({ ok: 'reject' });
    expect(service.reject).toHaveBeenCalledWith(payload);
  });

  test('should forward transfer payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, toUserId: 9, reason: '转办' };

    await expect(controller.transfer(payload)).resolves.toEqual({
      ok: 'transfer',
    });
    expect(service.transfer).toHaveBeenCalledWith(payload);
  });

  test('should forward withdraw payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, reason: '撤回' };

    await expect(controller.withdraw(payload)).resolves.toEqual({
      ok: 'withdraw',
    });
    expect(service.withdraw).toHaveBeenCalledWith(payload);
  });

  test('should forward remind payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, note: '催办一次' };

    await expect(controller.remind(payload)).resolves.toEqual({ ok: 'remind' });
    expect(service.remind).toHaveBeenCalledWith(payload);
  });

  test('should forward resolve payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, assigneeUserId: 18, reason: 'HR 指定' };

    await expect(controller.resolve(payload)).resolves.toEqual({ ok: 'resolve' });
    expect(service.resolve).toHaveBeenCalledWith(payload);
  });

  test('should forward fallback payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, reason: '切回人工审批' };

    await expect(controller.fallback(payload)).resolves.toEqual({
      ok: 'fallback',
    });
    expect(service.fallback).toHaveBeenCalledWith(payload);
  });

  test('should forward terminate payload', async () => {
    const { controller, service } = createController();
    const payload = { instanceId: 1, reason: '强制终止' };

    await expect(controller.terminate(payload)).resolves.toEqual({
      ok: 'terminate',
    });
    expect(service.terminate).toHaveBeenCalledWith(payload);
  });
});
