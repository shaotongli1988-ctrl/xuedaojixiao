/**
 * Main Midway application entry that wires framework components and runtime config imports.
 * This file also normalizes cool-admin runtime path detection so module discovery always resolves against the current repo.
 * Maintenance pitfall: shared-deps installs can shift stack traces into dependency folders, so keep the repo dist/src fallback intact.
 */
import * as orm from '@midwayjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import {
  Configuration,
  App,
  IMidwayApplication,
  Inject,
  ILogger,
  MidwayWebRouterService,
} from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
// import * as crossDomain from '@midwayjs/cross-domain';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as staticFile from '@midwayjs/static-file';
import * as cron from '@midwayjs/cron';
import * as DefaultConfig from './config/config.default';
import * as LocalConfig from './config/config.local';
import * as ProdConfig from './config/config.prod';
import * as cool from '@cool-midway/core';
import * as upload from '@midwayjs/upload';
// import * as task from '@cool-midway/task';
// import * as rpc from '@cool-midway/rpc';

const originalGetRunPath = cool.LocationUtil.prototype.getRunPath;

function resolveRepoRuntimePath() {
  const candidates = [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'src'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'modules'))) {
      return candidate;
    }
  }

  return path.join(process.cwd(), 'dist');
}

// Shared-deps installs can confuse cool's stack-based runtime path detection.
// Fall back to the current repo's dist/src folder when the resolved path has no modules.
cool.LocationUtil.prototype.getRunPath = function getRunPathWithRepoFallback() {
  try {
    const resolved = originalGetRunPath.call(this);
    if (resolved && fs.existsSync(path.join(resolved, 'modules'))) {
      return resolved;
    }
  } catch (error) {}

  return resolveRepoRuntimePath();
};

@Configuration({
  imports: [
    // https://koajs.com/
    koa,
    // 是否开启跨域(注：顺序不能乱放！！！) http://www.midwayjs.org/docs/extensions/cross_domain
    // crossDomain,
    // 静态文件托管 https://midwayjs.org/docs/extensions/static_file
    staticFile,
    // orm https://midwayjs.org/docs/extensions/orm
    orm,
    // 参数验证 https://midwayjs.org/docs/extensions/validate
    validate,
    // 本地任务 http://www.midwayjs.org/docs/extensions/cron
    cron,
    // 文件上传
    upload,
    // cool-admin 官方组件 https://cool-js.com
    cool,
    // rpc 微服务 远程调用
    // rpc,
    // 任务与队列
    // task,
    {
      component: info,
      enabledEnvironment: ['local', 'prod'],
    },
  ],
  importConfigs: [
    {
      default: DefaultConfig,
      local: LocalConfig,
      prod: ProdConfig,
    },
  ],
})
export class MainConfiguration {
  @App()
  app: IMidwayApplication;

  @Inject()
  webRouterService: MidwayWebRouterService;

  @Inject()
  logger: ILogger;

  async onReady() {}
}
