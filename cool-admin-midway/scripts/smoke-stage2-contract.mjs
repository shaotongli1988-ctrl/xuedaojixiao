/**
 * Theme-10 contract smoke verification.
 * This file only checks contract menu visibility, HR CRUD, denied access, and contract data boundary.
 * It does not seed data, modify runtime config, or replace the broader stage-2 smoke script.
 * Maintenance pitfall: expected contract samples must stay aligned with seed-stage2-performance.mjs and menu.json.
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
const forbiddenKeys = [
  'attachmentContent',
  'pdfPreviewUrl',
  'signatureImage',
  'signTrail',
  'approvalHistory',
  'certificateNo',
  'bankAccount',
  'extraContactPhone',
  'extraContact',
];
const theme10RequiredScopes = ['theme10-contract'];

const expectedUsers = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: ['/performance/contract'],
      routesAbsent: [],
      permsPresent: [
        'performance:contract:page',
        'performance:contract:info',
        'performance:contract:add',
        'performance:contract:update',
        'performance:contract:delete',
      ],
      permsAbsent: [],
    },
    contractPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-主题10草稿合同',
        '联调-主题10生效合同',
        '联调-主题10终止合同',
      ],
      activeTitle: '联调-主题10生效合同',
      draftTitle: '联调-主题10草稿合同',
    },
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: [],
      routesAbsent: ['/performance/contract'],
      permsPresent: [],
      permsAbsent: [
        'performance:contract:page',
        'performance:contract:info',
        'performance:contract:add',
        'performance:contract:update',
        'performance:contract:delete',
      ],
    },
    contractPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看合同列表',
    },
  },
  {
    username: 'employee_platform',
    menu: {
      routesPresent: [],
      routesAbsent: ['/performance/contract'],
      permsPresent: [],
      permsAbsent: [
        'performance:contract:page',
        'performance:contract:info',
        'performance:contract:add',
        'performance:contract:update',
        'performance:contract:delete',
      ],
    },
    contractPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看合同列表',
    },
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.THEME10_SMOKE_BASE_URL || '',
    password: defaultPassword,
    cacheDir: process.env.THEME10_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
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
  THEME10_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME10_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

function resolveDefaultCacheDir() {
  const keyCandidates = [
    path.join(projectRoot, 'dist/config/config.default.js'),
    path.join(projectRoot, 'src/config/config.default.ts'),
  ];

  for (const candidate of keyCandidates) {
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

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
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

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function matchesDeniedMessage(message, expectedMessage) {
  if (!expectedMessage) {
    return true;
  }
  return (
    message.includes(expectedMessage) ||
    message.includes('登录失效或无权限访问~')
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

  hasFailures() {
    return this.records.some(record => record.status === 'FAIL');
  }

  summary() {
    const stats = { PASS: 0, FAIL: 0, SKIP: 0 };
    for (const record of this.records) {
      stats[record.status] += 1;
    }
    return stats;
  }
}

async function requestJson(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const rawText = await response.text();
    let body;
    try {
      body = rawText ? JSON.parse(rawText) : null;
    } catch (error) {
      body = rawText;
    }
    return {
      status: response.status,
      ok: response.ok,
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
    requiredScopes: theme10RequiredScopes,
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

function cacheFilePath(cacheDir, key) {
  return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

async function readCaptchaValue(cacheDir, captchaId) {
  const key = `verify:img:${captchaId}`;
  const targetFile = cacheFilePath(cacheDir, key);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (fs.existsSync(targetFile)) {
      const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (parsed?.key === key && parsed?.val) {
        return parsed.val;
      }
    }
    await sleep(100);
  }

  throw new Error(`Captcha cache file not found for ${captchaId} under ${cacheDir}`);
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

function totalFromPage(responseBody) {
  return (
    responseBody?.data?.pagination?.total ??
    responseBody?.data?.total ??
    responseBody?.data?.list?.length ??
    0
  );
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

function assertForbiddenKeysAbsent(target, scope, problems) {
  for (const key of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(target || {}, key)) {
      problems.push(`${scope} leaked ${key}`);
    }
  }
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

    reporter.pass(`${username} login`, 'token acquired');
    return { token };
  } catch (error) {
    reporter.fail(`${username} login`, error.message);
    return null;
  }
}

async function verifyPermMenu(reporter, options, user, token) {
  const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
    headers: { Authorization: token },
  });

  if (response.body?.code !== successCode) {
    reporter.fail(`${user.username} permmenu`, formatResponse(response.body));
    return;
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
    reporter.fail(`${user.username} permmenu`, problems.join('; '));
    return;
  }

  reporter.pass(`${user.username} permmenu`, `routes=${routers.size} perms=${perms.size}`);
}

async function verifyContractPage(reporter, options, user, token) {
  const scope = `${user.username} contract:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/contract/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
    }),
  });

  if (!user.contractPage.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return null;
    }
    const message = String(response.body?.message || '');
    if (!matchesDeniedMessage(message, user.contractPage.expectedMessage)) {
      reporter.fail(
        scope,
        `expected message "${user.contractPage.expectedMessage}", got "${message}"`
      );
      return null;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return null;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const total = totalFromPage(response.body);
  const list = response.body?.data?.list || [];
  const titles = list.map(item => item.title).filter(Boolean);
  const problems = [];

  if (total !== user.contractPage.expectedTotal) {
    problems.push(`expected total ${user.contractPage.expectedTotal}, got ${total}`);
  }

  for (const title of user.contractPage.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing contract ${title}`);
    }
  }

  if (!list.every(item => typeof item.salary !== 'undefined')) {
    problems.push('page response missing salary for HR');
  }

  list.forEach(item => {
    assertForbiddenKeysAbsent(item, 'page item', problems);
  });

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return null;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
  return list;
}

async function verifyContractInfo(reporter, options, token, itemId) {
  const scope = 'hr_admin contract:info';
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/contract/info?id=${itemId}`,
    {
      headers: { Authorization: token },
    }
  );

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }

  const data = response.body?.data || {};
  const problems = [];
  assertForbiddenKeysAbsent(data, 'info data', problems);

  if (typeof data.salary === 'undefined') {
    problems.push('info response missing salary for HR');
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return null;
  }

  reporter.pass(scope, `id=${data.id} status=${data.status}`);
  return data;
}

async function verifyHrCrud(reporter, options, token, list, config) {
  const draftSource = list.find(item => item.title === config.draftTitle);
  const activeSource = list.find(item => item.title === config.activeTitle);

  if (!draftSource?.id || !activeSource?.id) {
    reporter.fail(
      'hr_admin contract:setup',
      'missing seeded draft or active contract'
    );
    return;
  }

  await verifyContractInfo(reporter, options, token, draftSource.id);

  const uniqueNumber = `PMS-CONTRACT-SMOKE-${Date.now()}`;
  const addScope = 'hr_admin contract:add';
  const addResponse = await requestJson(`${options.baseUrl}/admin/performance/contract/add`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: draftSource.employeeId,
      type: 'full-time',
      title: '联调-主题10新增草稿合同',
      contractNumber: uniqueNumber,
      startDate: '2026-06-01',
      endDate: '2027-05-31',
      probationPeriod: 2,
      salary: 21000,
      position: '联调岗位',
      departmentId: draftSource.departmentId,
    }),
  });

  if (addResponse.body?.code !== successCode) {
    reporter.fail(addScope, formatResponse(addResponse.body));
    return;
  }

  const created = addResponse.body?.data || {};
  if (!created.id || created.status !== 'draft') {
    reporter.fail(addScope, `unexpected create response ${JSON.stringify(created)}`);
    return;
  }
  reporter.pass(addScope, `id=${created.id} contractNumber=${uniqueNumber}`);

  const updateScope = 'hr_admin contract:update';
  const updateResponse = await requestJson(`${options.baseUrl}/admin/performance/contract/update`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: created.id,
      employeeId: created.employeeId,
      type: created.type,
      title: '联调-主题10更新后草稿合同',
      contractNumber: uniqueNumber,
      startDate: created.startDate,
      endDate: created.endDate,
      probationPeriod: created.probationPeriod,
      salary: created.salary,
      position: '联调岗位-更新',
      departmentId: created.departmentId,
      status: 'draft',
    }),
  });

  if (updateResponse.body?.code !== successCode) {
    reporter.fail(updateScope, formatResponse(updateResponse.body));
    return;
  }

  if (updateResponse.body?.data?.title !== '联调-主题10更新后草稿合同') {
    reporter.fail(updateScope, 'update response title mismatch');
    return;
  }
  reporter.pass(updateScope, `id=${created.id} title updated`);

  const deleteScope = 'hr_admin contract:delete:draft';
  const deleteResponse = await requestJson(`${options.baseUrl}/admin/performance/contract/delete`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: [created.id],
    }),
  });

  if (deleteResponse.body?.code !== successCode) {
    reporter.fail(deleteScope, formatResponse(deleteResponse.body));
    return;
  }
  reporter.pass(deleteScope, `id=${created.id}`);

  const rejectScope = 'hr_admin contract:delete:active-reject';
  const rejectResponse = await requestJson(
    `${options.baseUrl}/admin/performance/contract/delete`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [activeSource.id],
      }),
    }
  );

  if (rejectResponse.body?.code === successCode) {
    reporter.fail(rejectScope, 'expected active contract delete rejection');
    return;
  }

  const message = String(rejectResponse.body?.message || '');
  if (!message.includes('当前状态不允许删除')) {
    reporter.fail(rejectScope, `unexpected message "${message}"`);
    return;
  }

  reporter.pass(rejectScope, message);
}

async function run() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));

  console.log('Theme-10 contract smoke check');
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

  let hrList = null;
  let hrToken = null;

  for (const user of expectedUsers) {
    const session = await fetchCaptchaAndLogin(reporter, options, user.username);
    if (!session?.token) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} contract:page`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, session.token);
    const pageList = await verifyContractPage(reporter, options, user, session.token);

    if (user.username === 'hr_admin') {
      hrToken = session.token;
      hrList = pageList;
    }
  }

  if (hrToken && Array.isArray(hrList)) {
    await verifyHrCrud(
      reporter,
      options,
      hrToken,
      hrList,
      expectedUsers[0].contractPage
    );
  } else {
    reporter.skip('hr_admin contract:crud', 'skipped because HR page verification failed');
  }

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
