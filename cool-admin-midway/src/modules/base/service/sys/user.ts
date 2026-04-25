import {
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  IMidwayApplication,
  Inject,
  InjectClient,
  Provide,
} from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysPermsService } from './perms';
import * as _ from 'lodash';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';
import * as md5 from 'md5';
import { BaseSysDepartmentEntity } from '../../entity/sys/department';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { BaseSysRoleEntity } from '../../entity/sys/role';
import { Context } from '@midwayjs/koa';
import {
  buildUserAuthCacheKey,
  resolveUserAdminRuntimeContext,
  verifyUserAdminToken,
} from '../../../user/domain';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

/**
 * 系统用户
 */
@Provide()
export class BaseSysUserService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  @App()
  app: IMidwayApplication;

  private get currentCtx() {
    if (this.ctx?.admin) {
      return this.ctx;
    }
    try {
      const contextManager: AsyncContextManager = this.app
        ?.getApplicationContext?.()
        ?.get?.(ASYNC_CONTEXT_MANAGER_KEY);
      const activeContext = contextManager
        ?.active?.()
        ?.getValue(ASYNC_CONTEXT_KEY) as Context;
      return activeContext || this.ctx;
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
    return verifyUserAdminToken(token, resolveBaseJwtConfig(this.app).secret);
  }

  private async listSystemSuperAdminUserIds() {
    const rows: Array<{ userId?: number | string }> = await this.nativeQuery(
      `SELECT DISTINCT a.userId as userId
       FROM base_sys_user_role a
       INNER JOIN base_sys_role b ON a.roleId = b.id
       WHERE b.isSuperAdmin = ?`,
      [1]
    );

    return rows
      .map(item => Number(item.userId))
      .filter(item => Number.isInteger(item) && item > 0);
  }

  private async isSystemSuperAdminUser(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      return false;
    }

    const rows = await this.nativeQuery(
      `SELECT a.userId as userId
       FROM base_sys_user_role a
       INNER JOIN base_sys_role b ON a.roleId = b.id
       WHERE a.userId = ? AND b.isSuperAdmin = ?
       LIMIT 1`,
      [userId, 1]
    );

    return !_.isEmpty(rows);
  }

  /**
   * 分页查询
   * @param query
   */
  async page(query) {
    const { keyWord, status, departmentIds = [] } = query;
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    if (!currentAdmin.userId) {
      throw new CoolCommException('登录状态已失效，请重新登录');
    }
    const userId = currentAdmin.userId;
    const roleIds = currentAdmin.roleIds;
    const isAdmin =
      typeof currentAdmin.isAdmin === 'boolean'
        ? currentAdmin.isAdmin
        : await this.baseSysPermsService.isAdmin(roleIds);
    const systemSuperAdminUserIds = await this.listSystemSuperAdminUserIds();
    const permsDepartmentArr = await this.baseSysPermsService.departmentIds(
      userId
    ); // 部门权限
    const sql = `
        SELECT
            a.id,a.name,a.nickName,a.headImg,a.email,a.remark,a.status,a.createTime,a.updateTime,a.username,a.phone,a.departmentId,
            b.name as "departmentName"
        FROM
            base_sys_user a
            LEFT JOIN base_sys_department b on a.departmentId = b.id
        WHERE 1 = 1
            ${this.setSql(
              !_.isEmpty(departmentIds),
              'and a.departmentId in (?)',
              [departmentIds]
            )}
            ${this.setSql(status, 'and a.status = ?', [status])}
            ${this.setSql(keyWord, 'and (a.name LIKE ? or a.username LIKE ?)', [
              `%${keyWord}%`,
              `%${keyWord}%`,
            ])}
            ${this.setSql(
              !_.isEmpty(systemSuperAdminUserIds),
              'and a.id not in (?)',
              [systemSuperAdminUserIds]
            )}
            ${this.setSql(
              !isAdmin,
              `and (a.departmentId in (?) or a.userId = ${userId})`,
              [!_.isEmpty(permsDepartmentArr) ? permsDepartmentArr : [null]]
            )} `;
    const result = await this.sqlRenderPage(sql, query);
    // 匹配角色
    if (!_.isEmpty(result.list)) {
      const userIds = result.list.map(e => e.id);
      const roles: Array<{ name: string; userId: number; roleId: number }> =
        await this.nativeQuery(
        'SELECT b.name, a.userId, a.roleId FROM base_sys_user_role a LEFT JOIN base_sys_role b ON a.roleId = b.id WHERE a.userId in (?) ',
        [userIds]
      );
      result.list.forEach(e => {
        const arr = roles.filter(a => a.userId == e.id);

        e['roleIds'] = arr.map(a => Number(a.roleId));
        e['roleName'] = arr.map(a => a.name).join(',');
      });
    }
    return result;
  }

  /**
   * 移动部门
   * @param departmentId
   * @param userIds
   */
  async move(departmentId, userIds) {
    await this.baseSysUserEntity.update({ id: In(userIds) }, { departmentId });
  }

  /**
   * 获得个人信息
   */
  async person(userId) {
    const info = await this.baseSysUserEntity.findOneBy({
      id: Equal(userId),
    });
    delete info?.password;
    return info;
  }

  /**
   * 登录态用户下拉选项。
   * 这里只返回绩效等业务页需要的最小字段，不暴露系统用户管理页的完整数据面。
   */
  async optionList(query: { keyWord?: string; size?: number } = {}) {
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    if (!currentAdmin.userId) {
      throw new CoolCommException('登录状态已失效，请重新登录');
    }

    const userId = currentAdmin.userId;
    const roleIds = currentAdmin.roleIds;
    const isAdmin =
      typeof currentAdmin.isAdmin === 'boolean'
        ? currentAdmin.isAdmin
        : await this.baseSysPermsService.isAdmin(roleIds);
    const systemSuperAdminUserIds = await this.listSystemSuperAdminUserIds();
    const permsDepartmentArr = await this.baseSysPermsService.departmentIds(userId);
    const size = Math.min(Math.max(Number(query.size) || 200, 1), 500);
    const keyWord = String(query.keyWord || '').trim();

    const qb = this.baseSysUserEntity
      .createQueryBuilder('user')
      .leftJoin(
        BaseSysDepartmentEntity,
        'department',
        'department.id = user.departmentId'
      )
      .select([
        'user.id as id',
        'user.name as name',
        'user.nickName as nickName',
        'user.departmentId as departmentId',
        'department.name as departmentName',
      ])
      .where('user.status = :status', { status: 1 })
      .andWhere(
        !_.isEmpty(systemSuperAdminUserIds)
          ? 'user.id not in (:...systemSuperAdminUserIds)'
          : '1 = 1',
        !_.isEmpty(systemSuperAdminUserIds)
          ? { systemSuperAdminUserIds }
          : {}
      );

    if (keyWord) {
      qb.andWhere('(user.name like :keyword or user.username like :keyword)', {
        keyword: `%${keyWord}%`,
      });
    }

    if (!isAdmin) {
      qb.andWhere(
        '(user.departmentId in (:...departmentIds) or user.id = :userId)',
        {
          departmentIds: !_.isEmpty(permsDepartmentArr) ? permsDepartmentArr : [null],
          userId,
        }
      );
    }

    qb.orderBy('user.name', 'ASC').addOrderBy('user.id', 'ASC').limit(size);

    const list = await qb.getRawMany();

    return list.map(item => ({
      id: Number(item.id),
      name: String(item.name || item.nickName || ''),
      departmentId: item.departmentId == null ? null : Number(item.departmentId),
      departmentName: item.departmentName ? String(item.departmentName) : null,
    }));
  }

  /**
   * 更新用户角色关系
   * @param user
   */
  async updateUserRole(user) {
    if (_.isEmpty(user.roleIdList)) {
      return;
    }
    if (await this.isSystemSuperAdminUser(Number(user.id))) {
      throw new CoolCommException('非法操作~');
    }
    await this.baseSysUserRoleEntity.delete({ userId: user.id });
    if (user.roleIdList) {
      for (const roleId of user.roleIdList) {
        await this.baseSysUserRoleEntity.save({ userId: user.id, roleId });
      }
    }
    await this.baseSysPermsService.refreshPerms(user.id);
  }

  /**
   * 新增
   * @param param
   */
  async add(param) {
    const exists = await this.baseSysUserEntity.findOneBy({
      username: param.username,
    });
    if (!_.isEmpty(exists)) {
      throw new CoolCommException('用户名已经存在~');
    }
    param.password = md5(param.password);
    await super.add(param);
    await this.updateUserRole(param);
    return param.id;
  }

  /**
   * 根据ID获得信息
   * @param id
   */
  public async info(id) {
    const info = await this.baseSysUserEntity.findOneBy({ id });
    const userRoles = await this.nativeQuery(
      'select a.roleId from base_sys_user_role a where a.userId = ?',
      [id]
    );
    const department = await this.baseSysDepartmentEntity.findOneBy({
      id: info.departmentId,
    });
    if (info) {
      delete info.password;
      if (userRoles) {
        info.roleIdList = userRoles.map(e => {
          return parseInt(e.roleId);
        });
      }
    }
    delete info.password;
    if (department) {
      info.departmentName = department.name;
    }
    return info;
  }

  /**
   * 修改个人信息
   * @param param
   */
  public async personUpdate(param) {
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    if (!currentAdmin.userId) {
      throw new CoolCommException('登录状态已失效，请重新登录');
    }
    param.id = currentAdmin.userId;
    delete param.activePerformancePersonaKey;
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const oldPassword = md5(param.oldPassword);
      const userInfo = await this.baseSysUserEntity.findOneBy({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('用户不存在');
      }
      if (oldPassword !== userInfo.password) {
        throw new CoolCommException('原密码错误');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.midwayCache.set(
        buildUserAuthCacheKey('passwordVersion', param.id),
        param.passwordV
      );
    } else {
      delete param.password;
    }
    await this.baseSysUserEntity.save(param);
  }

  /**
   * 修改
   * @param param 数据
   */
  async update(param) {
    if (await this.isSystemSuperAdminUser(Number(param.id))) {
      throw new CoolCommException('非法操作~');
    }
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const userInfo = await this.baseSysUserEntity.findOneBy({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('用户不存在');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.midwayCache.set(
        buildUserAuthCacheKey('passwordVersion', param.id),
        param.passwordV
      );
    } else {
      delete param.password;
    }
    if (param.status === 0) {
      await this.forbidden(param.id);
    }
    await this.baseSysUserEntity.save(param);
    await this.updateUserRole(param);
  }

  /**
   * 禁用用户
   * @param userId
   */
  async forbidden(userId) {
    await this.midwayCache.del(buildUserAuthCacheKey('accessToken', userId));
  }
}
