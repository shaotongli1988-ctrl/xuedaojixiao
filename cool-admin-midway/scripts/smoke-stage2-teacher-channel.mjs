/**
 * Theme-19 teacher-channel smoke verification.
 * This file validates menu visibility, permission keys, seeded scope data, and the minimum live API chain for teacher channel cooperation management.
 * It does not replace generic stage-2 smoke, modify runtime config, or cover non-frozen domains outside teacherInfo/teacherFollow/teacherCooperation/teacherClass/teacherDashboard/teacherTodo.
 * Maintenance pitfall: expected routes, permission keys, seed teacher names, and denied behaviors must stay aligned with menu.json, seed-stage2-performance.mjs, and theme19 frozen contracts.
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
const theme19RequiredScopes = ['theme19-teacher-channel'];
const teacherRoutes = [
  '/performance/teacher-channel/dashboard',
  '/performance/teacher-channel/teacher',
  '/performance/teacher-channel/todo',
  '/performance/teacher-channel/class',
];
const allWritePerms = [
  'performance:teacherInfo:add',
  'performance:teacherInfo:update',
  'performance:teacherInfo:assign',
  'performance:teacherInfo:updateStatus',
  'performance:teacherFollow:add',
  'performance:teacherCooperation:mark',
  'performance:teacherClass:add',
  'performance:teacherClass:update',
  'performance:teacherClass:delete',
];
const agentReadPerms = [
  'performance:teacherAgent:page',
  'performance:teacherAgent:info',
  'performance:teacherAgentRelation:page',
  'performance:teacherAttribution:page',
  'performance:teacherAttribution:info',
  'performance:teacherAgentAudit:page',
  'performance:teacherAgentAudit:info',
];
const agentWritePerms = [
  'performance:teacherAgent:add',
  'performance:teacherAgent:update',
  'performance:teacherAgent:updateStatus',
  'performance:teacherAgent:blacklist',
  'performance:teacherAgent:unblacklist',
  'performance:teacherAgentRelation:add',
  'performance:teacherAgentRelation:update',
  'performance:teacherAgentRelation:delete',
  'performance:teacherAttribution:assign',
  'performance:teacherAttribution:change',
  'performance:teacherAttribution:remove',
];
const conflictReadPerms = [
  'performance:teacherAttributionConflict:page',
  'performance:teacherAttributionConflict:info',
];
const conflictWritePerms = [
  'performance:teacherAttributionConflict:create',
  'performance:teacherAttributionConflict:resolve',
];

const expectedUsers = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: teacherRoutes,
      routesAbsent: [],
      permsPresent: [
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        ...allWritePerms,
        ...agentReadPerms,
        ...agentWritePerms,
        ...conflictReadPerms,
        ...conflictWritePerms,
        'performance:teacherFollow:page',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherTodo:page',
      ],
      permsAbsent: [],
    },
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: teacherRoutes,
      routesAbsent: [],
      permsPresent: [
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:add',
        'performance:teacherInfo:update',
        'performance:teacherInfo:assign',
        'performance:teacherInfo:updateStatus',
        'performance:teacherFollow:page',
        'performance:teacherFollow:add',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:delete',
        'performance:teacherTodo:page',
        ...agentReadPerms,
        ...agentWritePerms,
        ...conflictReadPerms,
        ...conflictWritePerms,
      ],
      permsAbsent: [],
    },
  },
  {
    username: 'employee_platform',
    menu: {
      routesPresent: teacherRoutes,
      routesAbsent: [],
      permsPresent: [
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherInfo:add',
        'performance:teacherInfo:update',
        'performance:teacherInfo:updateStatus',
        'performance:teacherFollow:page',
        'performance:teacherFollow:add',
        'performance:teacherCooperation:mark',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherClass:add',
        'performance:teacherClass:update',
        'performance:teacherClass:delete',
        'performance:teacherTodo:page',
        ...agentReadPerms,
        'performance:teacherAttribution:assign',
        'performance:teacherAttribution:change',
        ...conflictReadPerms,
      ],
      permsAbsent: [
        'performance:teacherInfo:assign',
        'performance:teacherAgent:add',
        'performance:teacherAgent:update',
        'performance:teacherAgent:updateStatus',
        'performance:teacherAgent:blacklist',
        'performance:teacherAgent:unblacklist',
        'performance:teacherAgentRelation:add',
        'performance:teacherAgentRelation:update',
        'performance:teacherAgentRelation:delete',
        'performance:teacherAttribution:remove',
        ...conflictWritePerms,
      ],
    },
  },
  {
    username: 'readonly_teacher',
    menu: {
      routesPresent: teacherRoutes,
      routesAbsent: [],
      permsPresent: [
        'performance:teacherDashboard:summary',
        'performance:teacherInfo:page',
        'performance:teacherInfo:info',
        'performance:teacherFollow:page',
        'performance:teacherClass:page',
        'performance:teacherClass:info',
        'performance:teacherTodo:page',
        ...agentReadPerms,
        ...conflictReadPerms,
      ],
      permsAbsent: [...allWritePerms, ...agentWritePerms, ...conflictWritePerms],
    },
  },
];

const seededTeacherNames = {
  platformWaiting: '联调-主题19平台待联系班主任',
  platformOverdue: '联调-主题19平台逾期待跟进班主任',
  platformPartnered: '联调-主题19平台已合作班主任',
  salesHidden: '联调-主题19销售隐藏班主任',
};

const seededClassNames = {
  active: '联调-主题19平台进行中班级',
  closed: '联调-主题19平台关闭班级',
  hidden: '联调-主题19销售班级',
};
const seededAgentNames = {
  direct: '联调-主题19平台直营渠道',
  platformPrimary: '联调-主题19平台一级代理',
  platformSecondary: '联调-主题19平台二级代理',
  salesHidden: '联调-主题19销售代理',
};

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function formatDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
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

function flattenMenuRouters(menus = [], output = new Set()) {
  for (const menu of menus) {
    if (menu?.router) {
      output.add(menu.router);
    }
    flattenMenuRouters(menu?.childMenus || [], output);
  }
  return output;
}

function decodeTokenPayload(token) {
  const encoded = String(token || '').split('.')[1];
  if (!encoded) {
    return {};
  }
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

function createJsonHeaders(token) {
  return {
    Authorization: token,
    'Content-Type': 'application/json',
  };
}

function listItems(responseBody) {
  return Array.isArray(responseBody?.data?.list) ? responseBody.data.list : [];
}

function findByName(list, teacherName) {
  return (list || []).find(item => item.teacherName === teacherName) || null;
}

function validateDeniedResponse(response, deniedMessageIncludes = []) {
  if (response.body?.code === successCode) {
    return 'expected denied response but request succeeded';
  }

  if (!deniedMessageIncludes.length) {
    return null;
  }

  const message = String(response.body?.message || '');
  const matched = deniedMessageIncludes.every(fragment => message.includes(fragment));
  if (!matched) {
    return `expected message to include "${deniedMessageIncludes.join(' + ')}", got "${message}"`;
  }

  return null;
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
    baseUrl: process.env.THEME19_SMOKE_BASE_URL || '',
    password: process.env.THEME19_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.THEME19_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
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
  THEME19_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME19_SMOKE_BASE_URL.'
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
    requiredScopes: theme19RequiredScopes,
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
  if (captchaResponse.body?.code !== successCode) {
    reporter.fail(`${username} captcha`, formatResponse(captchaResponse.body));
    return null;
  }

  const captchaId = captchaResponse.body?.data?.captchaId;
  if (!captchaId) {
    reporter.fail(`${username} captcha`, 'missing captchaId');
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

    const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
      headers: { Authorization: token },
    });
    if (personResponse.body?.code !== successCode) {
      reporter.fail(`${username} person`, formatResponse(personResponse.body));
      return null;
    }

    reporter.pass(
      `${username} login`,
      `token acquired userId=${personResponse.body?.data?.id ?? 'unknown'} departmentId=${personResponse.body?.data?.departmentId ?? 'unknown'}`
    );
    return {
      token,
      payload: decodeTokenPayload(token),
      person: personResponse.body?.data || {},
    };
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

async function postJson(options, token, endpoint, payload) {
  return requestJson(`${options.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: createJsonHeaders(token),
    body: JSON.stringify(payload),
  });
}

async function getJson(options, token, endpoint) {
  return requestJson(`${options.baseUrl}${endpoint}`, {
    headers: { Authorization: token },
  });
}

async function teacherInfoPage(reporter, options, token, scope, payload, expectation = {}) {
  const response = await postJson(options, token, '/admin/performance/teacherInfo/page', payload);

  if (expectation.denied) {
    const problem = validateDeniedResponse(response, expectation.deniedMessageIncludes || []);
    if (problem) {
      reporter.fail(scope, problem);
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

async function teacherInfoInfo(reporter, options, token, id, scope, expectation = {}) {
  const response = await getJson(
    options,
    token,
    `/admin/performance/teacherInfo/info?id=${Number(id)}`
  );

  if (expectation.denied) {
    const problem = validateDeniedResponse(response, expectation.deniedMessageIncludes || []);
    if (problem) {
      reporter.fail(scope, problem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  reporter.pass(scope, `status=${response.body?.data?.cooperationStatus || 'unknown'}`);
  return response.body?.data || null;
}

async function teacherAttributionInfo(reporter, options, token, teacherId, scope, expectation = {}) {
  const response = await getJson(
    options,
    token,
    `/admin/performance/teacherInfo/attributionInfo?id=${Number(teacherId)}`
  );

  if (expectation.denied) {
    const problem = validateDeniedResponse(response, expectation.deniedMessageIncludes || []);
    if (problem) {
      reporter.fail(scope, problem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  reporter.pass(
    scope,
    `current=${response.body?.data?.currentAttribution?.agentName || 'direct'} conflicts=${response.body?.data?.openConflictCount || 0}`
  );
  return response.body?.data || null;
}

async function teacherAction(reporter, options, token, endpoint, payload, scope, expectation = {}) {
  const response = await postJson(options, token, endpoint, payload);

  if (expectation.denied) {
    const problem = validateDeniedResponse(response, expectation.deniedMessageIncludes || []);
    if (problem) {
      reporter.fail(scope, problem);
      return null;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  reporter.pass(scope, endpoint);
  return response.body?.data ?? null;
}

async function teacherClassInfo(reporter, options, token, id, scope, expectation = {}) {
  const response = await getJson(
    options,
    token,
    `/admin/performance/teacherClass/info?id=${Number(id)}`
  );

  if (expectation.denied) {
    const problem = validateDeniedResponse(response, expectation.deniedMessageIncludes || []);
    if (problem) {
      reporter.fail(scope, problem);
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

async function dashboardSummary(reporter, options, token, scope) {
  const response = await getJson(options, token, '/admin/performance/teacherDashboard/summary');
  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }
  reporter.pass(
    scope,
    `resourceTotal=${response.body?.data?.resourceTotal ?? 'unknown'} classCount=${response.body?.data?.classCount ?? 'unknown'}`
  );
  return response.body?.data || null;
}

async function todoPage(reporter, options, token, payload, scope) {
  const response = await postJson(options, token, '/admin/performance/teacherTodo/page', payload);
  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }
  reporter.pass(
    scope,
    `list=${listItems(response.body).length} today=${response.body?.data?.bucketSummary?.today ?? 0} overdue=${response.body?.data?.bucketSummary?.overdue ?? 0}`
  );
  return response.body?.data || null;
}

async function buildSeedContext(reporter, options, hrToken) {
  const list = await teacherInfoPage(
    reporter,
    options,
    hrToken,
    'seed teacherInfo:page',
    {
      page: 1,
      size: 50,
      keyword: '联调-主题19',
    }
  );

  if (!list) {
    return null;
  }

  const platformWaiting = findByName(list, seededTeacherNames.platformWaiting);
  const platformOverdue = findByName(list, seededTeacherNames.platformOverdue);
  const platformPartnered = findByName(list, seededTeacherNames.platformPartnered);
  const salesHidden = findByName(list, seededTeacherNames.salesHidden);

  try {
    ensure(platformWaiting?.id, `missing seeded teacher ${seededTeacherNames.platformWaiting}`);
    ensure(platformOverdue?.id, `missing seeded teacher ${seededTeacherNames.platformOverdue}`);
    ensure(platformPartnered?.id, `missing seeded teacher ${seededTeacherNames.platformPartnered}`);
    ensure(salesHidden?.id, `missing seeded teacher ${seededTeacherNames.salesHidden}`);
  } catch (error) {
    reporter.fail('seed teacher context', error.message);
    return null;
  }

  const classPage = await teacherAction(
    reporter,
    options,
    hrToken,
    '/admin/performance/teacherClass/page',
    {
      page: 1,
      size: 50,
      keyword: '联调-主题19',
    },
    'seed teacherClass:page'
  );

  const classList = Array.isArray(classPage?.list) ? classPage.list : [];
  const activeClass = classList.find(item => item.className === seededClassNames.active);
  const closedClass = classList.find(item => item.className === seededClassNames.closed);

  try {
    ensure(activeClass?.id || activeClass?.classId, `missing seeded class ${seededClassNames.active}`);
    ensure(closedClass?.id || closedClass?.classId, `missing seeded class ${seededClassNames.closed}`);
  } catch (error) {
    reporter.fail('seed class context', error.message);
    return null;
  }

  const agentPage = await teacherAction(
    reporter,
    options,
    hrToken,
    '/admin/performance/teacherAgent/page',
    {
      page: 1,
      size: 50,
      keyword: '联调-主题19',
    },
    'seed teacherAgent:page'
  );
  const agentList = Array.isArray(agentPage?.list) ? agentPage.list : [];
  const platformPrimaryAgent = agentList.find(item => item.name === seededAgentNames.platformPrimary);
  const platformSecondaryAgent = agentList.find(item => item.name === seededAgentNames.platformSecondary);
  const salesHiddenAgent = agentList.find(item => item.name === seededAgentNames.salesHidden);

  try {
    ensure(platformPrimaryAgent?.id, `missing seeded agent ${seededAgentNames.platformPrimary}`);
    ensure(platformSecondaryAgent?.id, `missing seeded agent ${seededAgentNames.platformSecondary}`);
    ensure(salesHiddenAgent?.id, `missing seeded agent ${seededAgentNames.salesHidden}`);
  } catch (error) {
    reporter.fail('seed agent context', error.message);
    return null;
  }

  const conflictPage = await teacherAction(
    reporter,
    options,
    hrToken,
    '/admin/performance/teacherAttributionConflict/page',
    {
      page: 1,
      size: 50,
      status: 'open',
    },
    'seed teacherAttributionConflict:page'
  );
  const conflictList = Array.isArray(conflictPage?.list) ? conflictPage.list : [];
  const platformConflict = conflictList.find(
    item => item.teacherName === seededTeacherNames.platformOverdue
  );

  try {
    ensure(platformConflict?.id, `missing seeded conflict ${seededTeacherNames.platformOverdue}`);
  } catch (error) {
    reporter.fail('seed conflict context', error.message);
    return null;
  }

  return {
    teachers: {
      platformWaiting,
      platformOverdue,
      platformPartnered,
      salesHidden,
    },
    classes: {
      activeClass,
      closedClass,
    },
    agents: {
      platformPrimaryAgent,
      platformSecondaryAgent,
      salesHiddenAgent,
    },
    conflicts: {
      platformConflict,
    },
  };
}

async function verifyHrChain(reporter, options, session, context) {
  const suffix = uniqueSuffix();
  const teacherName = `smoke-theme19-hr-${suffix}`;

  const created = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherInfo/add',
    {
      teacherName,
      schoolName: '主题19 Smoke 学校',
      subject: '数学',
      phone: '13800001901',
      wechat: `wx${suffix}`,
      nextFollowTime: formatDateTime(addDays(new Date(), 1)),
    },
    'hr teacherInfo:add'
  );
  if (!created?.id) {
    return;
  }

  const beforeFollowMark = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherCooperation/mark',
    {
      id: created.id,
    },
    'hr teacherCooperation:mark before follow',
    {
      denied: true,
      deniedMessageIncludes: ['至少存在一条跟进记录'],
    }
  );
  void beforeFollowMark;

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherFollow/add',
    {
      teacherId: created.id,
      followContent: '主题19 smoke 首次跟进',
      nextFollowTime: formatDateTime(addDays(new Date(), 1)),
    },
    'hr teacherFollow:add'
  );

  const contactedInfo = await teacherInfoInfo(
    reporter,
    options,
    session.token,
    created.id,
    'hr teacherInfo:info contacted'
  );
  if (!contactedInfo) {
    return;
  }

  if (contactedInfo.cooperationStatus !== 'contacted') {
    reporter.fail('hr contacted status', `expected contacted got ${contactedInfo.cooperationStatus}`);
    return;
  }
  reporter.pass('hr contacted status', 'first follow promoted to contacted');

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherInfo/updateStatus',
    {
      id: created.id,
      status: 'negotiating',
    },
    'hr teacherInfo:updateStatus negotiating'
  );

  const partneredTeacher = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherCooperation/mark',
    {
      teacherId: created.id,
    },
    'hr teacherCooperation:mark partnered'
  );
  if (!partneredTeacher?.id) {
    return;
  }

  const deletableClass = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/add',
    {
      teacherId: created.id,
      className: `smoke-theme19-draft-${suffix}`,
      studentCount: 16,
    },
    'hr teacherClass:add draft'
  );

  if (deletableClass?.id) {
    await teacherAction(
      reporter,
      options,
      session.token,
      '/admin/performance/teacherClass/delete',
      {
        ids: [deletableClass.id],
      },
      'hr teacherClass:delete draft'
    );
  }

  const lifecycleClass = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/add',
    {
      teacherId: created.id,
      className: `smoke-theme19-lifecycle-${suffix}`,
      studentCount: 18,
    },
    'hr teacherClass:add lifecycle'
  );

  if (!lifecycleClass?.id) {
    return;
  }

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/update',
    {
      id: lifecycleClass.id,
      className: lifecycleClass.className,
      studentCount: 19,
      status: 'active',
    },
    'hr teacherClass:update active'
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/update',
    {
      id: lifecycleClass.id,
      className: lifecycleClass.className,
      studentCount: 19,
      status: 'closed',
    },
    'hr teacherClass:update closed'
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/update',
    {
      id: lifecycleClass.id,
      className: `${lifecycleClass.className}-reopen`,
      studentCount: 19,
      status: 'active',
    },
    'hr teacherClass:update denied after closed',
    {
      denied: true,
      deniedMessageIncludes: ['已关闭班级不可编辑'],
    }
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherClass/delete',
    {
      ids: [lifecycleClass.id],
    },
    'hr teacherClass:delete denied closed',
    {
      denied: true,
      deniedMessageIncludes: ['仅草稿班级允许删除'],
    }
  );

  const summary = await dashboardSummary(reporter, options, session.token, 'hr teacherDashboard:summary');
  if (summary && Number(summary.resourceTotal || 0) < 4) {
    reporter.fail('hr dashboard counts', `unexpected resourceTotal ${summary.resourceTotal}`);
  }

  const todos = await todoPage(
    reporter,
    options,
    session.token,
    {
      page: 1,
      size: 20,
    },
    'hr teacherTodo:page'
  );
  if (todos) {
    ensure(Number(todos.bucketSummary?.today || 0) >= 1, 'today bucket should be >= 1');
    ensure(Number(todos.bucketSummary?.overdue || 0) >= 1, 'overdue bucket should be >= 1');
    reporter.pass('hr todo buckets', 'today and overdue buckets both available');
  }

  const closedClassId = Number(context.classes.closedClass.id || context.classes.closedClass.classId || 0);
  if (closedClassId) {
    await teacherClassInfo(
      reporter,
      options,
      session.token,
      closedClassId,
      'hr teacherClass:info seeded closed'
    );
  }

  const primaryAgent = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgent/add',
    {
      name: `smoke-theme19-agent-primary-${suffix}`,
      agentType: 'institution',
      level: 'L1',
      region: '上海',
      cooperationStatus: 'partnered',
      remark: 'theme19 smoke primary agent',
    },
    'hr teacherAgent:add primary'
  );
  const secondaryAgent = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgent/add',
    {
      name: `smoke-theme19-agent-secondary-${suffix}`,
      agentType: 'individual',
      level: 'L2',
      region: '上海',
      cooperationStatus: 'negotiating',
      remark: 'theme19 smoke secondary agent',
    },
    'hr teacherAgent:add secondary'
  );

  if (!primaryAgent?.id || !secondaryAgent?.id) {
    return;
  }

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgentRelation/add',
    {
      parentAgentId: primaryAgent.id,
      childAgentId: secondaryAgent.id,
      effectiveTime: formatDateTime(new Date()),
      remark: 'theme19 smoke relation',
    },
    'hr teacherAgentRelation:add'
  );

  const attributionAssigned = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAttribution/assign',
    {
      teacherId: created.id,
      agentId: primaryAgent.id,
      sourceRemark: 'theme19 smoke initial attribution',
    },
    'hr teacherAttribution:assign'
  );
  if (Number(attributionAssigned?.currentAttribution?.agentId || 0) === Number(primaryAgent.id)) {
    reporter.pass('hr attribution current agent', `agentId=${primaryAgent.id}`);
  } else {
    reporter.fail(
      'hr attribution current agent',
      `expected ${primaryAgent.id} got ${attributionAssigned?.currentAttribution?.agentId || 'unknown'}`
    );
  }

  const attributionConflict = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAttribution/change',
    {
      teacherId: created.id,
      agentId: secondaryAgent.id,
      sourceRemark: 'theme19 smoke conflict attribution',
    },
    'hr teacherAttribution:change conflicted'
  );
  if (Number(attributionConflict?.openConflictCount || 0) >= 1) {
    reporter.pass(
      'hr attribution conflict count',
      `openConflictCount=${attributionConflict.openConflictCount}`
    );
  } else {
    reporter.fail('hr attribution conflict count', 'expected open conflict after attribution change');
  }

  const conflictPage = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAttributionConflict/page',
    {
      page: 1,
      size: 50,
      status: 'open',
    },
    'hr teacherAttributionConflict:page'
  );
  const createdConflict = (conflictPage?.list || []).find(
    item => Number(item.teacherId || 0) === Number(created.id)
  );
  if (!createdConflict?.id) {
    reporter.fail('hr conflict locate', `missing conflict for teacher ${created.id}`);
    return;
  }

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAttributionConflict/resolve',
    {
      id: createdConflict.id,
      resolution: 'resolved',
      agentId: secondaryAgent.id,
      resolutionRemark: 'theme19 smoke resolved to secondary',
    },
    'hr teacherAttributionConflict:resolve'
  );

  const resolvedAttribution = await teacherAttributionInfo(
    reporter,
    options,
    session.token,
    created.id,
    'hr teacherInfo:attributionInfo resolved'
  );
  if (Number(resolvedAttribution?.currentAttribution?.agentId || 0) === Number(secondaryAgent.id)) {
    reporter.pass('hr resolved attribution winner', `agentId=${secondaryAgent.id}`);
  } else {
    reporter.fail(
      'hr resolved attribution winner',
      `expected ${secondaryAgent.id} got ${resolvedAttribution?.currentAttribution?.agentId || 'unknown'}`
    );
  }

  const auditPage = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgentAudit/page',
    {
      page: 1,
      size: 50,
    },
    'hr teacherAgentAudit:page'
  );
  const auditRows = Array.isArray(auditPage?.list) ? auditPage.list : [];
  if (auditRows.some(item => ['teacherAgent', 'teacherAttributionConflict'].includes(item.resourceType))) {
    reporter.pass('hr audit rows', `rows=${auditRows.length}`);
  } else {
    reporter.fail('hr audit rows', 'missing teacherAgent/teacherAttributionConflict audit records');
  }
}

async function verifyManagerChain(reporter, options, session, context) {
  const list = await teacherInfoPage(
    reporter,
    options,
    session.token,
    'manager teacherInfo:page scope',
    {
      page: 1,
      size: 20,
      keyword: '联调-主题19',
    }
  );
  if (!list) {
    return;
  }

  const visibleNames = new Set(list.map(item => item.teacherName));
  if (!visibleNames.has(seededTeacherNames.platformWaiting)) {
    reporter.fail('manager scope visible', `missing ${seededTeacherNames.platformWaiting}`);
  } else {
    reporter.pass('manager scope visible', seededTeacherNames.platformWaiting);
  }
  if (visibleNames.has(seededTeacherNames.salesHidden)) {
    reporter.fail('manager scope hidden', `unexpected ${seededTeacherNames.salesHidden}`);
  } else {
    reporter.pass('manager scope hidden', seededTeacherNames.salesHidden);
  }

  await teacherInfoInfo(
    reporter,
    options,
    session.token,
    context.teachers.salesHidden.id,
    'manager teacherInfo:info out-of-scope',
    {
      denied: true,
      deniedMessageIncludes: ['无权查看'],
    }
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherInfo/assign',
    {
      id: context.teachers.platformWaiting.id,
      ownerEmployeeId: session.person.id,
    },
    'manager teacherInfo:assign self'
  );

  const assignedInfo = await teacherInfoInfo(
    reporter,
    options,
    session.token,
    context.teachers.platformWaiting.id,
    'manager teacherInfo:info assigned'
  );
  if (assignedInfo && Number(assignedInfo.ownerEmployeeId || 0) === Number(session.person.id || 0)) {
    reporter.pass('manager assign owner', `ownerEmployeeId=${assignedInfo.ownerEmployeeId}`);
  } else if (assignedInfo) {
    reporter.fail('manager assign owner', `unexpected ownerEmployeeId=${assignedInfo.ownerEmployeeId}`);
  }

  const agentPage = await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgent/page',
    {
      page: 1,
      size: 50,
      keyword: '联调-主题19',
    },
    'manager teacherAgent:page scope'
  );
  const agentNames = new Set((agentPage?.list || []).map(item => item.name));
  if (agentNames.has(seededAgentNames.platformPrimary)) {
    reporter.pass('manager agent scope visible', seededAgentNames.platformPrimary);
  } else {
    reporter.fail('manager agent scope visible', `missing ${seededAgentNames.platformPrimary}`);
  }
  if (agentNames.has(seededAgentNames.salesHidden)) {
    reporter.fail('manager agent scope hidden', `unexpected ${seededAgentNames.salesHidden}`);
  } else {
    reporter.pass('manager agent scope hidden', seededAgentNames.salesHidden);
  }
}

async function verifyEmployeeChain(reporter, options, session, managerSession, context) {
  const list = await teacherInfoPage(
    reporter,
    options,
    session.token,
    'employee teacherInfo:page self scope',
    {
      page: 1,
      size: 20,
      keyword: '联调-主题19',
    }
  );
  if (!list) {
    return;
  }

  const visibleNames = new Set(list.map(item => item.teacherName));
  if (visibleNames.has(seededTeacherNames.salesHidden)) {
    reporter.fail('employee scope hidden', `unexpected ${seededTeacherNames.salesHidden}`);
  } else {
    reporter.pass('employee scope hidden', seededTeacherNames.salesHidden);
  }

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherInfo/assign',
    {
      id: context.teachers.platformOverdue.id,
      ownerEmployeeId: Number(managerSession.person.id || 0),
    },
    'employee teacherInfo:assign denied',
    {
      denied: true,
      deniedMessageIncludes: ['无权限'],
    }
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAttributionConflict/resolve',
    {
      id: context.conflicts.platformConflict.id,
      resolution: 'cancelled',
      resolutionRemark: 'employee denied smoke',
    },
    'employee teacherAttributionConflict:resolve denied',
    {
      denied: true,
      deniedMessageIncludes: ['无权限'],
    }
  );
}

async function verifyReadonlyChain(reporter, options, session, context) {
  const list = await teacherInfoPage(
    reporter,
    options,
    session.token,
    'readonly teacherInfo:page',
    {
      page: 1,
      size: 20,
      keyword: seededTeacherNames.platformPartnered,
    }
  );

  const pageRecord = findByName(list || [], seededTeacherNames.platformPartnered);
  if (!pageRecord) {
    reporter.fail('readonly list seed', `missing ${seededTeacherNames.platformPartnered}`);
    return;
  }
  if (pageRecord.phone === '13812341903' || pageRecord.wechat === 'theme19_partnered') {
    reporter.fail('readonly masking page', 'page should return masked phone/wechat');
  } else {
    reporter.pass('readonly masking page', `${pageRecord.phone} / ${pageRecord.wechat}`);
  }

  const detail = await teacherInfoInfo(
    reporter,
    options,
    session.token,
    context.teachers.platformPartnered.id,
    'readonly teacherInfo:info'
  );
  if (detail) {
    if (detail.phone === '13812341903' || detail.wechat === 'theme19_partnered') {
      reporter.fail('readonly masking detail', 'detail should return masked phone/wechat');
    } else {
      reporter.pass('readonly masking detail', `${detail.phone} / ${detail.wechat}`);
    }
  }

  await teacherAttributionInfo(
    reporter,
    options,
    session.token,
    context.teachers.platformPartnered.id,
    'readonly teacherInfo:attributionInfo'
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherFollow/add',
    {
      teacherId: context.teachers.platformPartnered.id,
      followContent: '只读越权写入',
    },
    'readonly teacherFollow:add denied',
    {
      denied: true,
    }
  );

  await teacherAction(
    reporter,
    options,
    session.token,
    '/admin/performance/teacherAgent/add',
    {
      name: `readonly-denied-${uniqueSuffix()}`,
      agentType: 'institution',
    },
    'readonly teacherAgent:add denied',
    {
      denied: true,
    }
  );

  await dashboardSummary(reporter, options, session.token, 'readonly teacherDashboard:summary');
  await todoPage(
    reporter,
    options,
    session.token,
    {
      page: 1,
      size: 20,
    },
    'readonly teacherTodo:page'
  );
  await teacherClassInfo(
    reporter,
    options,
    session.token,
    Number(context.classes.closedClass.id || context.classes.closedClass.classId || 0),
    'readonly teacherClass:info'
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reporter = new Reporter();

  console.log('Theme-19 teacher-channel smoke check');
  console.log(`Base URL: ${options.baseUrl}`);

  if (!(await verifyRuntimePreflight(reporter, options))) {
    printSummary(reporter);
    process.exit(1);
  }

  const sessions = new Map();

  for (const user of expectedUsers) {
    const session = await fetchCaptchaAndLogin(reporter, options, user.username);
    if (!session?.token) {
      printSummary(reporter);
      process.exit(1);
    }
    sessions.set(user.username, session);
    await verifyPermMenu(reporter, options, user, session.token);
  }

  const hrSession = sessions.get('hr_admin');
  const managerSession = sessions.get('manager_rd');
  const employeeSession = sessions.get('employee_platform');
  const readonlySession = sessions.get('readonly_teacher');

  const context = await buildSeedContext(reporter, options, hrSession.token);
  if (!context) {
    printSummary(reporter);
    process.exit(1);
  }

  await verifyHrChain(reporter, options, hrSession, context);
  await verifyManagerChain(reporter, options, managerSession, context);
  await verifyEmployeeChain(reporter, options, employeeSession, managerSession, context);
  await verifyReadonlyChain(reporter, options, readonlySession, context);

  printSummary(reporter);
  process.exit(reporter.hasFailures() ? 1 : 0);
}

await main();
