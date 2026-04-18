import { execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Provide, Body, Inject, Post, Get, Query, App, IMidwayApplication } from '@midwayjs/core';
import {
  CoolController,
  BaseController,
  CoolEps,
  CoolUrlTag,
  CoolTag,
  TagTypes,
  RESCODE,
} from '@cool-midway/core';
import { LoginDTO } from '../../dto/login';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysParamService } from '../../service/sys/param';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';

const runtimeMetaParamKey = 'stage2.performance.seedMeta';
const runtimeStartedAt = new Date().toISOString();

function resolveRuntimeGitHash() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function loadRuntimeFingerprintPaths() {
  const configPath = path.join(
    process.cwd(),
    'scripts',
    'stage2-runtime-fingerprint.json'
  );
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return Array.isArray(parsed.paths) ? parsed.paths : [];
}

function collectRuntimeFingerprintFiles(relativePath: string, output: string[]) {
  const absolutePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath).sort()) {
      collectRuntimeFingerprintFiles(path.join(relativePath, entry), output);
    }
    return;
  }

  if (stat.isFile()) {
    output.push(relativePath.replace(/\\/g, '/'));
  }
}

function resolveRuntimeSourceHash() {
  const hash = crypto.createHash('sha1');
  const files: string[] = [];

  for (const relativePath of loadRuntimeFingerprintPaths()) {
    collectRuntimeFingerprintFiles(relativePath, files);
  }

  for (const relativePath of files.sort()) {
    hash.update(relativePath);
    hash.update('\n');
    hash.update(fs.readFileSync(path.join(process.cwd(), relativePath)));
    hash.update('\n');
  }

  return hash.digest('hex');
}

const runtimeGitHash = resolveRuntimeGitHash();
const runtimeSourceHash = resolveRuntimeSourceHash();

/**
 * 不需要登录的后台接口
 */
@Provide()
@CoolController({ description: '开放接口' })
@CoolUrlTag()
export class BaseOpenController extends BaseController {
  @App()
  app: IMidwayApplication;

  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @Inject()
  baseSysParamService: BaseSysParamService;

  @Inject()
  ctx: Context;

  @Inject()
  eps: CoolEps;

  /**
   * 实体信息与路径
   * @returns
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/eps', { summary: '实体信息与路径' })
  public async getEps() {
    return this.ok(this.eps.admin);
  }

  /**
   * 根据配置参数key获得网页内容(富文本)
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/html', { summary: '获得网页内容的参数值' })
  async htmlByKey(@Query('key') key: string) {
    this.ctx.body = await this.baseSysParamService.htmlByKey(key);
  }

  /**
   * 登录
   * @param login
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/login', { summary: '登录' })
  @Validate()
  async login(@Body() login: LoginDTO) {
    return this.ok(await this.baseSysLoginService.login(login));
  }

  /**
   * 获得验证码
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/captcha', { summary: '验证码' })
  async captcha(
    @Query('width') width: number,
    @Query('height') height: number,
    @Query('color') color: string
  ) {
    return this.ok(
      await this.baseSysLoginService.captcha(width, height, color)
    );
  }

  /**
   * 刷新token
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/refreshToken', { summary: '刷新token' })
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    try {
      const token = await this.baseSysLoginService.refreshToken(refreshToken);
      return this.ok(token);
    } catch (e) {
      this.ctx.status = 401;
      this.ctx.body = {
        code: RESCODE.COMMFAIL,
        message: '登录失效~',
      };
    }
  }

  /**
   * 获得当前运行态元信息
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/runtimeMeta', { summary: '运行态元信息' })
  async runtimeMeta() {
    const port =
      Number(this.app.getConfig('koa.port')) ||
      Number(process.env.COOL_ADMIN_PORT || process.env.PORT || 0) ||
      null;
    const seedMeta =
      (await this.baseSysParamService.dataByKeyFresh(runtimeMetaParamKey)) ||
      null;

    return this.ok({
      runtimeId: `${runtimeGitHash}:${port || 'unknown'}:${runtimeStartedAt}`,
      gitHash: runtimeGitHash,
      sourceHash: runtimeSourceHash,
      startedAt: runtimeStartedAt,
      env: this.app.getEnv(),
      port,
      seedMeta,
    });
  }
}
