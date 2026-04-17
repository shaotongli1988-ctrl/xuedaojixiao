/**
 * Base 部门列表上下文回退测试。
 * 这里负责验证当 ctx.admin 缺失但请求头仍带 token 时，部门列表接口仍能按当前角色和部门权限返回结果。
 * 不负责数据库联通、菜单回归或前端页面验证。
 */
import * as jwt from 'jsonwebtoken';
import { BaseSysDepartmentService } from '../../src/modules/base/service/sys/department';

describe('base department list fallback', () => {
  test('list should resolve admin from authorization token when ctx.admin is missing', async () => {
    const jwtConfig = require('../../src/modules/base/config').default({
      app: undefined,
      env: undefined,
    }).jwt;

    const andWhere = jest.fn().mockReturnThis();
    const orWhere = jest.fn().mockReturnThis();
    const addOrderBy = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([
      { id: 11, name: '研发中心', parentId: null, userId: 2001 },
      { id: 12, name: '平台组', parentId: 11, userId: 2001 },
    ]);

    const service = new BaseSysDepartmentService() as any;
    service.ctx = {
      headers: {
        authorization: jwt.sign(
          {
            userId: 2001,
            username: 'hr_admin',
            roleIds: [9],
            isAdmin: false,
          },
          jwtConfig.secret,
          {
            expiresIn: jwtConfig.token.expire,
          }
        ),
      },
    };
    service.baseSysPermsService = {
      isAdmin: jest.fn().mockResolvedValue(false),
      departmentIds: jest.fn().mockResolvedValue([11, 12]),
    };
    service.baseSysDepartmentEntity = {
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere,
        orWhere,
        addOrderBy,
        getMany,
      }),
    };

    const result = await service.list();

    expect(service.baseSysPermsService.departmentIds).toHaveBeenCalledWith(2001);
    expect(andWhere).toHaveBeenCalledWith('a.id in (:...ids)', {
      ids: [11, 12],
    });
    expect(orWhere).toHaveBeenCalledWith('a.userId = :userId', { userId: 2001 });
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      id: 12,
      parentName: '研发中心',
    });
  });
});
