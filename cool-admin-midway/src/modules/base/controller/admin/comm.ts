import {
  BaseController,
  CoolController,
  CoolTag,
  CoolUrlTag,
  TagTypes,
} from '@cool-midway/core';
import {
  ALL,
  App,
  ASYNC_CONTEXT_KEY,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  Body,
  Get,
  IMidwayApplication,
  Inject,
  Post,
  Provide,
  Query,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PluginService } from '../../../plugin/service/info';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysDepartmentService } from '../../service/sys/department';
import { BaseSysPermsService } from '../../service/sys/perms';
import { BaseSysUserService } from '../../service/sys/user';
import { PerformanceTeacherChannelCoreService } from '../../../performance/service/teacher-channel-core';
import { PerformanceAccessContextService } from '../../../performance/service/access-context';
import { resolveUserAdminRuntimeContext, verifyUserAdminToken } from '../../../user/domain';

const resolveBaseJwtConfig = (app?: IMidwayApplication) => {
  return require('../../config').default({
    app,
    env: app?.getEnv?.(),
  }).jwt;
};

/**
 * Base 通用接口 一般写不需要权限过滤的接口
 */
@CoolUrlTag()
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
@CoolController()
export class BaseCommController extends BaseController {
  @Inject()
  baseSysUserService: BaseSysUserService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @Inject()
  baseSysDepartmentService: BaseSysDepartmentService;

  @Inject()
  performanceTeacherChannelCoreService: PerformanceTeacherChannelCoreService;

  @Inject()
  performanceAccessContextService: PerformanceAccessContextService;

  @Inject()
  ctx: Context;

  @Inject()
  pluginService: PluginService;

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
    return verifyUserAdminToken(token, resolveBaseJwtConfig(this.app).secret);
  }

  /**
   * 获得个人信息
   */
  @Get('/person', { summary: '个人信息' })
  async person() {
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    const info = await this.baseSysUserService.person(currentAdmin.userId);
    const permissionMask = await this.baseSysPermsService.currentPermissionMask(
      currentAdmin.roleIds
    );
    const teacherAccessProfile =
      (await this.performanceTeacherChannelCoreService.teacherAccessProfile?.()) ||
      null;

    return this.ok({
      ...info,
      permissionMask,
      teacherAccessProfile,
      performanceAccessContext:
        await this.performanceAccessContextService.resolvePublicContext(),
    });
  }

  /**
   * 修改个人信息
   */
  @Post('/personUpdate', { summary: '修改个人信息' })
  async personUpdate(@Body(ALL) user: BaseSysUserEntity) {
    await this.baseSysUserService.personUpdate(user);
    return this.ok();
  }

  /**
   * 权限菜单
   */
  @Get('/permmenu', { summary: '权限与菜单' })
  async permmenu() {
    const currentAdmin = resolveUserAdminRuntimeContext(this.currentAdmin);
    const data = await this.baseSysPermsService.permmenu(currentAdmin.roleIds);
    return this.ok({
      ...data,
      performanceAccessContext:
        await this.performanceAccessContextService.resolvePublicContext(),
    });
  }

  @Get('/performanceAccessContext', { summary: '绩效角色访问上下文' })
  async performanceAccessContext(@Query('activePersonaKey') activePersonaKey?: string) {
    return this.ok(
      await this.performanceAccessContextService.resolvePublicContext(
        String(activePersonaKey || '').trim() || null
      )
    );
  }

  @Post('/performanceAccessContext/activePersona', {
    summary: '保存绩效当前视角',
  })
  async savePerformanceActivePersona(
    @Body('activePersonaKey') activePersonaKey?: string | null
  ) {
    return this.ok(
      await this.performanceAccessContextService.savePublicContextPreference(
        String(activePersonaKey || '').trim() || null
      )
    );
  }

  /**
   * 登录态用户选项。
   * 只返回业务下拉所需的最小字段，不等同于系统用户管理页能力。
   */
  @Get('/userOptions', { summary: '登录态用户选项' })
  async userOptions(
    @Query('keyWord') keyWord?: string,
    @Query('size') size?: number
  ) {
    return this.ok({
      list: await this.baseSysUserService.optionList({ keyWord, size }),
    });
  }

  /**
   * 登录态部门选项。
   * 只返回业务下拉所需字段，并沿用当前账号部门范围约束。
   */
  @Get('/departmentOptions', { summary: '登录态部门选项' })
  async departmentOptions() {
    const list = await this.baseSysDepartmentService.list();

    return this.ok(
      list.map(item => ({
        id: Number(item.id),
        parentId: item.parentId == null ? null : Number(item.parentId),
        name: String(item.name || ''),
      }))
    );
  }

  /**
   * 文件上传
   */
  @Post('/upload', { summary: '文件上传' })
  async upload() {
    const file = await this.pluginService.getInstance('upload');
    return this.ok(await file.upload(this.currentCtx));
  }

  /**
   * 文件上传模式，本地或者云存储
   */
  @Get('/uploadMode', { summary: '文件上传模式' })
  async uploadMode() {
    const file = await this.pluginService.getInstance('upload');
    return this.ok(await file.getMode());
  }

  /**
   * 退出
   */
  @Post('/logout', { summary: '退出' })
  async logout() {
    await this.baseSysLoginService.logout();
    return this.ok();
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/program', { summary: '编程' })
  async program() {
    return this.ok('Node');
  }
}
