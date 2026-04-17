/**
 * Base 角色超管判定回归测试。
 * 这里负责验证角色详情和列表不再把 roleId=1 误判为超管。
 */
import { BaseSysRoleService } from '../../src/modules/base/service/sys/role';
import { BaseSysMenuService } from '../../src/modules/base/service/sys/menu';

describe('base role admin resolution', () => {
  test('info should scope menus and departments for non-admin role id 1', async () => {
    const service = new BaseSysRoleService() as any;
    service.baseSysRoleEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        label: 'performance_hr',
        name: '绩效HR管理员',
      }),
    };
    service.baseSysRoleMenuEntity = {
      findBy: jest.fn().mockResolvedValue([{ menuId: 3 }, { menuId: 7 }]),
    };
    service.baseSysRoleDepartmentEntity = {
      findBy: jest.fn().mockResolvedValue([{ departmentId: 11 }]),
    };

    const result = await service.info(1);

    expect(service.baseSysRoleMenuEntity.findBy).toHaveBeenCalledWith({
      roleId: 1,
    });
    expect(service.baseSysRoleDepartmentEntity.findBy).toHaveBeenCalledWith({
      roleId: 1,
    });
    expect(result).toMatchObject({
      id: 1,
      label: 'performance_hr',
      menuIdList: [3, 7],
      departmentIdList: [11],
    });
  });

  test('info should keep all menus and departments only for admin label', async () => {
    const service = new BaseSysRoleService() as any;
    service.baseSysRoleEntity = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 9,
        label: 'admin',
        name: '超级管理员',
      }),
    };
    service.baseSysRoleMenuEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };
    service.baseSysRoleDepartmentEntity = {
      findBy: jest.fn().mockResolvedValue([]),
    };

    await service.info(9);

    expect(service.baseSysRoleMenuEntity.findBy).toHaveBeenCalledWith({});
    expect(service.baseSysRoleDepartmentEntity.findBy).toHaveBeenCalledWith({});
  });

  test('list should exclude admin role by label instead of fixed id', async () => {
    const where = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([]);
    const service = new BaseSysRoleService() as any;
    service.baseSysRoleEntity = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where,
        getMany,
      }),
    };
    service.baseSysPermsService = {
      isAdmin: jest.fn().mockResolvedValue(false),
    };
    service.ctx = {
      admin: {
        username: 'employee_platform',
        userId: 3,
        roleIds: [1],
      },
    };

    await service.list();

    const brackets = where.mock.calls[0][0];
    const bracketQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    };

    brackets.whereFactory(bracketQueryBuilder);

    expect(bracketQueryBuilder.where).toHaveBeenCalledWith(
      'a.label != :label',
      { label: 'admin' }
    );
    expect(bracketQueryBuilder.andWhere).toHaveBeenCalledWith(
      '(a.userId=:userId or a.id in (:...roleId))',
      {
        userId: 3,
        roleId: [1],
      }
    );
  });

  test('refreshPerms should refresh admin-role users instead of hardcoded user id 1', async () => {
    const service = new BaseSysMenuService() as any;
    service.baseSysRoleMenuEntity = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ userId: 33 }]),
      }),
    };
    service.baseSysRoleEntity = {
      findBy: jest.fn().mockResolvedValue([{ id: 9, label: 'admin' }]),
    };
    service.baseSysUserRoleEntity = {
      findBy: jest.fn().mockResolvedValue([
        { userId: 7, roleId: 9 },
        { userId: 7, roleId: 9 },
        { userId: 8, roleId: 9 },
      ]),
    };
    service.baseSysPermsService = {
      refreshPerms: jest.fn().mockResolvedValue(undefined),
    };

    await service.refreshPerms(100);

    expect(service.baseSysRoleEntity.findBy).toHaveBeenCalledWith({
      label: 'admin',
    });
    expect(service.baseSysUserRoleEntity.findBy).toHaveBeenCalledWith({
      roleId: expect.anything(),
    });
    expect(service.baseSysPermsService.refreshPerms).toHaveBeenCalledTimes(3);
    expect(service.baseSysPermsService.refreshPerms).toHaveBeenNthCalledWith(
      1,
      7
    );
    expect(service.baseSysPermsService.refreshPerms).toHaveBeenNthCalledWith(
      2,
      8
    );
    expect(service.baseSysPermsService.refreshPerms).toHaveBeenNthCalledWith(
      3,
      33
    );
  });
});
