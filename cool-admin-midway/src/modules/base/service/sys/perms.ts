import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  InjectClient,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { BaseSysMenuService } from './menu';
import { BaseSysRoleService } from './role';
import { BaseSysDepartmentService } from './department';
import { Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { BaseSysRoleEntity } from '../../entity/sys/role';
import { In, Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/typeorm';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

/**
 * 权限
 */
@Scope(ScopeEnum.Request, { allowDowngrade: true })
@Provide()
export class BaseSysPermsService extends BaseService {
  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  @Inject()
  baseSysMenuService: BaseSysMenuService;

  @Inject()
  baseSysRoleService: BaseSysRoleService;

  @Inject()
  baseSysDepartmentService: BaseSysDepartmentService;

  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @Inject()
  ctx: Context;

  @App()
  app: IMidwayApplication;

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }
    try {
      const contextManager: AsyncContextManager = this.app
        .getApplicationContext()
        .get(ASYNC_CONTEXT_MANAGER_KEY);
      return contextManager.active().getValue(ASYNC_CONTEXT_KEY) as Context;
    } catch (error) {
      return this.ctx;
    }
  }

  private get currentAdmin() {
    if (this.currentCtx?.admin) {
      return this.currentCtx.admin;
    }
    const token =
      this.currentCtx?.get?.('Authorization') ||
      this.currentCtx?.headers?.authorization;
    if (!token) {
      return undefined;
    }
    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }
  base: any;

  /**
   * 刷新权限
   * @param userId 用户ID
   */
  async refreshPerms(userId) {
    await this.midwayCache.del(`admin:token:${userId}`);
    const roleIds = await this.baseSysRoleService.getByUser(userId);
    const perms = await this.baseSysMenuService.getPerms(roleIds);
    await this.midwayCache.set(`admin:perms:${userId}`, perms);
    // 更新部门权限
    const departments = await this.baseSysDepartmentService.getByRoleIds(
      roleIds,
      await this.isAdmin(roleIds)
    );
    await this.midwayCache.set(`admin:department:${userId}`, departments);
  }

  /**
   * 根据角色判断是不是超管
   * @param roleIds
   */
  async isAdmin(roleIds: number[]) {
    if (!roleIds?.length) {
      return false;
    }
    const roles = await this.baseSysRoleEntity.findBy({ id: In(roleIds) });
    const roleLabels = roles.map(item => item.label);
    return roleLabels.includes('admin');
  }

  async currentUserIsAdmin(roleIds: number[] = this.currentAdmin?.roleIds || []) {
    if (typeof this.currentAdmin?.isAdmin === 'boolean') {
      return this.currentAdmin.isAdmin;
    }
    return this.isAdmin(roleIds);
  }

  /**
   * 获得权限菜单
   * @param roleIds
   */
  async permmenu(roleIds: number[]) {
    const perms = await this.baseSysMenuService.getPerms(roleIds);
    const menus = await this.baseSysMenuService.getMenus(
      roleIds,
      await this.currentUserIsAdmin(roleIds)
    );
    return { perms, menus };
  }

  /**
   * 根据用户ID获得部门权限
   * @param userId
   * @return 部门ID数组
   */
  async departmentIds(userId: number) {
    const department: any = await this.midwayCache.get(
      `admin:department:${userId}`
    );
    if (department) {
      return department;
    } else {
      return [];
    }
  }
}
