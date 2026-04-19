/**
 * Theme-11 stage-2 smoke readiness for procurement enhancement and supplier management.
 * This file verifies static menu/permission registration, runtime permmenu scope, and the minimum live API path for purchaseOrder/supplier.
 * It also probes inquiry/approval/receipt/report enhancement endpoints when the runtime has already implemented them.
 * Maintenance pitfall: menu routes, permission keys, sample IDs, and masking expectations must stay aligned with menu.json, seed-stage2-performance.mjs, menu.ts, and the Theme11 frozen docs.
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
const theme11RequiredScopes = ['theme11-procurement-supplier'];
const theme11Routes = [
  '/performance/purchase-order',
  '/performance/purchase-inquiry',
  '/performance/purchase-approval',
  '/performance/purchase-execution',
  '/performance/purchase-receipt',
  '/performance/purchase-report',
  '/performance/supplier',
];
const theme11RouteViewPaths = {
  '/performance/purchase-order': 'modules/performance/views/purchase-order/index.vue',
  '/performance/purchase-inquiry': 'modules/performance/views/purchase-inquiry/index.vue',
  '/performance/purchase-approval': 'modules/performance/views/purchase-approval/index.vue',
  '/performance/purchase-execution': 'modules/performance/views/purchase-execution/index.vue',
  '/performance/purchase-receipt': 'modules/performance/views/purchase-receipt/index.vue',
  '/performance/purchase-report': 'modules/performance/views/purchase-report/index.vue',
  '/performance/supplier': 'modules/performance/views/supplier/index.vue',
};
const theme11PermissionKeys = [
  'performance:purchaseOrder:page',
  'performance:purchaseOrder:info',
  'performance:purchaseOrder:add',
  'performance:purchaseOrder:update',
  'performance:purchaseOrder:delete',
  'performance:purchaseOrder:submitInquiry',
  'performance:purchaseOrder:submitApproval',
  'performance:purchaseOrder:approve',
  'performance:purchaseOrder:reject',
  'performance:purchaseOrder:receive',
  'performance:purchaseOrder:close',
  'performance:supplier:page',
  'performance:supplier:info',
  'performance:supplier:add',
  'performance:supplier:update',
  'performance:supplier:delete',
  'performance:purchaseReport:summary',
  'performance:purchaseReport:trend',
  'performance:purchaseReport:supplierStats',
];

const users = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: theme11Routes,
      routesAbsent: [],
      permsPresent: theme11PermissionKeys,
      permsAbsent: [],
    },
    purchaseOrderPage: 'allow',
    supplierPage: 'allow',
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: theme11Routes,
      routesAbsent: [],
      permsPresent: [
        'performance:purchaseOrder:page',
        'performance:purchaseOrder:info',
        'performance:purchaseOrder:add',
        'performance:purchaseOrder:update',
        'performance:purchaseOrder:submitInquiry',
        'performance:purchaseOrder:submitApproval',
        'performance:purchaseOrder:approve',
        'performance:purchaseOrder:reject',
        'performance:purchaseOrder:receive',
        'performance:purchaseOrder:close',
        'performance:supplier:page',
        'performance:supplier:info',
        'performance:purchaseReport:summary',
        'performance:purchaseReport:trend',
        'performance:purchaseReport:supplierStats',
      ],
      permsAbsent: [
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
    menu: {
      routesPresent: [],
      routesAbsent: theme11Routes,
      permsPresent: [],
      permsAbsent: theme11PermissionKeys,
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

function firstDefinedIntegerEnv(names) {
  for (const name of names) {
    const value = parseOptionalIntegerEnv(name);
    if (value) {
      return value;
    }
  }
  return null;
}

function buildOptions(argv = []) {
  const options = {
    baseUrl: process.env.THEME11_SMOKE_BASE_URL || '',
    password: process.env.THEME11_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.THEME11_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
    supplierInfoId: firstDefinedIntegerEnv(['THEME11_SUPPLIER_INFO_ID']),
    purchaseOrderInfoId: firstDefinedIntegerEnv(['THEME11_PURCHASE_ORDER_INFO_ID']),
    protectedOrderDeleteId: firstDefinedIntegerEnv([
      'THEME11_PROTECTED_ORDER_DELETE_ID',
      'THEME11_ACTIVE_ORDER_DELETE_ID',
    ]),
    referencedSupplierDeleteId: firstDefinedIntegerEnv([
      'THEME11_REFERENCED_SUPPLIER_DELETE_ID',
    ]),
    inquiryOrderId: firstDefinedIntegerEnv(['THEME11_INQUIRY_ORDER_ID']),
    pendingApprovalOrderId: firstDefinedIntegerEnv(['THEME11_PENDING_APPROVAL_ORDER_ID']),
    approvedOrderId: firstDefinedIntegerEnv(['THEME11_APPROVED_ORDER_ID']),
    receivedOrderId: firstDefinedIntegerEnv(['THEME11_RECEIVED_ORDER_ID']),
    closedOrderId: firstDefinedIntegerEnv(['THEME11_CLOSED_ORDER_ID']),
    procurementSampleDepartmentId: firstDefinedIntegerEnv([
      'THEME11_PROCUREMENT_SAMPLE_DEPARTMENT_ID',
    ]),
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
  THEME11_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME11_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
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

function flattenMenuNodes(menus = [], output = []) {
  for (const menu of menus) {
    if (!menu || typeof menu !== 'object') {
      continue;
    }
    output.push(menu);
    flattenMenuNodes(menu.childMenus || [], output);
  }
  return output;
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

function collectMenuPerms(menus = []) {
  const perms = new Set();
  for (const node of flattenMenuNodes(menus)) {
    const values = String(node?.perms || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    for (const value of values) {
      perms.add(value);
    }
  }
  return perms;
}

function decodeTokenPayload(token) {
  const encoded = String(token || '').split('.')[1];
  if (!encoded) {
    return {};
  }
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

function isMissingRouteResponse(response) {
  const message =
    typeof response.body === 'string'
      ? response.body
      : String(response.body?.message || response.body?.msg || '');
  return (
    response.status === 404 ||
    response.status === 405 ||
    /Cannot (GET|POST|PUT|DELETE)/.test(message) ||
    /Not Found/i.test(message)
  );
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

function readMenuArtifacts() {
  const menuJsonPath = path.join(projectRoot, 'src/modules/base/menu.json');
  const vueMenuStorePath = path.resolve(
    projectRoot,
    '../cool-admin-vue/src/modules/base/store/menu.ts'
  );
  return {
    menuJsonPath,
    vueMenuStorePath,
    menuTree: JSON.parse(fs.readFileSync(menuJsonPath, 'utf8')),
    vueMenuStoreContent: fs.readFileSync(vueMenuStorePath, 'utf8'),
  };
}

function assertStaticMenuRegistration(reporter) {
  const { menuJsonPath, menuTree } = readMenuArtifacts();
  const nodes = flattenMenuNodes(menuTree);
  const nodeByRoute = new Map(
    nodes.filter(node => node?.router).map(node => [node.router, node])
  );
  const perms = collectMenuPerms(menuTree);
  const problems = [];

  for (const route of theme11Routes) {
    const node = nodeByRoute.get(route);
    if (!node) {
      problems.push(`missing route ${route}`);
      continue;
    }
    const expectedViewPath = theme11RouteViewPaths[route];
    if (expectedViewPath && node.viewPath !== expectedViewPath) {
      problems.push(
        `route ${route} expected viewPath ${expectedViewPath} got ${node.viewPath || 'empty'}`
      );
    }
  }

  for (const perm of theme11PermissionKeys) {
    if (!perms.has(perm)) {
      problems.push(`missing perm ${perm}`);
    }
  }

  if (problems.length) {
    reporter.fail('menu.json registration', `${menuJsonPath} ${problems.join('; ')}`);
    return;
  }

  reporter.pass(
    'menu.json registration',
    `${menuJsonPath} contains Theme11 enhancement routes and permission keys`
  );
}

function assertProcurementGroupPathsRegistration(reporter) {
  const { vueMenuStorePath, vueMenuStoreContent } = readMenuArtifacts();
  const missing = theme11Routes.filter(route => !vueMenuStoreContent.includes(route));
  if (missing.length) {
    reporter.fail(
      'menu.ts procurement paths',
      `${vueMenuStorePath} missing ${missing.join(', ')}`
    );
    return;
  }
  reporter.pass(
    'menu.ts procurement paths',
    `${vueMenuStorePath} contains Theme11 procurement group paths`
  );
}

async function verifyRuntimePreflight(reporter, options) {
  const response = await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`);

  if (response.body?.code !== successCode) {
    reporter.fail('runtimeMeta', formatResponse(response.body));
    return null;
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
    return null;
  }

  reporter.pass(
    'runtimeMeta',
    `git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version}`
  );
  return runtimeMeta;
}

function applyRuntimeSeedDefaults(options, runtimeMeta) {
  const seedMeta = runtimeMeta?.seedMeta || {};
  options.supplierInfoId ||= Number(seedMeta.theme11SupplierInfoId || 0) || null;
  options.purchaseOrderInfoId ||= Number(seedMeta.theme11PurchaseOrderInfoId || 0) || null;
  options.protectedOrderDeleteId ||= Number(seedMeta.theme11ProtectedOrderDeleteId || 0) || null;
  options.referencedSupplierDeleteId ||=
    Number(seedMeta.theme11ReferencedSupplierDeleteId || 0) || null;
  options.inquiryOrderId ||= Number(seedMeta.theme11InquiryOrderId || 0) || null;
  options.pendingApprovalOrderId ||= Number(seedMeta.theme11PendingApprovalOrderId || 0) || null;
  options.approvedOrderId ||= Number(seedMeta.theme11ApprovedOrderId || 0) || null;
  options.receivedOrderId ||= Number(seedMeta.theme11ReceivedOrderId || 0) || null;
  options.closedOrderId ||= Number(seedMeta.theme11ClosedOrderId || 0) || null;
  options.procurementSampleDepartmentId ||=
    Number(seedMeta.theme11ProcurementSampleDepartmentId || 0) || null;
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

    const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
      headers: { Authorization: token },
    });
    if (personResponse.body?.code !== successCode) {
      reporter.fail(`${username} person`, formatResponse(personResponse.body));
      return null;
    }

    reporter.pass(
      `${username} login`,
      `token acquired departmentId=${personResponse.body?.data?.departmentId ?? 'unknown'}`
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

async function verifyPermMenu(reporter, options, user, session) {
  const scope = `${user.username} permmenu`;
  const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
    headers: { Authorization: session.token },
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

async function verifyPageEndpoint(reporter, scope, url, session, expectation, body) {
  const response = await requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: session.token,
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

async function verifyInfoEndpoint(reporter, scope, url, session) {
  const response = await requestJson(url, {
    headers: { Authorization: session.token },
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
  return (
    value.startsWith(fullValue.slice(0, 2)) &&
    value.endsWith(fullValue.slice(-2)) &&
    value.includes('*')
  );
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
  return (
    value.startsWith(fullValue.slice(0, 3)) &&
    value.endsWith(fullValue.slice(-4)) &&
    value.includes('*')
  );
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
  return (
    maskedName.startsWith(fullName[0]) &&
    maskedName.includes('*') &&
    maskedDomain === fullDomain
  );
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

async function verifyOptionalInfoChecks(reporter, options, sessions) {
  if (!options.purchaseOrderInfoId) {
    reporter.skip(
      'purchaseOrder info',
      'runtimeMeta.seedMeta.theme11PurchaseOrderInfoId missing and no THEME11_PURCHASE_ORDER_INFO_ID provided'
    );
  } else if (sessions.hr_admin) {
    await verifyInfoEndpoint(
      reporter,
      'hr_admin purchaseOrder:info',
      `${options.baseUrl}/admin/performance/purchaseOrder/info?id=${options.purchaseOrderInfoId}`,
      sessions.hr_admin
    );
  }

  if (!options.supplierInfoId) {
    reporter.skip(
      'supplier info masking',
      'runtimeMeta.seedMeta.theme11SupplierInfoId missing and no THEME11_SUPPLIER_INFO_ID provided'
    );
    return;
  }

  if (!sessions.hr_admin || !sessions.manager_rd) {
    reporter.skip('supplier info masking', 'skipped because hr_admin or manager_rd login failed');
    return;
  }

  const hrData = await verifyInfoEndpoint(
    reporter,
    'hr_admin supplier:info',
    `${options.baseUrl}/admin/performance/supplier/info?id=${options.supplierInfoId}`,
    sessions.hr_admin
  );
  const managerData = await verifyInfoEndpoint(
    reporter,
    'manager_rd supplier:info',
    `${options.baseUrl}/admin/performance/supplier/info?id=${options.supplierInfoId}`,
    sessions.manager_rd
  );

  if (hrData && managerData) {
    verifyManagerSupplierMasking(reporter, hrData, managerData);
  }
}

async function verifyOptionalDeleteGuards(reporter, options, sessions) {
  if (options.protectedOrderDeleteId) {
    if (!sessions.hr_admin) {
      reporter.skip('hr_admin purchaseOrder:delete protected', 'skipped because hr_admin login failed');
    } else {
      const response = await requestJson(`${options.baseUrl}/admin/performance/purchaseOrder/delete`, {
        method: 'POST',
        headers: {
          Authorization: sessions.hr_admin.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [options.protectedOrderDeleteId] }),
      });

      if (response.body?.code === successCode) {
        reporter.fail(
          'hr_admin purchaseOrder:delete protected',
          'expected draft-only delete guard but request succeeded'
        );
      } else {
        reporter.pass(
          'hr_admin purchaseOrder:delete protected',
          `guarded as expected: status=${response.status}`
        );
      }
    }
  } else {
    reporter.skip(
      'purchaseOrder delete guard',
      'runtimeMeta.seedMeta.theme11ProtectedOrderDeleteId missing and no delete-guard env provided'
    );
  }

  if (options.referencedSupplierDeleteId) {
    if (!sessions.hr_admin) {
      reporter.skip('hr_admin supplier:delete referenced', 'skipped because hr_admin login failed');
    } else {
      const response = await requestJson(`${options.baseUrl}/admin/performance/supplier/delete`, {
        method: 'POST',
        headers: {
          Authorization: sessions.hr_admin.token,
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
      'runtimeMeta.seedMeta.theme11ReferencedSupplierDeleteId missing and no delete-guard env provided'
    );
  }
}

function buildTemporaryOrderPayload(session, options) {
  const requesterId = Number(session?.payload?.userId || session?.person?.userId || 0);
  const departmentId = Number(session?.person?.departmentId || session?.payload?.departmentId || 0);
  return {
    title: `Theme11 smoke temp ${Date.now()}`,
    supplierId: options.supplierInfoId,
    departmentId,
    requesterId,
    orderDate: '2026-05-20',
    expectedDeliveryDate: '2026-05-31',
    totalAmount: 999.99,
    currency: 'CNY',
    remark: 'Theme11 smoke temp order',
  };
}

async function createTemporaryOrder(reporter, options, session) {
  const payload = buildTemporaryOrderPayload(session, options);
  if (!payload.supplierId || !payload.departmentId || !payload.requesterId) {
    reporter.skip(
      'manager_rd purchaseOrder:add chain seed',
      `missing seed context supplierId=${payload.supplierId || 0} departmentId=${payload.departmentId || 0} requesterId=${payload.requesterId || 0}`
    );
    return null;
  }

  const response = await requestJson(`${options.baseUrl}/admin/performance/purchaseOrder/add`, {
    method: 'POST',
    headers: {
      Authorization: session.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.body?.code !== successCode || !response.body?.data?.id) {
    reporter.fail('manager_rd purchaseOrder:add chain seed', formatResponse(response.body));
    return null;
  }

  reporter.pass(
    'manager_rd purchaseOrder:add chain seed',
    `id=${response.body.data.id} status=${response.body.data.status || 'unknown'}`
  );
  return response.body.data;
}

async function deleteOrderIfStillDraft(reporter, options, session, id) {
  if (!session || !id) {
    return;
  }

  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/purchaseOrder/info?id=${id}`,
    {
      headers: { Authorization: session.token },
    }
  );

  if (infoResponse.body?.code !== successCode || infoResponse.body?.data?.status !== 'draft') {
    return;
  }

  await requestJson(`${options.baseUrl}/admin/performance/purchaseOrder/delete`, {
    method: 'POST',
    headers: {
      Authorization: session.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: [id] }),
  });
  reporter.pass('purchaseOrder chain cleanup', `deleted draft temp order ${id}`);
}

async function invokeOptionalPurchaseOrderAction(
  reporter,
  options,
  scope,
  session,
  pathName,
  payload,
  expectedStatus
) {
  const response = await requestJson(`${options.baseUrl}/admin/performance/purchaseOrder/${pathName}`, {
    method: 'POST',
    headers: {
      Authorization: session.token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (isMissingRouteResponse(response)) {
    reporter.skip(scope, `endpoint not available: /admin/performance/purchaseOrder/${pathName}`);
    return 'missing';
  }

  if (response.body?.code !== successCode) {
    reporter.fail(scope, formatResponse(response.body));
    return 'failed';
  }

  let actualStatus = response.body?.data?.status || null;
  if (!actualStatus && payload.id) {
    const infoResponse = await requestJson(
      `${options.baseUrl}/admin/performance/purchaseOrder/info?id=${payload.id}`,
      {
        headers: { Authorization: session.token },
      }
    );
    if (infoResponse.body?.code === successCode) {
      actualStatus = infoResponse.body?.data?.status || null;
    }
  }

  if (expectedStatus && actualStatus && actualStatus !== expectedStatus) {
    reporter.fail(scope, `expected status ${expectedStatus}, got ${actualStatus}`);
    return 'failed';
  }

  reporter.pass(scope, expectedStatus ? `status=${actualStatus || expectedStatus}` : 'ok');
  return 'passed';
}

async function verifyEnhancedLifecycleChain(reporter, options, sessions) {
  if (!sessions.manager_rd || !sessions.hr_admin) {
    reporter.skip('theme11 enhanced chain', 'skipped because manager_rd or hr_admin login failed');
    return;
  }

  if (!options.supplierInfoId) {
    reporter.skip(
      'theme11 enhanced chain',
      'runtimeMeta.seedMeta.theme11SupplierInfoId missing and no THEME11_SUPPLIER_INFO_ID provided'
    );
    return;
  }

  const tempOrder = await createTemporaryOrder(reporter, options, sessions.manager_rd);
  if (!tempOrder?.id) {
    return;
  }

  const steps = [
    {
      scope: 'manager_rd purchaseOrder:submitInquiry',
      session: sessions.manager_rd,
      pathName: 'submitInquiry',
      payload: {
        id: tempOrder.id,
        inquiryRemark: 'Theme11 smoke submit inquiry',
        remark: 'Theme11 smoke submit inquiry',
      },
      expectedStatus: 'inquiring',
    },
    {
      scope: 'manager_rd purchaseOrder:submitApproval',
      session: sessions.manager_rd,
      pathName: 'submitApproval',
      payload: {
        id: tempOrder.id,
        approvalRemark: 'Theme11 smoke submit approval',
        remark: 'Theme11 smoke submit approval',
      },
      expectedStatus: 'pendingApproval',
    },
    {
      scope: 'hr_admin purchaseOrder:approve',
      session: sessions.hr_admin,
      pathName: 'approve',
      payload: {
        id: tempOrder.id,
        approvalRemark: 'Theme11 smoke approve',
        remark: 'Theme11 smoke approve',
      },
      expectedStatus: 'approved',
    },
    {
      scope: 'manager_rd purchaseOrder:receive',
      session: sessions.manager_rd,
      pathName: 'receive',
      payload: {
        id: tempOrder.id,
        receivedQuantity: 1,
        receivedAt: '2026-05-21 10:00:00',
        receiveDate: '2026-05-21 10:00:00',
        remark: 'Theme11 smoke receive',
      },
      expectedStatus: 'received',
    },
    {
      scope: 'manager_rd purchaseOrder:close',
      session: sessions.manager_rd,
      pathName: 'close',
      payload: {
        id: tempOrder.id,
        closedReason: 'Theme11 smoke close',
        remark: 'Theme11 smoke close',
      },
      expectedStatus: 'closed',
    },
  ];

  for (const step of steps) {
    const result = await invokeOptionalPurchaseOrderAction(
      reporter,
      options,
      step.scope,
      step.session,
      step.pathName,
      step.payload,
      step.expectedStatus
    );

    if (result === 'missing') {
      break;
    }

    if (result === 'failed') {
      break;
    }
  }

  await deleteOrderIfStillDraft(reporter, options, sessions.hr_admin, tempOrder.id);
}

function toQueryString(query) {
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value)]);
  return new URLSearchParams(pairs).toString();
}

async function requestReportEndpoint(url, token, query) {
  const queryString = toQueryString(query);
  const getUrl = queryString ? `${url}?${queryString}` : url;
  const getResponse = await requestJson(getUrl, {
    headers: { Authorization: token },
  });

  if (getResponse.body?.code === successCode) {
    return { response: getResponse, method: 'GET' };
  }

  if (!isMissingRouteResponse(getResponse)) {
    return { response: getResponse, method: 'GET' };
  }

  const postResponse = await requestJson(url, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  return { response: postResponse, method: 'POST' };
}

async function verifyPurchaseReportEndpoints(reporter, options, sessions) {
  if (!sessions.manager_rd) {
    reporter.skip('theme11 purchaseReport', 'skipped because manager_rd login failed');
    return;
  }

  const query = {
    departmentId: options.procurementSampleDepartmentId || sessions.manager_rd.person?.departmentId,
    startDate: '2026-05-01',
    endDate: '2026-05-31',
  };

  const endpoints = [
    { pathName: 'summary', scope: 'manager_rd purchaseReport:summary' },
    { pathName: 'trend', scope: 'manager_rd purchaseReport:trend' },
    { pathName: 'supplierStats', scope: 'manager_rd purchaseReport:supplierStats' },
  ];

  for (const endpoint of endpoints) {
    const { response, method } = await requestReportEndpoint(
      `${options.baseUrl}/admin/performance/purchaseReport/${endpoint.pathName}`,
      sessions.manager_rd.token,
      query
    );

    if (isMissingRouteResponse(response)) {
      reporter.skip(
        endpoint.scope,
        `endpoint not available: /admin/performance/purchaseReport/${endpoint.pathName}`
      );
      continue;
    }

    if (response.body?.code !== successCode) {
      reporter.fail(endpoint.scope, formatResponse(response.body));
      continue;
    }

    reporter.pass(endpoint.scope, `${method} success`);
  }
}

async function run() {
  const reporter = new Reporter();
  const options = buildOptions(process.argv.slice(2));
  const sessions = {};

  console.log('Theme 11 procurement enhancement smoke');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Cache Dir: ${options.cacheDir}`);

  const runtimeMeta = await verifyRuntimePreflight(reporter, options);
  if (!runtimeMeta) {
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  applyRuntimeSeedDefaults(options, runtimeMeta);

  if (!fs.existsSync(options.cacheDir)) {
    reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
  }

  assertStaticMenuRegistration(reporter);
  assertProcurementGroupPathsRegistration(reporter);

  for (const user of users) {
    sessions[user.username] = await fetchCaptchaAndLogin(reporter, options, user.username);

    if (!sessions[user.username]) {
      reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
      reporter.skip(`${user.username} purchaseOrder:page`, 'skipped because login failed');
      reporter.skip(`${user.username} supplier:page`, 'skipped because login failed');
      continue;
    }

    await verifyPermMenu(reporter, options, user, sessions[user.username]);
    await verifyPageEndpoint(
      reporter,
      `${user.username} purchaseOrder:page`,
      `${options.baseUrl}/admin/performance/purchaseOrder/page`,
      sessions[user.username],
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
      sessions[user.username],
      user.supplierPage,
      {
        page: 1,
        size: 10,
      }
    );
  }

  await verifyOptionalInfoChecks(reporter, options, sessions);
  await verifyOptionalDeleteGuards(reporter, options, sessions);
  await verifyEnhancedLifecycleChain(reporter, options, sessions);
  await verifyPurchaseReportEndpoints(reporter, options, sessions);

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
  console.error(`[FATAL] ${error.message}`);
  process.exitCode = 1;
});
