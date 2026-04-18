/**
 * Theme-11 stage-2 smoke readiness for procurement and supplier management.
 * This file verifies login, permission registration, permmenu role scope, and the minimum live API path for purchaseOrder/supplier.
 * It does not seed theme-11 fixtures, mutate shared config, or replace A/B window verification.
 * Maintenance pitfall: permission keys, sample IDs, and masking expectations must stay aligned with docs 04/05/06/12/24 and the runtime returned by A/B.
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
const defaultBaseUrl = process.env.THEME11_SMOKE_BASE_URL || 'http://127.0.0.1:8006';
const defaultPassword = process.env.THEME11_SMOKE_PASSWORD || '123456';
const successCode = 1000;
const theme11RequiredScopes = ['theme11-procurement-supplier'];
const theme11PermissionKeys = [
  'performance:purchaseOrder:page',
  'performance:purchaseOrder:info',
  'performance:purchaseOrder:add',
  'performance:purchaseOrder:update',
  'performance:purchaseOrder:delete',
  'performance:supplier:page',
  'performance:supplier:info',
  'performance:supplier:add',
  'performance:supplier:update',
  'performance:supplier:delete',
];

const users = [
  {
    username: 'hr_admin',
    permissions: {
      present: theme11PermissionKeys,
      absent: [],
    },
    purchaseOrderPage: 'allow',
    supplierPage: 'allow',
  },
  {
    username: 'manager_rd',
    permissions: {
      present: [
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:supplier:page',
        'performance:supplier:info',
      ],
      absent: [
        'performance:purchaseOrder:delete',
        'performance:supplier:add',
        'performance:supplier:update',
        'performance:supplier:delete',
      ],
    },
    purchaseOrderPage: 'allow',
    supplierPage: 'allow',
  },
  {
    username: 'employee_platform',
    permissions: {
      present: [],
      absent: theme11PermissionKeys,
    },
    purchaseOrderPage: 'deny',
    supplierPage: 'deny',
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

function printSummary(reporter) {
  const stats = reporter.summary();
  console.log('');
  console.log('Summary');
  console.log(`PASS: ${stats.PASS}`);
  console.log(`FAIL: ${stats.FAIL}`);
  console.log(`SKIP: ${stats.SKIP}`);
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function formatResponse(body) {
  if (typeof body === 'string') {
    return body;
  }
  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
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
  throw new Error('Unable to resolve local cache dir');
}

function parseOptionalIntegerEnv(name) {
  const value = process.env[name];
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function buildOptions() {
  return {
    baseUrl: defaultBaseUrl.replace(/\/+$/, ''),
    password: defaultPassword,
    cacheDir: process.env.THEME11_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
    supplierInfoId: parseOptionalIntegerEnv('THEME11_SUPPLIER_INFO_ID'),
    purchaseOrderInfoId: parseOptionalIntegerEnv('THEME11_PURCHASE_ORDER_INFO_ID'),
    activeOrderDeleteId: parseOptionalIntegerEnv('THEME11_ACTIVE_ORDER_DELETE_ID'),
    referencedSupplierDeleteId: parseOptionalIntegerEnv('THEME11_REFERENCED_SUPPLIER_DELETE_ID'),
  };
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
    requiredScopes: theme11RequiredScopes,
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
    if (loginResponse.body?.code !== successCode || !loginResponse.body?.data?.token) {
      reporter.fail(`${username} login`, formatResponse(loginResponse.body));
      return null;
    }
    reporter.pass(`${username} login`, 'token acquired');
    return loginResponse.body.data.token;
  } catch (error) {
    reporter.fail(`${username} captcha-cache`, error.message);
    return null;
  }
}

function readPermissionKeysFromMenu() {
  const menuPath = path.join(projectRoot, 'src/modules/base/menu.json');
  const content = fs.readFileSync(menuPath, 'utf8');
  return {
    menuPath,
    content,
  };
}

function assertPermissionRegistration(reporter) {
  const { menuPath, content } = readPermissionKeysFromMenu();
  const missing = theme11PermissionKeys.filter(key => !content.includes(key));
  if (missing.length) {
    reporter.fail('permission registration', `${menuPath} missing ${missing.join(', ')}`);
    return;
  }
  reporter.pass('permission registration', `${menuPath} contains theme-11 permission keys`);
}

async function verifyPermMenu(reporter, options, user, token) {
  const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
    headers: { Authorization: token },
  });
  if (response.body?.code !== successCode) {
    reporter.fail(`${user.username} permmenu`, formatResponse(response.body));
    return;
  }
  const perms = new Set(response.body?.data?.perms || []);
  const problems = [];
  for (const perm of user.permissions.present) {
    if (!perms.has(perm)) {
      problems.push(`missing perm ${perm}`);
    }
  }
  for (const perm of user.permissions.absent) {
    if (perms.has(perm)) {
      problems.push(`unexpected perm ${perm}`);
    }
  }
  if (problems.length) {
    reporter.fail(`${user.username} permmenu`, problems.join('; '));
    return;
  }
  reporter.pass(`${user.username} permmenu`, `theme11 perms aligned, total perms=${perms.size}`);
}

function validateExpectedOutcome(response, expectation) {
  if (expectation === 'allow') {
    if (response.body?.code !== successCode) {
      return `expected success, got status=${response.status} body=${formatResponse(response.body)}`;
    }
    return null;
  }
  if (response.body?.code === successCode) {
    return 'expected denial but request succeeded';
  }
  return null;
}

async function verifyPageEndpoint(reporter, scope, url, token, expectation, body) {
  const response = await requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const problem = validateExpectedOutcome(response, expectation);
  if (problem) {
    reporter.fail(scope, problem);
    return null;
  }
  reporter.pass(
    scope,
    expectation === 'allow'
      ? `total=${response.body?.data?.pagination?.total ?? response.body?.data?.total ?? 'unknown'}`
      : `denied as expected: status=${response.status}`
  );
  return response.body?.data || null;
}

async function verifyInfoEndpoint(reporter, scope, url, token) {
  const response = await requestJson(url, {
    headers: { Authorization: token },
  });
  if (response.body?.code !== successCode || !response.body?.data) {
    reporter.fail(scope, formatResponse(response.body));
    return null;
  }
  reporter.pass(scope, 'info loaded');
  return response.body.data;
}

function assertMaskedWithLast4(value) {
  return typeof value === 'string' && /^\*+\d{4}$/.test(value);
}

function assertMaskedTaxNo(value, fullValue) {
  if (typeof value !== 'string' || typeof fullValue !== 'string' || fullValue.length < 4) {
    return false;
  }
  return value.startsWith(fullValue.slice(0, 2)) && value.endsWith(fullValue.slice(-2)) && value.includes('*');
}

function assertMaskedContactName(value, fullValue) {
  if (typeof value !== 'string' || typeof fullValue !== 'string' || !fullValue) {
    return false;
  }
  if (value === fullValue) {
    return false;
  }
  return value.startsWith(fullValue[0]) && value.includes('*');
}

function assertMaskedPhone(value, fullValue) {
  if (typeof value !== 'string' || typeof fullValue !== 'string' || fullValue.length < 7) {
    return false;
  }
  return value.startsWith(fullValue.slice(0, 3)) && value.endsWith(fullValue.slice(-4)) && value.includes('*');
}

function assertMaskedEmail(value, fullValue) {
  if (typeof value !== 'string' || typeof fullValue !== 'string') {
    return false;
  }
  const [fullName, fullDomain] = fullValue.split('@');
  const [maskedName, maskedDomain] = value.split('@');
  if (!fullName || !fullDomain || !maskedName || !maskedDomain) {
    return false;
  }
  return maskedName.startsWith(fullName[0]) && maskedName.includes('*') && maskedDomain === fullDomain;
}

function verifyManagerSupplierMasking(reporter, hrData, managerData) {
  const problems = [];
  if (hrData.bankAccount && !assertMaskedWithLast4(managerData.bankAccount)) {
    problems.push('bankAccount not masked as last4');
  }
  if (hrData.taxNo && !assertMaskedTaxNo(managerData.taxNo, hrData.taxNo)) {
    problems.push('taxNo not masked as first2/last2');
  }
  if (hrData.contactName && !assertMaskedContactName(managerData.contactName, hrData.contactName)) {
    problems.push('contactName not masked');
  }
  if (hrData.contactPhone && !assertMaskedPhone(managerData.contactPhone, hrData.contactPhone)) {
    problems.push('contactPhone not masked as 3+4');
  }
  if (hrData.contactEmail && !assertMaskedEmail(managerData.contactEmail, hrData.contactEmail)) {
    problems.push('contactEmail not masked as first-char plus domain');
  }
  if (problems.length) {
    reporter.fail('manager_rd supplier masking', problems.join('; '));
    return;
  }
  reporter.pass('manager_rd supplier masking', 'masked supplier fields aligned with docs/12');
}

async function verifyOptionalInfoChecks(reporter, options, tokens) {
  if (!options.purchaseOrderInfoId) {
    reporter.skip(
      'purchaseOrder info',
      'set THEME11_PURCHASE_ORDER_INFO_ID to verify department-scope purchase order info'
    );
  } else if (tokens.hr_admin) {
    await verifyInfoEndpoint(
      reporter,
      'hr_admin purchaseOrder:info',
      `${options.baseUrl}/admin/performance/purchaseOrder/info?id=${options.purchaseOrderInfoId}`,
      tokens.hr_admin
    );
  }

  if (!options.supplierInfoId) {
    reporter.skip(
      'supplier info masking',
      'set THEME11_SUPPLIER_INFO_ID to compare hr_admin and manager_rd masking'
    );
    return;
  }

  if (!tokens.hr_admin || !tokens.manager_rd) {
    reporter.skip('supplier info masking', 'skipped because hr_admin or manager_rd login failed');
    return;
  }

  const hrData = await verifyInfoEndpoint(
    reporter,
    'hr_admin supplier:info',
    `${options.baseUrl}/admin/performance/supplier/info?id=${options.supplierInfoId}`,
    tokens.hr_admin
  );
  const managerData = await verifyInfoEndpoint(
    reporter,
    'manager_rd supplier:info',
    `${options.baseUrl}/admin/performance/supplier/info?id=${options.supplierInfoId}`,
    tokens.manager_rd
  );

  if (hrData && managerData) {
    verifyManagerSupplierMasking(reporter, hrData, managerData);
  }
}

async function verifyOptionalDeleteGuards(reporter, options, tokens) {
  if (options.activeOrderDeleteId) {
    if (!tokens.hr_admin) {
      reporter.skip('hr_admin purchaseOrder:delete active', 'skipped because hr_admin login failed');
    } else {
      const response = await requestJson(`${options.baseUrl}/admin/performance/purchaseOrder/delete`, {
        method: 'POST',
        headers: {
          Authorization: tokens.hr_admin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [options.activeOrderDeleteId] }),
      });
      if (response.body?.code === successCode) {
        reporter.fail(
          'hr_admin purchaseOrder:delete active',
          'expected draft-only delete guard but request succeeded'
        );
      } else {
        reporter.pass(
          'hr_admin purchaseOrder:delete active',
          `guarded as expected: status=${response.status}`
        );
      }
    }
  } else {
    reporter.skip(
      'purchaseOrder delete guard',
      'set THEME11_ACTIVE_ORDER_DELETE_ID to verify active order delete restriction'
    );
  }

  if (options.referencedSupplierDeleteId) {
    if (!tokens.hr_admin) {
      reporter.skip('hr_admin supplier:delete referenced', 'skipped because hr_admin login failed');
    } else {
      const response = await requestJson(`${options.baseUrl}/admin/performance/supplier/delete`, {
        method: 'POST',
        headers: {
          Authorization: tokens.hr_admin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [options.referencedSupplierDeleteId] }),
      });
      if (response.body?.code === successCode) {
        reporter.fail(
          'hr_admin supplier:delete referenced',
          'expected referenced-supplier delete guard but request succeeded'
        );
      } else {
        reporter.pass(
          'hr_admin supplier:delete referenced',
          `guarded as expected: status=${response.status}`
        );
      }
    }
  } else {
    reporter.skip(
      'supplier delete guard',
      'set THEME11_REFERENCED_SUPPLIER_DELETE_ID to verify referenced supplier delete restriction'
    );
  }
}

async function run() {
  const reporter = new Reporter();
  const options = buildOptions();
  const tokens = {};

  console.log('Theme 11 procurement/supplier smoke');
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

  assertPermissionRegistration(reporter);

  for (const user of users) {
    tokens[user.username] = await fetchCaptchaAndLogin(reporter, options, user.username);
    if (!tokens[user.username]) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} purchaseOrder:page`, 'skipped because login failed');
      reporter.skip(`${user.username} supplier:page`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, tokens[user.username]);
    await verifyPageEndpoint(
      reporter,
      `${user.username} purchaseOrder:page`,
      `${options.baseUrl}/admin/performance/purchaseOrder/page`,
      tokens[user.username],
      user.purchaseOrderPage,
      {
        page: 1,
        size: 10,
      }
    );
    await verifyPageEndpoint(
      reporter,
      `${user.username} supplier:page`,
      `${options.baseUrl}/admin/performance/supplier/page`,
      tokens[user.username],
      user.supplierPage,
      {
        page: 1,
        size: 10,
      }
    );
  }

  await verifyOptionalInfoChecks(reporter, options, tokens);
  await verifyOptionalDeleteGuards(reporter, options, tokens);

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
