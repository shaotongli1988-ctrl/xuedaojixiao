/**
 * Base 用户超管唯一事实源回归测试。
 * 这里负责验证用户管理侧不再依赖 admin 用户名，而是基于 isSuperAdmin 角色绑定保护系统超管。
 * 不负责登录链路、菜单权限或数据库迁移验证。
 */
import { CoolCommException } from '@cool-midway/core';
import { BaseSysUserService } from '../../src/modules/base/service/sys/user';

describe('base user super-admin ssot', () => {
  test('page should exclude system super-admin users by role binding instead of username', async () => {
    const service = new BaseSysUserService() as any;
    service.ctx = {
      admin: {
        userId: 2001,
        roleIds: [9],
        isAdmin: true,
      },
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.setSql = jest.fn().mockReturnValue('');
    service.sqlRenderPage = jest.fn().mockResolvedValue({ list: [] });
    service.nativeQuery = jest
      .fn()
      .mockResolvedValueOnce([{ userId: 9 }])
      .mockResolvedValueOnce([]);

    await service.page({ page: 1, size: 10 });

    expect(service.setSql).toHaveBeenCalledWith(true, 'and a.id not in (?)', [[9]]);
  });

  test('updateUserRole should block a bound super-admin account even without admin username', async () => {
    const service = new BaseSysUserService() as any;
    service.nativeQuery = jest.fn().mockResolvedValue([{ userId: 9 }]);
    service.baseSysUserRoleEntity = {
      delete: jest.fn(),
      save: jest.fn(),
    };
    service.baseSysPermsService = {
      refreshPerms: jest.fn(),
    };

    await expect(
      service.updateUserRole({
        id: 9,
        username: 'system_root_holder',
        roleIdList: [8],
      })
    ).rejects.toBeInstanceOf(CoolCommException);

    expect(service.baseSysUserRoleEntity.delete).not.toHaveBeenCalled();
    expect(service.baseSysPermsService.refreshPerms).not.toHaveBeenCalled();
  });

  test('optionList should exclude system super-admin users by role binding instead of username', async () => {
    const getRawMany = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ getRawMany });
    const addOrderBy = jest.fn().mockReturnValue({ limit });
    const orderBy = jest.fn().mockReturnValue({ addOrderBy });
    const queryBuilder = { leftJoin: jest.fn(), select: jest.fn(), where: jest.fn(), andWhere: jest.fn(), orderBy: jest.fn() } as any;
    queryBuilder.leftJoin.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue({ addOrderBy });
    queryBuilder.getRawMany = getRawMany;

    const service = new BaseSysUserService() as any;
    service.ctx = {
      admin: {
        userId: 2001,
        roleIds: [9],
        isAdmin: true,
      },
    };
    service.baseSysPermsService = {
      departmentIds: jest.fn().mockResolvedValue([]),
    };
    service.baseSysUserEntity = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    service.nativeQuery = jest.fn().mockResolvedValue([{ userId: 9 }]);

    await service.optionList({ size: 20 });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'user.id not in (:...systemSuperAdminUserIds)',
      { systemSuperAdminUserIds: [9] }
    );
    expect(getRawMany).toHaveBeenCalled();
  });

  test('update should block a bound super-admin account even without admin username', async () => {
    const service = new BaseSysUserService() as any;
    service.nativeQuery = jest.fn().mockResolvedValue([{ userId: 9 }]);
    service.baseSysUserEntity = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    await expect(
      service.update({
        id: 9,
        username: 'system_root_holder',
        status: 1,
      })
    ).rejects.toBeInstanceOf(CoolCommException);

    expect(service.baseSysUserEntity.findOneBy).not.toHaveBeenCalled();
    expect(service.baseSysUserEntity.save).not.toHaveBeenCalled();
  });
});
