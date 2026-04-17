/**
 * Base 用户分页上下文回退测试。
 * 这里负责验证当 ctx.admin 缺失但请求头仍带 token 时，用户分页接口仍能解析当前用户并补齐 roleIds。
 * 不负责数据库联通、菜单权限回归或前端页面验证。
 */
import * as jwt from 'jsonwebtoken';
import { BaseSysUserService } from '../../src/modules/base/service/sys/user';

describe('base user page fallback', () => {
  test('page should resolve admin from authorization token and map roleIds correctly', async () => {
    const jwtConfig = require('../../src/modules/base/config').default({
      app: undefined,
      env: undefined,
    }).jwt;

    const service = new BaseSysUserService() as any;
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
    service.setSql = jest.fn().mockReturnValue('');
    service.sqlRenderPage = jest.fn().mockResolvedValue({
      list: [
        { id: 3001, name: '平台员工' },
        { id: 3002, name: '销售员工' },
      ],
    });
    service.nativeQuery = jest.fn().mockResolvedValue([
      { userId: 3001, roleId: 4, name: '绩效HR管理员' },
      { userId: 3001, roleId: 7, name: '绩效经理' },
    ]);

    const result = await service.page({ page: 1, size: 10 });

    expect(service.baseSysPermsService.departmentIds).toHaveBeenCalledWith(2001);
    expect(service.sqlRenderPage).toHaveBeenCalled();
    expect(result.list[0]).toMatchObject({
      id: 3001,
      roleIds: [4, 7],
      roleName: '绩效HR管理员,绩效经理',
    });
    expect(result.list[1]).toMatchObject({
      id: 3002,
      roleIds: [],
      roleName: '',
    });
  });
});
