import { Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { Context } from 'vm';
import { BaseSysRoleEntity } from '../../../entity/sys/role';
import { BaseSysRoleService } from '../../../service/sys/role';
import { resolveUserAdminRuntimeContext } from '../../../../user/domain';

/**
 * 系统角色
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: BaseSysRoleEntity,
  service: BaseSysRoleService,
  // 新增的时候插入当前用户ID
  insertParam: async (ctx: Context) => {
    const currentAdmin = resolveUserAdminRuntimeContext(ctx.admin);
    return {
      userId: currentAdmin.userId,
    };
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.name', 'a.label'],
    where: async (ctx: Context) => {
      const currentAdmin = resolveUserAdminRuntimeContext(ctx.admin);
      const userId = currentAdmin.userId;
      const roleIds = currentAdmin.roleIds;
      return [
        // 超级管理员的角色不展示
        ['COALESCE(a.isSuperAdmin, 0) != 1', {}],
        // 如果不是超管，只能看到自己新建的或者自己有的角色
        [
          `(a.userId=:userId or a.id in (${roleIds.join(',')}))`,
          { userId },
          currentAdmin.isAdmin !== true,
        ],
      ];
    },
  },
})
export class BaseSysRoleController extends BaseController {}
