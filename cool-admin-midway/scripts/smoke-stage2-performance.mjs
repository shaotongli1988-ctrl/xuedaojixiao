/**
 * Stage-2 smoke verification for performance modules 1, 2, 3, 4, 6, 7, and 8.
 * This file checks captcha, login, menu scope, dashboard/assessment/goal APIs, and the minimum real API path for indicator/PIP/promotion/salary.
 * It does not change business data, patch runtime config, or replace seed/bootstrap scripts.
 * Maintenance pitfall: assertions are coupled to seed-stage2-performance.mjs and the current stage-2 scope; update both sides together.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultBaseUrl = 'http://127.0.0.1:8001';
const defaultPassword = '123456';
const successCode = 1000;

const expectedUsers = [
  {
    username: 'hr_admin',
    label: 'HR管理员',
    menu: {
      routesPresent: [
        '/data-center/dashboard',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/indicator-library',
        '/performance/pip',
        '/performance/promotion',
        '/performance/salary',
      ],
      routesAbsent: [],
      permsPresent: [
        'performance:dashboard:summary',
        'performance:assessment:myPage',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:export',
        'performance:goal:page',
        'performance:goal:add',
        'performance:goal:export',
        'performance:indicator:page',
        'performance:indicator:add',
        'performance:pip:page',
        'performance:pip:start',
        'performance:promotion:page',
        'performance:promotion:review',
        'performance:salary:page',
        'performance:salary:changeAdd',
      ],
      permsAbsent: [
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:assessment:submit',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 0,
        includeCodes: [],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: true,
        expectedTotal: 5,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
          'PMS-STAGE2-HIDDEN-001',
        ],
        excludeCodes: [],
      },
      {
        mode: 'pending',
        expectSuccess: true,
        expectedTotal: 2,
        includeCodes: ['PMS-STAGE2-SUBMITTED-001', 'PMS-STAGE2-HIDDEN-001'],
        excludeCodes: [],
      },
    ],
    dashboardSummary: {
      expectSuccess: true,
      expectEmptyScope: false,
    },
    goalPage: {
      expectedTotal: 4,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
        '联调-销售中心隐藏目标',
      ],
      excludeTitles: [],
    },
    indicatorPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includeCodes: [
        'PMS-STAGE2-IND-DELIVERY',
        'PMS-STAGE2-IND-COLLAB',
        'PMS-STAGE2-IND-STABILITY',
        'PMS-STAGE2-IND-DISABLED',
      ],
      excludeCodes: [],
      enabledFilter: {
        expectedTotal: 3,
        includeCodes: [
          'PMS-STAGE2-IND-DELIVERY',
          'PMS-STAGE2-IND-COLLAB',
          'PMS-STAGE2-IND-STABILITY',
        ],
        excludeCodes: ['PMS-STAGE2-IND-DISABLED'],
      },
    },
    pipPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
        '联调-PIP-隐藏-销售员工',
      ],
      excludeTitles: [],
    },
    promotionPage: {
      expectSuccess: true,
      expectedTotal: 4,
      includePositions: [
        '阶段2-销售主管',
        '阶段2-平台高级工程师',
        '阶段2-平台技术专家',
        '阶段2-平台架构师',
      ],
      excludePositions: [],
    },
    salaryPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeKeys: [
        '平台员工:confirmed',
        '平台员工:archived',
        '销售员工:archived',
      ],
      excludeKeys: [],
      expectSensitiveFields: true,
    },
  },
  {
    username: 'manager_rd',
    label: '部门经理',
    menu: {
      routesPresent: [
        '/data-center/dashboard',
        '/performance/my-assessment',
        '/performance/initiated',
        '/performance/pending',
        '/performance/goals',
        '/performance/pip',
        '/performance/promotion',
      ],
      routesAbsent: ['/performance/indicator-library', '/performance/salary'],
      permsPresent: [
        'performance:dashboard:summary',
        'performance:assessment:myPage',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:goal:page',
        'performance:goal:add',
        'performance:goal:export',
        'performance:pip:page',
        'performance:pip:track',
        'performance:promotion:page',
        'performance:promotion:review',
      ],
      permsAbsent: [
        'performance:assessment:export',
        'performance:assessment:submit',
        'performance:indicator:page',
        'performance:salary:page',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 0,
        includeCodes: [],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: true,
        expectedTotal: 4,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
        ],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'pending',
        expectSuccess: true,
        expectedTotal: 1,
        includeCodes: ['PMS-STAGE2-SUBMITTED-001'],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
    ],
    dashboardSummary: {
      expectSuccess: true,
      expectEmptyScope: true,
    },
    goalPage: {
      expectedTotal: 3,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
      ],
      excludeTitles: ['联调-销售中心隐藏目标'],
    },
    indicatorPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看指标库',
    },
    pipPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includeTitles: [
        '联调-PIP-草稿-平台员工',
        '联调-PIP-进行中-平台员工',
        '联调-PIP-已完成-平台员工',
      ],
      excludeTitles: ['联调-PIP-隐藏-销售员工'],
    },
    promotionPage: {
      expectSuccess: true,
      expectedTotal: 3,
      includePositions: [
        '阶段2-平台高级工程师',
        '阶段2-平台技术专家',
        '阶段2-平台架构师',
      ],
      excludePositions: ['阶段2-销售主管'],
    },
    salaryPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看薪资管理',
    },
  },
  {
    username: 'employee_platform',
    label: '普通员工',
    menu: {
      routesPresent: ['/performance/my-assessment', '/performance/goals'],
      routesAbsent: [
        '/data-center/dashboard',
        '/performance/initiated',
        '/performance/pending',
        '/performance/indicator-library',
        '/performance/pip',
        '/performance/promotion',
        '/performance/salary',
      ],
      permsPresent: [
        'performance:assessment:myPage',
        'performance:assessment:info',
        'performance:assessment:update',
        'performance:assessment:submit',
        'performance:goal:page',
        'performance:goal:info',
        'performance:goal:update',
        'performance:goal:progressUpdate',
      ],
      permsAbsent: [
        'performance:dashboard:summary',
        'performance:assessment:page',
        'performance:assessment:pendingPage',
        'performance:assessment:add',
        'performance:assessment:delete',
        'performance:assessment:approve',
        'performance:assessment:reject',
        'performance:assessment:export',
        'performance:goal:add',
        'performance:goal:delete',
        'performance:goal:export',
        'performance:indicator:page',
        'performance:pip:page',
        'performance:promotion:page',
        'performance:salary:page',
      ],
    },
    assessmentModes: [
      {
        mode: 'my',
        expectSuccess: true,
        expectedTotal: 4,
        includeCodes: [
          'PMS-STAGE2-DRAFT-001',
          'PMS-STAGE2-SUBMITTED-001',
          'PMS-STAGE2-APPROVED-001',
          'PMS-STAGE2-REJECTED-001',
        ],
        excludeCodes: ['PMS-STAGE2-HIDDEN-001'],
      },
      {
        mode: 'initiated',
        expectSuccess: false,
        expectedMessage: '无权限查看已发起考核',
      },
      {
        mode: 'pending',
        expectSuccess: false,
        expectedMessage: '无权限查看待我审批',
      },
    ],
    dashboardSummary: {
      expectSuccess: false,
      expectedMessage: '无权限查看绩效驾驶舱',
    },
    goalPage: {
      expectedTotal: 3,
      includeTitles: [
        '联调-平台组季度交付目标',
        '联调-平台组质量改进目标',
        '联调-平台组稳定性目标',
      ],
      excludeTitles: ['联调-销售中心隐藏目标'],
    },
    indicatorPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看指标库',
    },
    pipPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看 PIP',
    },
    promotionPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看晋升列表',
    },
    salaryPage: {
      expectSuccess: false,
      expectedMessage: '无权限查看薪资管理',
    },
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.STAGE2_SMOKE_BASE_URL || defaultBaseUrl,
    password: process.env.STAGE2_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.STAGE2_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }
    if (current === '--base-url') {
      options.baseUrl = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--password') {
      options.password = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--cache-dir') {
      options.cacheDir = requireValue(argv, index, current);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${current}`);
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/smoke-stage2-performance.mjs [--base-url URL] [--password PASS] [--cache-dir DIR]

Environment variables:
  STAGE2_SMOKE_BASE_URL   Override backend base URL. Default: ${defaultBaseUrl}
  STAGE2_SMOKE_PASSWORD   Override shared password. Default: ${defaultPassword}
  STAGE2_SMOKE_CACHE_DIR  Override local cache directory resolved from src/config/config.default.ts

Notes:
  - This script only performs stage-2 smoke checks.
  - It depends on the current backend being reachable and the stage-2 seed data already loaded.
  - It does not modify login config, permissions middleware, or business data.`);
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
      const projectHash = md5(matched[1]);
      return path.join(os.homedir(), '.cool-admin', projectHash, 'cache');
    }
  }

  throw new Error(
    'Unable to resolve cache directory from dist/config/config.default.js or src/config/config.default.ts'
  );
}

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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
        return {
          key,
          value: parsed.val,
          file: targetFile,
        };
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

function listCodes(responseBody) {
  return (responseBody?.data?.list || []).map(item => item.code).filter(Boolean);
}

function listTitles(responseBody) {
  return (responseBody?.data?.list || []).map(item => item.title).filter(Boolean);
}

function listPositions(responseBody) {
  return (responseBody?.data?.list || [])
    .map(item => item.toPosition)
    .filter(Boolean);
}

function listSalaryKeys(responseBody) {
  return (responseBody?.data?.list || [])
    .map(item => `${item.employeeName}:${item.status}`)
    .filter(Boolean);
}

function listStageKeys(responseBody) {
  return (responseBody?.data?.stageProgress || [])
    .map(item => item.stageKey)
    .filter(Boolean);
}

function totalFromPage(responseBody) {
  return (
    responseBody?.data?.pagination?.total ??
    responseBody?.data?.total ??
    responseBody?.data?.list?.length ??
    0
  );
}

async function fetchCaptchaAndLogin(reporter, options, user) {
  const captchaScope = `${user.username} captcha`;
  const captchaResponse = await requestJson(
    `${options.baseUrl}/admin/base/open/captcha`
  );

  if (captchaResponse.body?.code !== successCode) {
    reporter.fail(
      captchaScope,
      `captcha API failed: ${formatResponse(captchaResponse.body)}`
    );
    return null;
  }

  const captchaId = captchaResponse.body?.data?.captchaId;
  const captchaData = captchaResponse.body?.data?.data;

  if (!captchaId || !String(captchaData || '').startsWith('data:image/svg+xml;base64,')) {
    reporter.fail(captchaScope, 'captcha response missing captchaId or svg payload');
    return null;
  }

  reporter.pass(captchaScope, `captchaId=${captchaId}`);

  try {
    const cached = await readCaptchaValue(options.cacheDir, captchaId);
    reporter.pass(
      `${user.username} captcha-cache`,
      `read ${cached.file} -> ${cached.value}`
    );

    const loginResponse = await requestJson(
      `${options.baseUrl}/admin/base/open/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: options.password,
          captchaId,
          verifyCode: cached.value,
        }),
      }
    );

    if (loginResponse.body?.code !== successCode) {
      reporter.fail(
        `${user.username} login`,
        formatResponse(loginResponse.body)
      );
      return null;
    }

    const token = loginResponse.body?.data?.token;
    if (!token) {
      reporter.fail(`${user.username} login`, 'login succeeded without token');
      return null;
    }

    reporter.pass(`${user.username} login`, 'token acquired');
    return { token };
  } catch (error) {
    reporter.fail(`${user.username} captcha-cache`, error.message);
    return null;
  }
}

async function verifyPermMenu(reporter, options, user, token) {
  const response = await requestJson(
    `${options.baseUrl}/admin/base/comm/permmenu`,
    {
      headers: { Authorization: token },
    }
  );

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

  reporter.pass(
    `${user.username} permmenu`,
    `routes=${routers.size} perms=${perms.size}`
  );
}

async function verifyAssessmentPages(reporter, options, user, token) {
  for (const check of user.assessmentModes) {
    const scope = `${user.username} assessment:${check.mode}`;
    const response = await requestJson(
      `${options.baseUrl}/admin/performance/assessment/page`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 1,
          size: 20,
          mode: check.mode,
        }),
      }
    );

    if (!check.expectSuccess) {
      if (response.body?.code === successCode) {
        reporter.fail(scope, 'expected denial but request succeeded');
        continue;
      }
      const message = String(response.body?.message || '');
      if (!message.includes(check.expectedMessage)) {
        reporter.fail(scope, `expected message "${check.expectedMessage}", got "${message}"`);
        continue;
      }
      reporter.pass(scope, `denied as expected: ${message}`);
      continue;
    }

    if (response.body?.code !== successCode) {
      reporter.fail(scope, formatResponse(response.body));
      continue;
    }

    const total = totalFromPage(response.body);
    const codes = listCodes(response.body);
    const problems = [];

    if (total !== check.expectedTotal) {
      problems.push(`expected total ${check.expectedTotal}, got ${total}`);
    }

    for (const code of check.includeCodes) {
      if (!codes.includes(code)) {
        problems.push(`missing code ${code}`);
      }
    }

    for (const code of check.excludeCodes) {
      if (codes.includes(code)) {
        problems.push(`unexpected code ${code}`);
      }
    }

    if (problems.length) {
      reporter.fail(scope, problems.join('; '));
      continue;
    }

    reporter.pass(scope, `total=${total} codes=${codes.join(', ') || 'none'}`);
  }
}

async function verifyGoalPage(reporter, options, user, token) {
  const scope = `${user.username} goal:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/goal/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const titles = listTitles(response.body);
  const problems = [];

  if (total !== user.goalPage.expectedTotal) {
    problems.push(`expected total ${user.goalPage.expectedTotal}, got ${total}`);
  }

  for (const title of user.goalPage.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of user.goalPage.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
}

async function verifyDashboardSummary(reporter, options, user, token) {
  const config = user.dashboardSummary;
  const scope = `${user.username} dashboard:summary`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/summary`
      + '?periodType=quarter&periodValue=2026-Q2',
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const data = response.body?.data || {};
  const stageKeys = listStageKeys(response.body);
  const requiredStageKeys = [
    'indicatorConfigured',
    'assessmentCreated',
    'selfSubmitted',
    'managerApproved',
    'resultArchived',
  ];
  const problems = [];

  if (typeof data.averageScore !== 'number') {
    problems.push('averageScore is not a number');
  }
  if (typeof data.pendingApprovalCount !== 'number') {
    problems.push('pendingApprovalCount is not a number');
  }
  if (typeof data.goalCompletionRate !== 'number') {
    problems.push('goalCompletionRate is not a number');
  }
  if (!Array.isArray(data.departmentDistribution)) {
    problems.push('departmentDistribution is not an array');
  }
  if (!Array.isArray(data.gradeDistribution)) {
    problems.push('gradeDistribution is not an array');
  }
  if (!Array.isArray(data.stageProgress) || data.stageProgress.length !== 5) {
    problems.push(`expected 5 stageProgress items, got ${data.stageProgress?.length ?? 'invalid'}`);
  }

  for (const key of requiredStageKeys) {
    if (!stageKeys.includes(key)) {
      problems.push(`missing stageKey ${key}`);
    }
  }

  if (data.gradeDistribution?.length !== 4) {
    problems.push(`expected 4 grade buckets, got ${data.gradeDistribution?.length ?? 'invalid'}`);
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(
    scope,
    `stageKeys=${stageKeys.join(', ')} pending=${data.pendingApprovalCount}`
  );

  if (!config.expectEmptyScope) {
    return;
  }

  const emptyScope = `${user.username} dashboard:summary:out-of-scope`;
  const emptyResponse = await requestJson(
    `${options.baseUrl}/admin/performance/dashboard/summary`
      + '?periodType=quarter&periodValue=2026-Q2&departmentId=999999',
    {
      headers: {
        Authorization: token,
      },
    }
  );

  if (emptyResponse.body?.code !== successCode) {
    reporter.fail(emptyScope, formatResponse(emptyResponse.body));
    return;
  }

  const emptyData = emptyResponse.body?.data || {};
  const emptyProblems = [];

  if (emptyData.averageScore !== 0) {
    emptyProblems.push(`expected averageScore 0, got ${emptyData.averageScore}`);
  }
  if (emptyData.pendingApprovalCount !== 0) {
    emptyProblems.push(
      `expected pendingApprovalCount 0, got ${emptyData.pendingApprovalCount}`
    );
  }
  if (emptyData.goalCompletionRate !== 0) {
    emptyProblems.push(`expected goalCompletionRate 0, got ${emptyData.goalCompletionRate}`);
  }
  if ((emptyData.departmentDistribution || []).length !== 0) {
    emptyProblems.push('expected empty departmentDistribution');
  }
  if ((emptyData.stageProgress || []).some(item => item.totalCount !== 0 || item.completedCount !== 0)) {
    emptyProblems.push('expected empty stageProgress counts for out-of-scope department');
  }

  if (emptyProblems.length) {
    reporter.fail(emptyScope, emptyProblems.join('; '));
    return;
  }

  reporter.pass(emptyScope, 'empty scope summary returned as expected');
}

async function verifyIndicatorPage(reporter, options, user, token) {
  const config = user.indicatorPage;
  const scope = `${user.username} indicator:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/indicator/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const codes = listCodes(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const code of config.includeCodes) {
    if (!codes.includes(code)) {
      problems.push(`missing code ${code}`);
    }
  }

  for (const code of config.excludeCodes) {
    if (codes.includes(code)) {
      problems.push(`unexpected code ${code}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} codes=${codes.join(', ')}`);

  if (!config.enabledFilter) {
    return;
  }

  const filterScope = `${user.username} indicator:page:enabled`;
  const filterResponse = await requestJson(
    `${options.baseUrl}/admin/performance/indicator/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        status: 1,
      }),
    }
  );

  if (filterResponse.body?.code !== successCode) {
    reporter.fail(filterScope, formatResponse(filterResponse.body));
    return;
  }

  const filterTotal = totalFromPage(filterResponse.body);
  const filterCodes = listCodes(filterResponse.body);
  const filterProblems = [];

  if (filterTotal !== config.enabledFilter.expectedTotal) {
    filterProblems.push(
      `expected total ${config.enabledFilter.expectedTotal}, got ${filterTotal}`
    );
  }

  for (const code of config.enabledFilter.includeCodes) {
    if (!filterCodes.includes(code)) {
      filterProblems.push(`missing code ${code}`);
    }
  }

  for (const code of config.enabledFilter.excludeCodes) {
    if (filterCodes.includes(code)) {
      filterProblems.push(`unexpected code ${code}`);
    }
  }

  if (filterProblems.length) {
    reporter.fail(filterScope, filterProblems.join('; '));
    return;
  }

  reporter.pass(filterScope, `total=${filterTotal} codes=${filterCodes.join(', ')}`);
}

async function verifyPipPage(reporter, options, user, token) {
  const config = user.pipPage;
  const scope = `${user.username} pip:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/pip/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: '联调-PIP-',
    }),
  });

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const titles = listTitles(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const title of config.includeTitles) {
    if (!titles.includes(title)) {
      problems.push(`missing title ${title}`);
    }
  }

  for (const title of config.excludeTitles) {
    if (titles.includes(title)) {
      problems.push(`unexpected title ${title}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} titles=${titles.join(', ')}`);
}

async function verifyPromotionPage(reporter, options, user, token) {
  const config = user.promotionPage;
  const scope = `${user.username} promotion:page`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/promotion/page`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        toPosition: '阶段2-',
      }),
    }
  );

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const positions = listPositions(response.body);
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const position of config.includePositions) {
    if (!positions.includes(position)) {
      problems.push(`missing position ${position}`);
    }
  }

  for (const position of config.excludePositions) {
    if (positions.includes(position)) {
      problems.push(`unexpected position ${position}`);
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} positions=${positions.join(', ')}`);
}

async function verifySalaryPage(reporter, options, user, token) {
  const config = user.salaryPage;
  const scope = `${user.username} salary:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/salary/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      periodValue: '2026-STAGE2-Q2',
    }),
  });

  if (!config.expectSuccess) {
    if (response.body?.code === successCode) {
      reporter.fail(scope, 'expected denial but request succeeded');
      return;
    }
    const message = String(response.body?.message || '');
    if (!message.includes(config.expectedMessage)) {
      reporter.fail(scope, `expected message "${config.expectedMessage}", got "${message}"`);
      return;
    }
    reporter.pass(scope, `denied as expected: ${message}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  const total = totalFromPage(response.body);
  const keys = listSalaryKeys(response.body);
  const list = response.body?.data?.list || [];
  const problems = [];

  if (total !== config.expectedTotal) {
    problems.push(`expected total ${config.expectedTotal}, got ${total}`);
  }

  for (const key of config.includeKeys) {
    if (!keys.includes(key)) {
      problems.push(`missing row ${key}`);
    }
  }

  for (const key of config.excludeKeys) {
    if (keys.includes(key)) {
      problems.push(`unexpected row ${key}`);
    }
  }

  if (config.expectSensitiveFields) {
    const sample = list[0] || {};
    if (
      typeof sample.baseSalary !== 'number' ||
      typeof sample.performanceBonus !== 'number' ||
      typeof sample.adjustAmount !== 'number' ||
      typeof sample.finalAmount !== 'number'
    ) {
      problems.push('sensitive salary fields are not visible to HR');
    }
  }

  if (problems.length) {
    reporter.fail(scope, problems.join('; '));
    return;
  }

  reporter.pass(scope, `total=${total} rows=${keys.join(', ')}`);
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

async function run() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));

  console.log('Stage-2 performance smoke check');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Cache Dir: ${options.cacheDir}`);

  if (!fs.existsSync(options.cacheDir)) {
    reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
  }

  for (const user of expectedUsers) {
    const session = await fetchCaptchaAndLogin(reporter, options, user);
    if (!session?.token) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} dashboard:summary`, 'skipped because login failed');
      reporter.skip(`${user.username} assessment`, 'skipped because login failed');
      reporter.skip(`${user.username} goal:page`, 'skipped because login failed');
      reporter.skip(`${user.username} indicator:page`, 'skipped because login failed');
      reporter.skip(`${user.username} pip:page`, 'skipped because login failed');
      reporter.skip(`${user.username} promotion:page`, 'skipped because login failed');
      reporter.skip(`${user.username} salary:page`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, session.token);
    await verifyDashboardSummary(reporter, options, user, session.token);
    await verifyAssessmentPages(reporter, options, user, session.token);
    await verifyGoalPage(reporter, options, user, session.token);
    await verifyIndicatorPage(reporter, options, user, session.token);
    await verifyPipPage(reporter, options, user, session.token);
    await verifyPromotionPage(reporter, options, user, session.token);
    await verifySalaryPage(reporter, options, user, session.token);
  }

  const stats = reporter.summary();
  console.log('');
  console.log('Summary');
  console.log(`PASS: ${stats.PASS}`);
  console.log(`FAIL: ${stats.FAIL}`);
  console.log(`SKIP: ${stats.SKIP}`);
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);

  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
