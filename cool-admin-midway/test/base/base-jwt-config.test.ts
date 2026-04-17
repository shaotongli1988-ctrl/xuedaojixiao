/**
 * Base 模块 JWT 配置回归测试。
 * 这里负责验证运行期通过 module.base 读取 jwt 配置，不负责数据库、菜单或业务权限回归。
 */
import * as jwt from 'jsonwebtoken';
import { BaseAuthorityMiddleware } from '../../src/modules/base/middleware/authority';
import { BaseSysLoginService } from '../../src/modules/base/service/sys/login';
import { BaseSysMenuService } from '../../src/modules/base/service/sys/menu';

describe('base jwt config resolution', () => {
  const runtimeJwtConfig = {
    sso: false,
    secret: 'unit-test-secret',
    token: {
      expire: 60,
      refreshExpire: 120,
    },
  };

  test('login service should sign token from runtime module.base config', async () => {
    const service = new BaseSysLoginService() as any;
    service.allConfig = {
      module: {
        base: {
          jwt: runtimeJwtConfig,
        },
      },
    };
    service.midwayCache = {
      set: jest.fn().mockResolvedValue(undefined),
    };

    const token = await service.generateToken(
      {
        id: 3,
        passwordV: 7,
        username: 'employee_platform',
        tenantId: null,
      },
      [9],
      runtimeJwtConfig.token.expire,
      false,
      false
    );

    expect(jwt.verify(token, runtimeJwtConfig.secret)).toMatchObject({
      userId: 3,
      username: 'employee_platform',
      roleIds: [9],
      isAdmin: false,
      passwordVersion: 7,
      isRefresh: false,
    });
  });

  test('authority middleware should verify admin token from runtime module.base config', async () => {
    const middleware = new BaseAuthorityMiddleware() as any;
    const token = jwt.sign(
      {
        isRefresh: false,
        isAdmin: true,
        username: 'admin',
        userId: 1,
        passwordVersion: 2,
      },
      runtimeJwtConfig.secret,
      {
        expiresIn: runtimeJwtConfig.token.expire,
      }
    );

    middleware.allConfig = {
      module: {
        base: {
          jwt: runtimeJwtConfig,
        },
      },
    };
    middleware.prefix = '';
    middleware.coolUrlTagData = {
      byKey: jest.fn().mockReturnValue([]),
    };
    middleware.utils = {
      matchUrl: jest.fn().mockReturnValue(false),
    };
    middleware.midwayCache = {
      get: jest
        .fn()
        .mockResolvedValueOnce(token)
        .mockResolvedValueOnce(2),
    };

    await middleware.init();
    const next = jest.fn().mockResolvedValue(undefined);

    await middleware.resolve()(
      {
        url: '/admin/performance/goal/page',
        get: jest.fn().mockReturnValue(token),
      },
      next
    );

    expect(next).toHaveBeenCalled();
  });

  test('menu service should not treat non-admin role id 1 as super admin', async () => {
    const service = new BaseSysMenuService() as any;
    const innerJoinAndSelect = jest.fn().mockReturnThis();
    const where = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([
      { perms: 'performance:assessment:page,performance:assessment:export' },
    ]);

    service.baseSysPermsService = {
      isAdmin: jest.fn().mockResolvedValue(false),
    };
    service.baseSysMenuEntity = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoinAndSelect,
        where,
        getMany,
      }),
    };

    const perms = await service.getPerms([1]);

    expect(service.baseSysPermsService.isAdmin).toHaveBeenCalledWith([1]);
    expect(innerJoinAndSelect).toHaveBeenCalledWith(
      expect.anything(),
      'b',
      'a.id = b.menuId AND b.roleId in (:...roleIds)',
      { roleIds: [1] }
    );
    expect(perms).toEqual([
      'performance:assessment:page',
      'performance:assessment:export',
    ]);
  });
});
