/// <reference types="jest" />
/**
 * User 模块 domain registry 最小测试。
 * 这里负责验证 admin/app 身份语义目录与现有 runtime 的 claim 和关键 helper 约定一致，不覆盖完整业务登录链。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jwt from 'jsonwebtoken';

import { GLOBAL_DOMAIN_SSOT_REGISTRY } from '../src/domain-registry';
import { BaseSysLoginService } from '../src/modules/base/service/sys/login';
import { BaseSysPermsService } from '../src/modules/base/service/sys/perms';
import {
  buildUserAdminTokenPayload,
  buildUserAppTokenPayload,
  buildUserAuthCacheKey,
  isUserAdminRefreshToken,
  isUserAppRefreshToken,
  readUserAdminTokenClaim,
  readUserAppTokenClaim,
  USER_ADMIN_TOKEN_CLAIMS,
  USER_APP_TOKEN_CLAIMS,
  USER_AUTH_CACHE_KEY_TEMPLATES,
  USER_DOMAIN_REGISTRY,
  USER_DOMAIN_REGISTRY_VERSION,
  resolveUserAppTenantId,
  resolveUserAppUserId,
  resolveUserAdminPasswordVersion,
  resolveUserAdminRoleIds,
  resolveUserAdminUserId,
} from '../src/modules/user/domain';

describe('user domain registry', () => {
  const runtimeJwtConfig = {
    secret: 'user-domain-registry-secret',
    token: {
      expire: 60,
      refreshExpire: 120,
    },
  };

  test('should expose phase1 registry and auth catalog', () => {
    expect(USER_DOMAIN_REGISTRY.version).toBe(USER_DOMAIN_REGISTRY_VERSION);
    expect(USER_DOMAIN_REGISTRY.auth.adminTokenClaims.length).toBeGreaterThan(0);
    expect(USER_DOMAIN_REGISTRY.auth.appTokenClaims.length).toBeGreaterThan(0);
    expect(USER_DOMAIN_REGISTRY.adminTokenClaimKeys).toEqual(
      USER_ADMIN_TOKEN_CLAIMS.map(item => item.key)
    );
    expect(USER_DOMAIN_REGISTRY.appTokenClaimKeys).toEqual(
      USER_APP_TOKEN_CLAIMS.map(item => item.key)
    );
    expect(USER_DOMAIN_REGISTRY.auth.superAdminRoleField.field).toBe(
      'isSuperAdmin'
    );
  });

  test('should keep admin token claim keys aligned with runtime generated token', async () => {
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
        id: 7,
        passwordV: 11,
        username: 'registry_owner',
        tenantId: 3,
      },
      [9, 12],
      runtimeJwtConfig.token.expire,
      false,
      true,
      '42'
    );

    const decoded = jwt.verify(token, runtimeJwtConfig.secret) as Record<
      string,
      unknown
    >;
    const actualClaimKeys = Object.keys(decoded)
      .filter(item => item !== 'exp' && item !== 'iat')
      .sort();

    expect(actualClaimKeys).toEqual([...USER_DOMAIN_REGISTRY.adminTokenClaimKeys].sort());
    expect(decoded).toMatchObject({
      userId: 7,
      username: 'registry_owner',
      roleIds: [9, 12],
      isAdmin: true,
      permissionMask: '42',
    });
  });

  test('should keep app token claim keys aligned with runtime helper payload shape', () => {
    const decoded = buildUserAppTokenPayload({
      id: 18,
      isRefresh: false,
      tenantId: 5,
    });
    const actualClaimKeys = Object.keys(decoded)
      .sort();

    expect(actualClaimKeys).toEqual([...USER_DOMAIN_REGISTRY.appTokenClaimKeys].sort());
    expect(decoded).toMatchObject({
      id: 18,
      isRefresh: false,
      tenantId: 5,
    });
  });

  test('should keep super-admin resolution aligned with role flag semantics', async () => {
    const permsService = new BaseSysPermsService() as any;
    permsService.baseSysRoleEntity = {
      findBy: jest
        .fn()
        .mockResolvedValueOnce([
          { id: 9, label: 'system_root', isSuperAdmin: true },
        ])
        .mockResolvedValueOnce([
          { id: 12, label: 'business_role', isSuperAdmin: false },
        ]),
    };

    const loginService = new BaseSysLoginService() as any;
    loginService.baseSysRoleEntity = {
      findBy: jest
        .fn()
        .mockResolvedValueOnce([
          { id: 9, label: 'system_root', isSuperAdmin: true },
        ])
        .mockResolvedValueOnce([
          { id: 12, label: 'admin', isSuperAdmin: false },
        ]),
    };

    await expect(permsService.isAdmin([9])).resolves.toBe(true);
    await expect(permsService.isAdmin([12])).resolves.toBe(false);
    await expect(loginService.resolveIsAdmin([9])).resolves.toBe(true);
    await expect(loginService.resolveIsAdmin([12])).resolves.toBe(false);
  });

  test('should keep auth cache key templates traceable in current runtime sources', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const loginSource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/base/service/sys/login.ts'),
      'utf8'
    );
    const permsSource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/base/service/sys/perms.ts'),
      'utf8'
    );
    const authoritySource = fs.readFileSync(
      path.join(repoRoot, 'src/modules/base/middleware/authority.ts'),
      'utf8'
    );

    expect(loginSource).toContain('buildUserAuthCacheKey');
    expect(loginSource).toContain('buildUserAdminTokenPayload');
    expect(permsSource).toContain('buildUserAuthCacheKey');
    expect(authoritySource).toContain('buildUserAuthCacheKey');
    expect(authoritySource).toContain('resolveUserAdminPasswordVersion');
    expect(USER_AUTH_CACHE_KEY_TEMPLATES.passwordVersion).toBe(
      'admin:passwordVersion:{userId}'
    );
  });

  test('should expose runtime auth helpers with stable semantics', () => {
    expect(buildUserAuthCacheKey('accessToken', 7)).toBe('admin:token:7');
    expect(buildUserAuthCacheKey('refreshToken', 7)).toBe(
      'admin:token:refresh:7'
    );

    const payload = buildUserAdminTokenPayload({
      isRefresh: true,
      roleIds: [9, 12],
      isAdmin: true,
      username: 'registry_owner',
      userId: 7,
      passwordVersion: 11,
      permissionMask: '42',
      tenantId: 3,
    });

    expect(readUserAdminTokenClaim(payload, 'username')).toBe('registry_owner');
    expect(resolveUserAdminUserId(payload)).toBe(7);
    expect(resolveUserAdminRoleIds(payload)).toEqual([9, 12]);
    expect(resolveUserAdminPasswordVersion(payload)).toBe(11);
    expect(isUserAdminRefreshToken(payload)).toBe(true);
  });

  test('should expose app token helpers with stable semantics', () => {
    const payload = buildUserAppTokenPayload({
      id: 18,
      isRefresh: true,
      tenantId: 5,
    });

    expect(readUserAppTokenClaim(payload, 'id')).toBe(18);
    expect(resolveUserAppUserId(payload)).toBe(18);
    expect(resolveUserAppTenantId(payload)).toBe(5);
    expect(isUserAppRefreshToken(payload)).toBe(true);
  });

  test('should trace fallback runtime consumers through user auth catalog', () => {
    const fallbackSource = USER_DOMAIN_REGISTRY.auth.runtimeSources.find(
      item => item.key === 'admin_runtime_context_fallback'
    );

    expect(fallbackSource).toEqual(
      expect.objectContaining({
        sourcePaths: expect.arrayContaining([
          'src/modules/base/service/sys/perms.ts',
          'src/modules/base/service/sys/user.ts',
          'src/modules/base/service/sys/department.ts',
          'src/modules/base/controller/admin/comm.ts',
        ]),
      })
    );
  });

  test('should trace current admin runtime context consumers through user auth catalog', () => {
    const consumerSource = USER_DOMAIN_REGISTRY.auth.runtimeSources.find(
      item => item.key === 'admin_runtime_context_consumers'
    );

    expect(consumerSource).toEqual(
      expect.objectContaining({
        sourcePaths: expect.arrayContaining([
          'src/modules/base/controller/admin/sys/user.ts',
          'src/modules/base/controller/admin/sys/department.ts',
          'src/modules/base/controller/admin/sys/role.ts',
          'src/modules/base/db/tenant.ts',
          'src/modules/base/middleware/log.ts',
          'src/modules/base/service/sys/menu.ts',
          'src/modules/base/service/sys/role.ts',
        ]),
      })
    );
  });

  test('should trace app token runtime consumers through user auth catalog', () => {
    const appSource = USER_DOMAIN_REGISTRY.auth.runtimeSources.find(
      item => item.key === 'app_token_refresh_and_verification'
    );

    expect(appSource).toEqual(
      expect.objectContaining({
        sourcePaths: expect.arrayContaining([
          'src/modules/user/service/login.ts',
          'src/modules/user/middleware/app.ts',
        ]),
      })
    );
  });

  test('should trace app runtime context consumers through user auth catalog', () => {
    const appConsumerSource = USER_DOMAIN_REGISTRY.auth.runtimeSources.find(
      item => item.key === 'app_runtime_context_consumers'
    );

    expect(appConsumerSource).toEqual(
      expect.objectContaining({
        sourcePaths: expect.arrayContaining([
          'src/modules/user/controller/app/address.ts',
          'src/modules/user/controller/app/info.ts',
          'src/modules/user/service/address.ts',
        ]),
      })
    );
  });

  test('should register user domain registry in global ssot map', () => {
    expect(GLOBAL_DOMAIN_SSOT_REGISTRY.modules.user.runtimeRegistry).toBe(
      USER_DOMAIN_REGISTRY
    );
    expect(
      GLOBAL_DOMAIN_SSOT_REGISTRY.modules.user.surfaces.find(
        item => item.key === 'domain_registry'
      )
    ).toEqual(
      expect.objectContaining({
        status: 'implemented',
        targetSourcePath: 'src/modules/user/domain/registry/index.ts',
      })
    );
  });
});
