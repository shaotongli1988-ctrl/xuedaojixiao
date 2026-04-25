/**
 * Theme-18 hiring smoke verification.
 * This file validates hiring menu/permission visibility and the minimum live API chain for HR, manager, and employee.
 * It does not seed data, modify runtime config, or verify non-frozen actions outside page/info/add/updateStatus/close.
 * Maintenance pitfall: expected permission keys, sample candidate names, and denied messages must stay aligned with menu.json, seed-stage2-performance.mjs, and hiring service contracts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  resolveExpectedPort,
  resolveProjectGitHash,
  resolveProjectSourceHash,
  validateStage2RuntimeMeta,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const successCode = 1000;
const theme18RequiredScopes = ['theme18-hiring'];
const hiringMenuRoute = '/performance/hiring';
const hiringPerms = [
  'performance:hiring:page',
  'performance:hiring:info',
  'performance:hiring:add',
  'performance:hiring:updateStatus',
  'performance:hiring:close',
];

const expectedUsers = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: [hiringMenuRoute],
      routesAbsent: [],
      permsPresent: [...hiringPerms, 'performance:hiring:all'],
      permsAbsent: [],
    },
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: [hiringMenuRoute],
      routesAbsent: [],
      permsPresent: hiringPerms,
      permsAbsent: ['performance:hiring:all'],
    },
  },
  {
    username: 'employee_platform',
    menu: {
      routesPresent: [],
      routesAbsent: [hiringMenuRoute],
      permsPresent: [],
      permsAbsent: [...hiringPerms, 'performance:hiring:all'],
    },
  },
];

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function formatResponse(body) {
  if (!body) {
    return 'empty response';
  }
  if (typeof body === 'string') {
    return body;
  }
  const code = body.code ?? 'unknown';
  const message = body.message ?? JSON.stringify(body);
  return `code=${code} message=${message}`;
}

function listItems(responseBody) {
  return Array.isArray(responseBody?.data?.list) ? responseBody.data.list : [];
}

function flattenMenuRouters(menus = [], output = new Set()) {
  for (const menu of menus) {
    if (menu?.router) {
      output.add(menu.router);
    }
    flattenMenuRouters(menu?.childMenus || [], output);
  }
  return output;
}

function validateDeniedResponse(response, deniedMessageIncludes = []) {
  if (response.body?.code === successCode) {
    return 'expected denied response but request succeeded';
  }

  if (!Array.isArray(deniedMessageIncludes) || deniedMessageIncludes.length === 0) {
    return null;
  }

  const message = String(response.body?.message || '');
  const matched =
    deniedMessageIncludes.every(fragment => message.includes(fragment)) ||
    message.includes('登录失效或无权限访问~');
  if (!matched) {
    return `expected message to include "${deniedMessageIncludes.join(' + ')}", got "${message}"`;
  }

  return null;
}

function resolveDefaultCacheDir() {
  for (const candidate of [
    path.join(projectRoot, 'dist/config/config.default.js'),
    path.join(projectRoot, 'src/config/config.default.ts'),
  ]) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    const content = fs.readFileSync(candidate, 'utf8');
    const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
    if (matched?.[1]) {
      return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
    }
  }

  throw new Error(
    'Unable to resolve cache directory from dist/config/config.default.js or src/config/config.default.ts'
  );
}

class Reporter {
  constructor() {
    this.records = [];
  }

  pass(scope, detail) {
    this.records.push({ status: 'PASS', scope, detail });
    console.log(`[PASS] ${scope} - ${detail}`);
  }

  fail(scope, detail) {
    this.records.push({ status: 'FAIL', scope, detail });
    console.log(`[FAIL] ${scope} - ${detail}`);
  }

  skip(scope, detail) {
    this.records.push({ status: 'SKIP', scope, detail });
    console.log(`[SKIP] ${scope} - ${detail}`);
  }

  summary() {
    const stats = { PASS: 0, FAIL: 0, SKIP: 0 };
    for (const record of this.records) {
      stats[record.status] += 1;
    }
    return stats;
  }

  hasFailures() {
    return this.records.some(record => record.status === 'FAIL');
  }
}

function printSummary(reporter) {
  const stats = reporter.summary();
  console.log('');
  console.log('Summary');
  console.log(`PASS: ${stats.PASS}`);
  console.log(`FAIL: ${stats.FAIL}`);
  console.log(`SKIP: ${stats.SKIP}`);
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.THEME18_SMOKE_BASE_URL || '',
    password: process.env.THEME18_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.THEME18_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if ((current === '--base-url' || current === '-u') && next) {
      options.baseUrl = next;
      index += 1;
      continue;
    }

    if ((current === '--password' || current === '-p') && next) {
      options.password = next;
      index += 1;
      continue;
    }

    if ((current === '--cache-dir' || current === '-c') && next) {
      options.cacheDir = next;
      index += 1;
      continue;
    }

    if (current === '--help' || current === '-h') {
      console.log(`Usage: node ${path.relative(process.cwd(), fileURLToPath(import.meta.url))} [options]

Options:
  --base-url, -u   Override backend base URL
  --password, -p   Override login password (default: ${defaultPassword})
  --cache-dir, -c  Override Cool cache directory
  --help, -h       Show this help message

Environment variables:
  THEME18_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME18_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

async function requestJson(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const raw = await response.text();
    let body;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    return {
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyRuntimePreflight(reporter, options) {
  const response = await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`);

  if (response.body?.code !== successCode) {
    reporter.fail('runtimeMeta', formatResponse(response.body));
    return false;
  }

  const runtimeMeta = response.body?.data;
  const problems = validateStage2RuntimeMeta(runtimeMeta, {
    expectedGitHash: resolveProjectGitHash(projectRoot),
    expectedSourceHash: resolveProjectSourceHash(projectRoot),
    expectedPort: resolveExpectedPort(options.baseUrl),
    requiredScopes: theme18RequiredScopes,
  });

  if (problems.length) {
    reporter.fail('runtimeMeta', problems.join('; '));
    return false;
  }

  reporter.pass(
    'runtimeMeta',
    `git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version}`
  );
  return true;
}

async function readCaptchaValue(cacheDir, captchaId) {
  const key = `verify:img:${captchaId}`;
  const file = path.join(cacheDir, `diskstore-${md5(key)}.json`);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (parsed?.key === key && parsed?.val) {
        return parsed.val;
      }
    }
    await sleep(100);
  }
  throw new Error(`Captcha cache file not found for ${captchaId}`);
}

async function fetchCaptchaAndLogin(reporter, options, username) {
  const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
  const captchaId = captchaResponse.body?.data?.captchaId;
  if (captchaResponse.body?.code !== successCode || !captchaId) {
    reporter.fail(`${username} captcha`, formatResponse(captchaResponse.body));
    return null;
  }
  reporter.pass(`${username} captcha`, `captchaId=${captchaId}`);

  try {
    const verifyCode = await readCaptchaValue(options.cacheDir, captchaId);
    const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password: options.password,
        captchaId,
        verifyCode,
      }),
    });

    if (loginResponse.body?.code !== successCode) {
      reporter.fail(`${username} login`, formatResponse(loginResponse.body));
      return null;
    }

    const token = loginResponse.body?.data?.token;
    if (!token) {
      reporter.fail(`${username} login`, 'login succeeded without token');
      return null;
    }

    reporter.pass(`${username} login`, 'token acquired');
    return { token };
  } catch (error) {
    reporter.fail(`${username} login`, error.message);
    return null;
  }
}

async function verifyPermMenu(reporter, options, user, token) {
  const scope = `${user.username} permmenu`;
  const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
    headers: { Authorization: token },
  });

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return false;
  }

  const routers = flattenMenuRouters(response.body?.data?.menus || []);
  const perms = new Set(response.body?.data?.perms || []);
  const problems = [];

  for (const route of user.menu.routesPresent) {
    if (!routers.has(route)) {
      problems.push(`missing route ${route}`);
    }
  }

  for (const route of user.menu.routesAbsent) {
    if (routers.has(route)) {
      problems.push(`unexpected route ${route}`);
    }
  }

  for (const perm of user.menu.permsPresent) {
    if (!perms.has(perm)) {
      problems.push(`missing perm ${perm}`);
    }
  }

  for (const perm of user.menu.permsAbsent) {
    if (perms.has(perm)) {
      problems.push(`unexpected perm ${perm}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return false;
  }

  reporter.pass(scope, `routes=${routers.size} perms=${perms.size}`);
  return true;
}

async function hiringPage(reporter, options, token, payload, scope, deniedMessageIncludes = []) {
  const response = await requestJson(`${options.baseUrl}/admin/performance/hiring/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (deniedMessageIncludes.length) {
    const deniedProblem = validateDeniedResponse(response, deniedMessageIncludes);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const list = listItems(response.body);
  reporter.pass(scope, `list=${list.length}`);
  return list;
}

async function hiringInfo(
  reporter,
  options,
  token,
  id,
  scope,
  deniedMessageIncludes = []
) {
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/hiring/info?id=${Number(id)}`,
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (deniedMessageIncludes.length) {
    const deniedProblem = validateDeniedResponse(response, deniedMessageIncludes);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  reporter.pass(scope, `status=${response.body?.data?.status || 'unknown'}`);
  return response.body?.data || null;
}

async function hiringAdd(
  reporter,
  options,
  token,
  payload,
  scope,
  deniedMessageIncludes = []
) {
  const response = await requestJson(`${options.baseUrl}/admin/performance/hiring/add`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (deniedMessageIncludes.length) {
    const deniedProblem = validateDeniedResponse(response, deniedMessageIncludes);
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const data = response.body?.data || {};
  reporter.pass(scope, `id=${data.id} status=${data.status}`);
  return data;
}

async function hiringUpdateStatus(reporter, options, token, payload, scope) {
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/hiring/updateStatus`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const data = response.body?.data || {};
  reporter.pass(scope, `id=${data.id} status=${data.status}`);
  return data;
}

async function hiringClose(reporter, options, token, payload, scope) {
  const response = await requestJson(`${options.baseUrl}/admin/performance/hiring/close`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const data = response.body?.data || {};
  reporter.pass(scope, `id=${data.id} status=${data.status}`);
  return data;
}

async function verifyHrChain(reporter, options, token, context) {
  const pageList = await hiringPage(
    reporter,
    options,
    token,
    {
      page: 1,
      size: 20,
      keyword: '联调-主题18',
    },
    'hr_admin hiring:page'
  );

  if (!Array.isArray(pageList) || !pageList.length) {
    reporter.fail('hr_admin hiring-seed', 'missing seeded hiring list');
    return;
  }

  const platformSeed = pageList.find(item =>
    String(item?.candidateName || '').includes('联调-主题18平台录用')
  );
  const salesSeed = pageList.find(item =>
    String(item?.candidateName || '').includes('联调-主题18销售录用')
  );

  if (!platformSeed || !salesSeed) {
    reporter.fail('hr_admin hiring-seed', 'missing theme18 platform/sales seed records');
    return;
  }

  context.platformDepartmentId = Number(platformSeed.targetDepartmentId);
  context.salesDepartmentId = Number(salesSeed.targetDepartmentId);
  context.platformSeedId = Number(platformSeed.id);
  context.salesSeedId = Number(salesSeed.id);
  reporter.pass(
    'hr_admin hiring-seed',
    `platform=${context.platformSeedId} sales=${context.salesSeedId}`
  );

  await hiringInfo(
    reporter,
    options,
    token,
    context.platformSeedId,
    'hr_admin hiring:info'
  );

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const hrAccepted = await hiringAdd(
    reporter,
    options,
    token,
    {
      candidateName: `smoke-theme18-hr-accepted-${suffix}`,
      targetDepartmentId: context.platformDepartmentId,
      targetPosition: '平台联调工程师',
      hiringDecision: 'HR 主链接受录用 smoke',
      sourceType: 'manual',
    },
    'hr_admin hiring:add->accepted'
  );

  if (hrAccepted?.id) {
    const updated = await hiringUpdateStatus(
      reporter,
      options,
      token,
      {
        id: Number(hrAccepted.id),
        status: 'accepted',
      },
      'hr_admin hiring:updateStatus'
    );
    if (updated && updated.status !== 'accepted') {
      reporter.fail('hr_admin hiring:updateStatus', `expected accepted got ${updated.status}`);
    }
  }

  const hrClosed = await hiringAdd(
    reporter,
    options,
    token,
    {
      candidateName: `smoke-theme18-hr-closed-${suffix}`,
      targetDepartmentId: context.platformDepartmentId,
      targetPosition: '平台联调工程师',
      hiringDecision: 'HR 主链关闭录用 smoke',
      sourceType: 'manual',
    },
    'hr_admin hiring:add->close'
  );

  if (hrClosed?.id) {
    const closed = await hiringClose(
      reporter,
      options,
      token,
      {
        id: Number(hrClosed.id),
        closeReason: 'smoke-HR-close',
      },
      'hr_admin hiring:close'
    );
    if (closed && closed.status !== 'closed') {
      reporter.fail('hr_admin hiring:close', `expected closed got ${closed.status}`);
    }
  }
}

async function verifyManagerChain(reporter, options, token, context) {
  if (!context.platformDepartmentId || !context.salesDepartmentId || !context.salesSeedId) {
    reporter.skip('manager_rd hiring-chain', 'skipped because HR seed context missing');
    return;
  }

  const managerPage = await hiringPage(
    reporter,
    options,
    token,
    {
      page: 1,
      size: 20,
      keyword: '联调-主题18',
    },
    'manager_rd hiring:page'
  );

  if (Array.isArray(managerPage)) {
    const hasSales = managerPage.some(item =>
      String(item?.candidateName || '').includes('联调-主题18销售录用')
    );
    if (hasSales) {
      reporter.fail('manager_rd hiring:page-scope', 'sales scoped record should not be visible');
    } else {
      reporter.pass('manager_rd hiring:page-scope', `visible=${managerPage.length}`);
    }
  }

  const managerInfo = await hiringInfo(
    reporter,
    options,
    token,
    context.salesSeedId,
    'manager_rd hiring:info-out-of-scope',
    ['无权访问该录用单']
  );
  if (managerInfo) {
    reporter.fail('manager_rd hiring:info-out-of-scope', 'expected deny but got success');
  }

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const managerAccepted = await hiringAdd(
    reporter,
    options,
    token,
    {
      candidateName: `smoke-theme18-manager-accepted-${suffix}`,
      targetDepartmentId: context.platformDepartmentId,
      targetPosition: '平台联调工程师',
      hiringDecision: '经理范围内录用 smoke',
      sourceType: 'manual',
    },
    'manager_rd hiring:add->accepted'
  );

  if (managerAccepted?.id) {
    const updated = await hiringUpdateStatus(
      reporter,
      options,
      token,
      {
        id: Number(managerAccepted.id),
        status: 'accepted',
      },
      'manager_rd hiring:updateStatus'
    );
    if (updated && updated.status !== 'accepted') {
      reporter.fail('manager_rd hiring:updateStatus', `expected accepted got ${updated.status}`);
    }
  }

  const managerClosed = await hiringAdd(
    reporter,
    options,
    token,
    {
      candidateName: `smoke-theme18-manager-closed-${suffix}`,
      targetDepartmentId: context.platformDepartmentId,
      targetPosition: '平台联调工程师',
      hiringDecision: '经理范围内关闭录用 smoke',
      sourceType: 'manual',
    },
    'manager_rd hiring:add->close'
  );

  if (managerClosed?.id) {
    const closed = await hiringClose(
      reporter,
      options,
      token,
      {
        id: Number(managerClosed.id),
        closeReason: 'smoke-manager-close',
      },
      'manager_rd hiring:close'
    );
    if (closed && closed.status !== 'closed') {
      reporter.fail('manager_rd hiring:close', `expected closed got ${closed.status}`);
    }
  }

  await hiringAdd(
    reporter,
    options,
    token,
    {
      candidateName: `smoke-theme18-manager-out-scope-${suffix}`,
      targetDepartmentId: context.salesDepartmentId,
      targetPosition: '销售顾问',
      hiringDecision: '经理范围外新增应拒绝',
      sourceType: 'manual',
    },
    'manager_rd hiring:add-out-of-scope',
    ['无权操作该录用单']
  );
}

async function verifyEmployeeDenied(reporter, options, token) {
  await hiringPage(
    reporter,
    options,
    token,
    {
      page: 1,
      size: 20,
      keyword: '联调-主题18',
    },
    'employee_platform hiring:page',
    ['无权限查看录用列表']
  );
}

async function run() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));
  const context = {
    platformDepartmentId: null,
    salesDepartmentId: null,
    platformSeedId: null,
    salesSeedId: null,
  };

  console.log('Theme-18 hiring smoke check');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Cache Dir: ${options.cacheDir}`);

  const runtimeReady = await verifyRuntimePreflight(reporter, options);
  if (!runtimeReady) {
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(options.cacheDir)) {
    reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
  }

  for (const user of expectedUsers) {
    const session = await fetchCaptchaAndLogin(reporter, options, user.username);
    if (!session?.token) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} hiring-flow`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, session.token);

    if (user.username === 'hr_admin') {
      await verifyHrChain(reporter, options, session.token, context);
      continue;
    }

    if (user.username === 'manager_rd') {
      await verifyManagerChain(reporter, options, session.token, context);
      continue;
    }

    if (user.username === 'employee_platform') {
      await verifyEmployeeDenied(reporter, options, session.token);
    }
  }

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
