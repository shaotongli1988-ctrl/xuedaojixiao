import { Get, Inject, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { UserAddressEntity } from '../../entity/address';
import { UserAddressService } from '../../service/address';
import { resolveUserAppRuntimeContext } from '../../domain';

/**
 * 地址
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: UserAddressEntity,
  service: UserAddressService,
  insertParam: ctx => {
    const currentUser = resolveUserAppRuntimeContext(ctx.user);
    return {
      userId: currentUser.userId,
    };
  },
  pageQueryOp: {
    where: async ctx => {
      const currentUser = resolveUserAppRuntimeContext(ctx.user);
      return [['userId =:userId', { userId: currentUser.userId }]];
    },
    addOrderBy: {
      isDefault: 'DESC',
    },
  },
})
export class AppUserAddressController extends BaseController {
  @Inject()
  userAddressService: UserAddressService;

  @Inject()
  ctx;

  @Get('/default', { summary: '默认地址' })
  async default() {
    const currentUser = resolveUserAppRuntimeContext(this.ctx.user);
    return this.ok(await this.userAddressService.default(currentUser.userId));
  }
}
