/**
 * User app runtime context consumer 测试。
 * 这里只验证 app service 从 user/domain/auth 统一读取当前用户 ID，不覆盖 app 登录流程、controller 装饰器加载或数据库联通。
 * 维护重点：运行时 consumer 侧不再散读 ctx.user.id；controller 静态约束交由 repo guard 覆盖。
 */
import { UserAddressService } from '../src/modules/user/service/address';

describe('user app runtime context consumers', () => {
  test('address service should read current user id through app runtime helper', async () => {
    const where = jest.fn().mockReturnThis();
    const addOrderBy = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([]);
    const service = new UserAddressService() as any;
    service.ctx = {
      user: {
        id: '18',
        isRefresh: false,
        tenantId: 5,
      },
    };
    service.userAddressEntity = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where,
        addOrderBy,
        getMany,
      }),
    };

    await service.list();

    expect(where).toHaveBeenCalledWith('userId = :userId ', { userId: 18 });
  });
});
