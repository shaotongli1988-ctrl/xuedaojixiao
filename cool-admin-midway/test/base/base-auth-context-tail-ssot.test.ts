/**
 * Base auth 尾部 consumer 收敛测试。
 * 这里负责验证 tenant/log 这类边缘 consumer 也从 user/domain/auth 读取 admin 上下文，不负责租户 SQL 注入防护或日志落库行为。
 * 维护重点：这些测试只锁定运行时上下文读取与恢复语义，避免尾部点重新散读 ctx.admin。
 */
import { noTenant, TenantSubscriber } from '../../src/modules/base/db/tenant';
import { BaseLogMiddleware } from '../../src/modules/base/middleware/log';

describe('base auth context tail ssot', () => {
  test('noTenant should restore admin tenantId after callback failure', async () => {
    const ctx: any = {
      admin: {
        userId: 9,
        username: 'system_root',
        tenantId: 21,
      },
    };

    await expect(
      noTenant(ctx, async () => {
        expect(ctx.admin.tenantId).toBeNull();
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    expect(ctx.admin.tenantId).toBe(21);
  });

  test('tenant subscriber should read admin tenantId and username through normalized runtime context', () => {
    const subscriber = new TenantSubscriber() as any;
    subscriber.tenant = {
      enable: true,
      urls: ['/admin/**'],
    };
    subscriber.ignoreUsername = ['blocked_admin'];
    subscriber.checkHandler = jest.fn().mockReturnValue(true);
    subscriber.getAllIgnoreUrls = jest.fn().mockReturnValue([]);

    subscriber.getCtx = jest.fn().mockReturnValue({
      url: '/admin/performance/goal/page',
      admin: {
        username: 'blocked_admin',
        tenantId: 21,
      },
    });

    expect(subscriber.getTenantId()).toBeUndefined();

    subscriber.getCtx = jest.fn().mockReturnValue({
      url: '/admin/performance/goal/page',
      admin: {
        username: 'platform_hr',
        tenantId: 21,
      },
    });

    expect(subscriber.getTenantId()).toBe(21);
  });

  test('log middleware should read admin userId through normalized runtime helper', async () => {
    const middleware = new BaseLogMiddleware();
    const record = jest.fn();
    const next = jest.fn().mockResolvedValue(undefined);
    const ctx: any = {
      url: '/admin/base/comm/person',
      req: { method: 'GET' },
      request: { query: { page: 1 }, body: {} },
      admin: {
        userId: '42',
        username: 'platform_hr',
      },
      requestContext: {
        getAsync: jest.fn().mockResolvedValue({
          record,
        }),
      },
    };

    await middleware.resolve()(ctx, next);

    expect(record).toHaveBeenCalledWith(
      ctx,
      '/admin/base/comm/person',
      { page: 1 },
      42
    );
    expect(next).toHaveBeenCalled();
  });
});
