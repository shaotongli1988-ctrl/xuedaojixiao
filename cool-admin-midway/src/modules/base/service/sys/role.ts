import { Inject, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseSysRoleEntity } from '../../entity/sys/role';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';
import * as _ from 'lodash';
import { BaseSysRoleMenuEntity } from '../../entity/sys/role_menu';
import { BaseSysRoleDepartmentEntity } from '../../entity/sys/role_department';
import { BaseSysPermsService } from './perms';
import { Brackets } from 'typeorm';
import { CoolCommException } from '@cool-midway/core';
import { resolveUserAdminRuntimeContext } from '../../../user/domain';

/**
 * 角色
 */
@Provide()
export class BaseSysRoleService extends BaseService {
  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysRoleMenuEntity)
  baseSysRoleMenuEntity: Repository<BaseSysRoleMenuEntity>;

  @InjectEntityModel(BaseSysRoleDepartmentEntity)
  baseSysRoleDepartmentEntity: Repository<BaseSysRoleDepartmentEntity>;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  /**
   * 根据用户ID获得所有用户角色
   * @param userId
   */
  async getByUser(userId: number): Promise<number[]> {
    const userRole = await this.baseSysUserRoleEntity.findBy({ userId });
    if (!_.isEmpty(userRole)) {
      return userRole.map(e => {
        return e.roleId;
      });
    }
    return [];
  }

  /**
   *
   * @param param
   */
  async modifyAfter(param) {
    if (param.id) {
      this.updatePerms(param.id, param.menuIdList, param.departmentIdList);
    }
  }

  private sanitizeSuperAdminFlag(param: any) {
    if (param && Object.prototype.hasOwnProperty.call(param, 'isSuperAdmin')) {
      delete param.isSuperAdmin;
    }
    return param;
  }

  private normalizeRoleIds(ids: any) {
    const values = Array.isArray(ids) ? ids : String(ids || '').split(',');
    return values
      .map(item => Number(item))
      .filter(item => Number.isInteger(item) && item > 0);
  }

  private async assertNotSuperAdminRoles(ids: any) {
    const roleIds = this.normalizeRoleIds(ids);
    if (!roleIds.length) {
      return;
    }
    const roles = await this.baseSysRoleEntity.findBy({ id: In(roleIds) } as any);
    if (roles.some(role => role.isSuperAdmin === true)) {
      throw new CoolCommException('系统超管角色仅允许通过系统基座维护');
    }
  }

  async add(param) {
    await super.add(this.sanitizeSuperAdminFlag(param));
    return param.id;
  }

  async update(param) {
    await this.assertNotSuperAdminRoles(param?.id);
    await super.update(this.sanitizeSuperAdminFlag(param));
    return param.id;
  }

  async delete(ids) {
    await this.assertNotSuperAdminRoles(ids);
    return super.delete(ids);
  }

  /**
   * 更新权限
   * @param roleId
   * @param menuIdList
   * @param departmentIds
   */
  async updatePerms(roleId, menuIdList?, departmentIds = []) {
    // 更新菜单权限
    await this.baseSysRoleMenuEntity.delete({ roleId });
    await Promise.all(
      menuIdList.map(async e => {
        return await this.baseSysRoleMenuEntity.save({ roleId, menuId: e });
      })
    );
    // 更新部门权限
    await this.baseSysRoleDepartmentEntity.delete({ roleId });
    await Promise.all(
      departmentIds.map(async e => {
        return await this.baseSysRoleDepartmentEntity.save({
          roleId,
          departmentId: e,
        });
      })
    );
    // 刷新权限
    const userRoles = await this.baseSysUserRoleEntity.findBy({ roleId });
    for (const userRole of userRoles) {
      await this.baseSysPermsService.refreshPerms(userRole.userId);
    }
  }

  /**
   * 角色信息
   * @param id
   */
  async info(id) {
    const info = await this.baseSysRoleEntity.findOneBy({ id });
    if (info) {
      const isAdminRole = info.isSuperAdmin === true;
      const menus = await this.baseSysRoleMenuEntity.findBy(
        isAdminRole ? {} : { roleId: id }
      );
      const menuIdList = menus.map(e => {
        return parseInt(e.menuId + '');
      });
      const departments = await this.baseSysRoleDepartmentEntity.findBy(
        isAdminRole ? {} : { roleId: id }
      );
      const departmentIdList = departments.map(e => {
        return parseInt(e.departmentId + '');
      });
      return {
        ...info,
        menuIdList,
        departmentIdList,
      };
    }
    return {};
  }

  async list() {
    const currentAdmin = resolveUserAdminRuntimeContext(this.ctx.admin);
    const isAdmin = await this.baseSysPermsService.isAdmin(currentAdmin.roleIds);
    return this.baseSysRoleEntity
      .createQueryBuilder('a')
      .where(
        new Brackets(qb => {
          qb.where('COALESCE(a.isSuperAdmin, 0) != 1'); // 超级管理员的角色不展示
          // 如果不是超管，只能看到自己新建的或者自己有的角色
          if (!isAdmin) {
            qb.andWhere('(a.userId=:userId or a.id in (:...roleId))', {
              userId: currentAdmin.userId,
              roleId: currentAdmin.roleIds,
            });
          }
        })
      )
      .getMany();
  }
}
