/**
 * Base 模块 JWT 配置回归测试。
 * 这里负责验证运行期通过 module.base 读取 jwt 配置，不负责数据库、菜单或业务权限回归。
 */
import * as jwt from 'jsonwebtoken';
import { BaseAuthorityMiddleware } from '../../src/modules/base/middleware/authority';
import { BaseSysLoginService } from '../../src/modules/base/service/sys/login';
import { BaseSysMenuService } from '../../src/modules/base/service/sys/menu';
import { BaseSysPermsService } from '../../src/modules/base/service/sys/perms';
import * as md5 from 'md5';

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
      permissionMask: '0',
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

  test('login service should refresh admin token through user domain verifier', async () => {
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

    const refreshToken = jwt.sign(
      {
        isRefresh: true,
        isAdmin: false,
        username: 'employee_platform',
        userId: 3,
        roleIds: [9],
        passwordVersion: 7,
        permissionMask: '0',
        tenantId: null,
      },
      runtimeJwtConfig.secret,
      {
        expiresIn: runtimeJwtConfig.token.refreshExpire,
      }
    );

    const result = await service.refreshToken(refreshToken);
    const refreshedAccessToken = jwt.verify(
      result.token,
      runtimeJwtConfig.secret
    ) as Record<string, unknown>;
    const refreshedRefreshToken = jwt.verify(
      result.refreshToken,
      runtimeJwtConfig.secret
    ) as Record<string, unknown>;

    expect(refreshedAccessToken).toMatchObject({
      userId: 3,
      isRefresh: false,
      roleIds: [9],
      passwordVersion: 7,
    });
    expect(refreshedRefreshToken).toMatchObject({
      userId: 3,
      isRefresh: true,
      roleIds: [9],
      passwordVersion: 7,
    });
    expect(service.midwayCache.set).toHaveBeenCalledWith(
      'admin:passwordVersion:3',
      7
    );
    expect(service.midwayCache.set).toHaveBeenCalledWith(
      'admin:token:3',
      result.token
    );
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

  test('perms service should resolve super admin from role flag instead of role label', async () => {
    const service = new BaseSysPermsService() as any;
    service.baseSysRoleEntity = {
      findBy: jest
        .fn()
        .mockResolvedValueOnce([
          { id: 9, label: 'system_root', isSuperAdmin: true },
          { id: 12, label: 'performance_hr', isSuperAdmin: false },
        ])
        .mockResolvedValueOnce([
          { id: 12, label: 'performance_hr', isSuperAdmin: false },
        ]),
    };

    await expect(service.isAdmin([9, 12])).resolves.toBe(true);
    await expect(service.isAdmin([12])).resolves.toBe(false);
  });

  test('perms service should resolve current admin auth context from authorization token', async () => {
    const jwtConfig = require('../../src/modules/base/config').default({
      app: undefined,
      env: undefined,
    }).jwt;
    const service = new BaseSysPermsService() as any;
    service.app = undefined;
    service.ctx = {
      headers: {
        authorization: jwt.sign(
          {
            userId: 7,
            username: 'registry_owner',
            roleIds: [12],
            isAdmin: false,
          },
          jwtConfig.secret,
          {
            expiresIn: jwtConfig.token.expire,
          }
        ),
      },
    };
    service.baseSysMenuService = {
      getPerms: jest.fn().mockResolvedValue(['base:comm:person']),
    };

    await expect(service.currentUserIsAdmin()).resolves.toBe(false);
    await expect(service.currentPermissionMask()).resolves.toBe(
      service.getPermissionMask(['base:comm:person'], false)
    );
    expect(service.baseSysMenuService.getPerms).toHaveBeenCalledWith([12]);
  });

  test('login service should resolve super admin from role flag instead of admin label', async () => {
    const service = new BaseSysLoginService() as any;
    service.baseSysRoleEntity = {
      findBy: jest.fn().mockResolvedValue([
        { id: 9, label: 'system_root', isSuperAdmin: true },
      ]),
    };

    await expect(service.resolveIsAdmin([9])).resolves.toBe(true);

    service.baseSysRoleEntity.findBy.mockResolvedValueOnce([
      { id: 10, label: 'admin', isSuperAdmin: false },
    ]);

    await expect(service.resolveIsAdmin([10])).resolves.toBe(false);
  });

  test('login service should issue admin token when admin user is bound to super admin role', async () => {
    const service = new BaseSysLoginService() as any;
    service.allConfig = {
      module: {
        base: {
          jwt: runtimeJwtConfig,
        },
      },
    };
    service.captchaCheck = jest.fn().mockResolvedValue(true);
    service.baseSysUserEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 9,
        username: 'admin',
        status: 1,
        password: md5('123456'),
        passwordV: 3,
        tenantId: null,
      }),
    };
    service.baseSysRoleService = {
      getByUser: jest.fn().mockResolvedValue([99]),
    };
    service.baseSysRoleEntity = {
      findBy: jest.fn().mockResolvedValue([
        { id: 99, label: 'system_root', isSuperAdmin: true },
      ]),
    };
    service.baseSysMenuService = {
      getPerms: jest
        .fn()
        .mockResolvedValue(['base:comm:person', 'performance:goal:page']),
    };
    service.baseSysDepartmentService = {
      getByRoleIds: jest.fn().mockResolvedValue([1, 2, 3]),
    };
    service.midwayCache = {
      set: jest.fn().mockResolvedValue(undefined),
    };

    const result = await service.login({
      username: 'admin',
      password: '123456',
      captchaId: 'cid',
      verifyCode: 'pass',
    } as any);

    expect(result.permissionMask).not.toBe('0');
    expect(jwt.verify(result.token, runtimeJwtConfig.secret)).toMatchObject({
      userId: 9,
      username: 'admin',
      roleIds: [99],
      isAdmin: true,
      passwordVersion: 3,
    });
  });
});
