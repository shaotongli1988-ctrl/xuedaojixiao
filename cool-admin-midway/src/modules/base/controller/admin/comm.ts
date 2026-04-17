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
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import * as jwt from 'jsonwebtoken';
import { PluginService } from '../../../plugin/service/info';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysPermsService } from '../../service/sys/perms';
import { BaseSysUserService } from '../../service/sys/user';

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
    try {
      return jwt.verify(token, resolveBaseJwtConfig(this.app).secret);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 获得个人信息
   */
  @Get('/person', { summary: '个人信息' })
  async person() {
    return this.ok(await this.baseSysUserService.person(this.currentAdmin?.userId));
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
    return this.ok(await this.baseSysPermsService.permmenu(this.currentAdmin?.roleIds));
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
