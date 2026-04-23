/**
 * Theme-15 resumePool smoke verification.
 * This file validates menu visibility, permission keys, and minimum API smoke for resumePool.
 * It does not seed business data, patch runtime config, or replace broader stage-2 smoke scripts.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, and theme-15 frozen contracts.
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
const theme15RequiredScopes = ['theme15-resumePool'];

const expectedUsers = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: ['/performance/resumePool'],
      routesAbsent: [],
      permsPresent: [
        'performance:resumePool:page',
        'performance:resumePool:info',
        'performance:resumePool:add',
        'performance:resumePool:update',
        'performance:resumePool:import',
        'performance:resumePool:export',
        'performance:resumePool:uploadAttachment',
        'performance:resumePool:downloadAttachment',
        'performance:resumePool:convertToTalentAsset',
        'performance:resumePool:createInterview',
      ],
      permsAbsent: [],
    },
    resumePoolPage: {
      expectSuccess: true,
    },
    resumePoolExport: {
      expectSuccess: true,
    },
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: ['/performance/resumePool'],
      routesAbsent: [],
      permsPresent: [
        'performance:resumePool:page',
        'performance:resumePool:info',
        'performance:resumePool:add',
        'performance:resumePool:update',
        'performance:resumePool:import',
        'performance:resumePool:uploadAttachment',
        'performance:resumePool:convertToTalentAsset',
        'performance:resumePool:createInterview',
      ],
      permsAbsent: [
        'performance:resumePool:export',
        'performance:resumePool:downloadAttachment',
      ],
    },
    resumePoolPage: {
      expectSuccess: true,
    },
    resumePoolExport: {
      expectSuccess: false,
      deniedMessageIncludes: ['无权限', '导出'],
    },
    resumePoolDownloadAttachment: {
      expectSuccess: false,
      deniedMessageIncludes: ['无权限', '下载'],
    },
  },
  {
    username: 'employee_platform',
    menu: {
      routesPresent: [],
      routesAbsent: ['/performance/resumePool'],
      permsPresent: [],
      permsAbsent: [
        'performance:resumePool:page',
        'performance:resumePool:info',
        'performance:resumePool:add',
        'performance:resumePool:update',
        'performance:resumePool:import',
        'performance:resumePool:export',
        'performance:resumePool:uploadAttachment',
        'performance:resumePool:downloadAttachment',
        'performance:resumePool:convertToTalentAsset',
        'performance:resumePool:createInterview',
      ],
    },
    resumePoolPage: {
      expectSuccess: false,
      deniedMessageIncludes: ['无权限'],
    },
    resumePoolExport: {
      expectSuccess: false,
      deniedMessageIncludes: ['无权限'],
    },
    resumePoolDownloadAttachment: {
      expectSuccess: false,
      deniedMessageIncludes: ['无权限'],
    },
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.THEME15_SMOKE_BASE_URL || '',
    password: process.env.THEME15_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.THEME15_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
    resumeId: parseOptionalNumber(process.env.THEME15_RESUME_ID),
    attachmentId: parseOptionalNumber(process.env.THEME15_ATTACHMENT_ID),
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

    if (current === '--resume-id' && next) {
      options.resumeId = parseOptionalNumber(next);
      index += 1;
      continue;
    }

    if (current === '--attachment-id' && next) {
      options.attachmentId = parseOptionalNumber(next);
      index += 1;
      continue;
    }

    if (current === '--help' || current === '-h') {
      console.log(`Usage: node ${path.relative(process.cwd(), fileURLToPath(import.meta.url))} [options]

Options:
  --base-url, -u       Override backend base URL
  --password, -p       Override login password (default: ${defaultPassword})
  --cache-dir, -c      Override Cool cache directory
  --resume-id          Optional resume ID used by downloadAttachment deny checks
  --attachment-id      Optional attachment ID used by downloadAttachment deny checks
  --help, -h           Show this help message

Environment variables:
  THEME15_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME15_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
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

function printSummary(reporter) {
  const stats = reporter.summary();
  console.log('');
  console.log('Summary');
  console.log(`PASS: ${stats.PASS}`);
  console.log(`FAIL: ${stats.FAIL}`);
  console.log(`SKIP: ${stats.SKIP}`);
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
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

function listItems(responseBody) {
  return responseBody?.data?.list || [];
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
    requiredScopes: theme15RequiredScopes,
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

async function verifyResumePoolPage(reporter, options, user, token) {
  const scope = `${user.username} resumePool:page`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/resumePool/page`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      keyword: '联调-主题15',
    }),
  });

  if (!user.resumePoolPage.expectSuccess) {
    const deniedProblem = validateDeniedResponse(
      response,
      user.resumePoolPage.deniedMessageIncludes
    );
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

  const total = totalFromPage(response.body);
  const list = listItems(response.body);
  reporter.pass(scope, `total=${total} list=${list.length}`);
  return list;
}

async function verifyResumePoolExport(reporter, options, user, token) {
  if (!user.resumePoolExport) {
    return;
  }

  const scope = `${user.username} resumePool:export`;
  const response = await requestJson(`${options.baseUrl}/admin/performance/resumePool/export`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyword: '联调-主题15',
    }),
  });

  if (!user.resumePoolExport.expectSuccess) {
    const deniedProblem = validateDeniedResponse(
      response,
      user.resumePoolExport.deniedMessageIncludes
    );
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  reporter.pass(scope, 'export succeeded');
}

function resolveAttachmentTarget(list, options) {
  const fallback = {
    id: options.resumeId || 1,
    attachmentId: options.attachmentId || 1,
  };

  const firstWithAttachment = list.find(item => {
    const attachments = Array.isArray(item?.attachmentSummaryList)
      ? item.attachmentSummaryList
      : [];
    return item?.id && attachments.length > 0 && attachments[0]?.id;
  });

  if (!firstWithAttachment) {
    return fallback;
  }

  return {
    id: Number(firstWithAttachment.id),
    attachmentId: Number(firstWithAttachment.attachmentSummaryList[0].id),
  };
}

async function verifyResumePoolDownloadAttachment(reporter, options, user, token, list) {
  if (!user.resumePoolDownloadAttachment) {
    return;
  }

  const target = resolveAttachmentTarget(Array.isArray(list) ? list : [], options);
  const scope = `${user.username} resumePool:downloadAttachment`;
  const response = await requestJson(
    `${options.baseUrl}/admin/performance/resumePool/downloadAttachment`,
    {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: target.id,
        attachmentId: target.attachmentId,
      }),
    }
  );

  if (!user.resumePoolDownloadAttachment.expectSuccess) {
    const deniedProblem = validateDeniedResponse(
      response,
      user.resumePoolDownloadAttachment.deniedMessageIncludes
    );
    if (deniedProblem) {
      reporter.fail(scope, deniedProblem);
      return;
    }
    reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
    return;
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return;
  }

  reporter.pass(scope, `download succeeded for id=${target.id} attachmentId=${target.attachmentId}`);
}

async function run() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));

  console.log('Theme-15 resumePool smoke check');
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
      reporter.skip(`${user.username} resumePool:page`, 'skipped because login failed');
      reporter.skip(`${user.username} resumePool:export`, 'skipped because login failed');
      reporter.skip(`${user.username} resumePool:downloadAttachment`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, session.token);
    const pageList = await verifyResumePoolPage(reporter, options, user, session.token);
    await verifyResumePoolExport(reporter, options, user, session.token);
    await verifyResumePoolDownloadAttachment(
      reporter,
      options,
      user,
      session.token,
      pageList
    );
  }

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
