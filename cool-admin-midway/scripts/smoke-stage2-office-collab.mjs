/**
 * Theme-22 office-collab smoke verification.
 * This file validates runtime scope, menu visibility, permission keys, and minimum API smoke for annualInspection/honor/publicityMaterial/designCollab/expressCollab.
 * It does not seed business data, patch runtime config, or replace broader stage-2 smoke scripts.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, and theme-22 frozen contracts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  resolveProjectGitHash,
  resolveProjectSourceHash,
  validateStage2RuntimeMeta,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const successCode = 1000;
const theme22RequiredScopes = ['theme22-office-collab'];

const modules = [
  {
    key: 'annualInspection',
    label: '年检材料',
    route: '/performance/office/annual-inspection',
    endpoint: 'annualInspection',
    seedKeyword: '联调-主题22-消防设施年检材料',
    seedTitle: '联调-主题22-消防设施年检材料',
    statsQuery: '主题22',
    createPayload(uniqueId) {
      return {
        materialNo: `PMS-T22-SMOKE-NJ-${uniqueId}`,
        title: `主题22烟测年检材料-${uniqueId}`,
        category: 'equipment',
        department: '行政部',
        ownerName: '主题22烟测',
        dueDate: '2026-12-31',
        completeness: 86,
        version: 'V2.0',
        reminderDays: 10,
        status: 'submitted',
        notes: '主题22烟测新增年检材料',
      };
    },
    updatePayload() {
      return {
        title: '主题22烟测更新年检材料',
        completeness: 92,
        status: 'approved',
      };
    },
    updateAssert(data) {
      return data?.status === 'approved' && Number(data?.completeness) === 92
        ? null
        : 'annualInspection update response mismatch';
    },
    infoAssert() {
      return null;
    },
  },
  {
    key: 'honor',
    label: '荣誉管理',
    route: '/performance/office/honor',
    endpoint: 'honor',
    seedKeyword: '联调-主题22-市级优秀校区荣誉',
    seedTitle: '联调-主题22-市级优秀校区荣誉',
    statsQuery: '主题22',
    createPayload(uniqueId) {
      return {
        honorNo: `PMS-T22-SMOKE-RY-${uniqueId}`,
        title: `主题22烟测荣誉-${uniqueId}`,
        honorType: 'team',
        level: 'city',
        winnerName: '主题22烟测团队',
        department: '校区运营中心',
        issuer: '主题22烟测单位',
        awardedAt: '2026-04-19',
        impactScore: 95,
        status: 'published',
        notes: '主题22烟测新增荣誉',
      };
    },
    updatePayload() {
      return {
        title: '主题22烟测更新荣誉',
        impactScore: 97,
        status: 'published',
      };
    },
    updateAssert(data) {
      return data?.title === '主题22烟测更新荣誉' && Number(data?.impactScore) === 97
        ? null
        : 'honor update response mismatch';
    },
    infoAssert() {
      return null;
    },
    async afterDelete(reporter, options, token, uniqueId) {
      const archivedAdd = await requestJson(
        `${options.baseUrl}/admin/performance/honor/add`,
        {
          method: 'POST',
          headers: createJsonHeaders(token),
          body: JSON.stringify({
            honorNo: `PMS-T22-SMOKE-RY-ARCH-${uniqueId}`,
            title: `主题22归档荣誉-${uniqueId}`,
            honorType: 'individual',
            level: 'departmental',
            winnerName: '主题22归档荣誉获奖人',
            department: '教务部',
            issuer: '主题22烟测单位',
            awardedAt: '2026-04-01',
            impactScore: 80,
            status: 'archived',
          }),
        }
      );
      if (archivedAdd.body?.code !== successCode || !archivedAdd.body?.data?.id) {
        reporter.fail('hr_admin honor:add archived', formatResponse(archivedAdd.body));
        return false;
      }
      const archivedId = Number(archivedAdd.body.data.id);
      reporter.pass('hr_admin honor:add archived', `id=${archivedId}`);

      const archivedUpdate = await requestJson(
        `${options.baseUrl}/admin/performance/honor/update`,
        {
          method: 'POST',
          headers: createJsonHeaders(token),
          body: JSON.stringify({
            id: archivedId,
            title: '归档后禁止修改',
          }),
        }
      );
      const archivedUpdateProblem = validateDeniedResponse(archivedUpdate, [
        '已归档记录不允许更新',
      ]);
      if (archivedUpdateProblem) {
        reporter.fail('hr_admin honor:update archived', archivedUpdateProblem);
        return false;
      }
      reporter.pass(
        'hr_admin honor:update archived',
        `denied as expected: ${formatResponse(archivedUpdate.body)}`
      );

      const archivedDelete = await requestJson(
        `${options.baseUrl}/admin/performance/honor/delete`,
        {
          method: 'POST',
          headers: createJsonHeaders(token),
          body: JSON.stringify({ ids: [archivedId] }),
        }
      );
      const archivedDeleteProblem = validateDeniedResponse(archivedDelete, [
        '已归档记录不允许删除',
      ]);
      if (archivedDeleteProblem) {
        reporter.fail('hr_admin honor:delete archived', archivedDeleteProblem);
        return false;
      }
      reporter.pass(
        'hr_admin honor:delete archived',
        `denied as expected: ${formatResponse(archivedDelete.body)}`
      );

      return true;
    },
  },
  {
    key: 'publicityMaterial',
    label: '宣传资料',
    route: '/performance/office/publicity-material',
    endpoint: 'publicityMaterial',
    seedKeyword: '联调-主题22-春招宣传海报',
    seedTitle: '联调-主题22-春招宣传海报',
    statsQuery: '主题22',
    createPayload(uniqueId, context) {
      return {
        materialNo: `PMS-T22-SMOKE-XC-${uniqueId}`,
        title: `主题22烟测宣传资料-${uniqueId}`,
        materialType: 'poster',
        channel: 'wechat',
        ownerName: '主题22烟测负责人',
        publishDate: '2026-04-25',
        designOwner: '主题22烟测设计',
        status: 'review',
        views: 188,
        downloads: 21,
        relatedDocumentId: context.documentId,
        notes: '主题22烟测新增宣传资料',
      };
    },
    updatePayload() {
      return {
        title: '主题22烟测更新宣传资料',
        status: 'published',
        views: 300,
      };
    },
    updateAssert(data) {
      return data?.status === 'published' && Number(data?.views) === 300
        ? null
        : 'publicityMaterial update response mismatch';
    },
    infoAssert(data) {
      return data?.relatedDocumentSummary?.fileNo
        ? null
        : 'publicityMaterial info missing relatedDocumentSummary';
    },
  },
  {
    key: 'designCollab',
    label: '美工协同',
    route: '/performance/office/design-collab',
    endpoint: 'designCollab',
    seedKeyword: '联调-主题22-招生物料设计协同',
    seedTitle: '联调-主题22-招生物料设计协同',
    statsQuery: '主题22',
    createPayload(uniqueId) {
      return {
        taskNo: `PMS-T22-SMOKE-MG-${uniqueId}`,
        title: `主题22烟测设计协同-${uniqueId}`,
        requesterName: '主题22烟测市场',
        assigneeName: '主题22烟测设计',
        priority: 'urgent',
        dueDate: '2026-05-10',
        progress: 35,
        workload: 2,
        status: 'in_progress',
        relatedMaterialNo: 'PMS-T22-XC-001',
        notes: '主题22烟测新增设计协同',
      };
    },
    updatePayload() {
      return {
        title: '主题22烟测更新设计协同',
        progress: 85,
        status: 'review',
      };
    },
    updateAssert(data) {
      return data?.status === 'review' && Number(data?.progress) === 85
        ? null
        : 'designCollab update response mismatch';
    },
    infoAssert() {
      return null;
    },
  },
  {
    key: 'expressCollab',
    label: '快递协同',
    route: '/performance/office/express-collab',
    endpoint: 'expressCollab',
    seedKeyword: '联调-主题22-校区资料快递协同',
    seedTitle: '联调-主题22-校区资料快递协同',
    statsQuery: '主题22',
    createPayload(uniqueId) {
      return {
        trackingNo: `PMS-T22-SMOKE-KD-${uniqueId}`,
        title: `主题22烟测快递协同-${uniqueId}`,
        orderNo: `PMS-T22-SMOKE-EXP-${uniqueId}`,
        courierCompany: '顺丰',
        serviceLevel: 'express',
        origin: '上海总部',
        destination: '杭州校区',
        senderName: '主题22烟测寄件人',
        receiverName: '主题22烟测收件人',
        etaDate: '2026-05-02',
        lastUpdate: '2026-04-19 11:00:00',
        syncStatus: 'pending',
        lastEvent: '已揽收',
        status: 'in_transit',
        notes: '主题22烟测新增快递协同',
      };
    },
    updatePayload() {
      return {
        title: '主题22烟测更新快递协同',
        syncStatus: 'synced',
        status: 'delivered',
        lastEvent: '已签收',
      };
    },
    updateAssert(data) {
      return data?.status === 'delivered' && data?.syncStatus === 'synced'
        ? null
        : 'expressCollab update response mismatch';
    },
    infoAssert() {
      return null;
    },
  },
];

const theme22Routes = modules.map(item => item.route);
const theme22Perms = modules.flatMap(item =>
  ['page', 'info', 'stats', 'add', 'update', 'delete'].map(
    action => `performance:${item.key}:${action}`
  )
);

const expectedUsers = [
  {
    username: 'hr_admin',
    menu: {
      routesPresent: theme22Routes,
      routesAbsent: [],
      permsPresent: theme22Perms,
      permsAbsent: [],
    },
  },
  {
    username: 'manager_rd',
    menu: {
      routesPresent: [],
      routesAbsent: theme22Routes,
      permsPresent: [],
      permsAbsent: theme22Perms,
    },
  },
  {
    username: 'employee_platform',
    menu: {
      routesPresent: [],
      routesAbsent: theme22Routes,
      permsPresent: [],
      permsAbsent: theme22Perms,
    },
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.THEME22_SMOKE_BASE_URL || '',
    password: process.env.THEME22_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.THEME22_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
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
  --base-url, -u       Override backend base URL
  --password, -p       Override login password (default: ${defaultPassword})
  --cache-dir, -c      Override Cool cache directory
  --help, -h           Show this help message

Environment variables:
  THEME22_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8129
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set THEME22_SMOKE_BASE_URL.'
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
      body = null;
    }
    return {
      status: response.status,
      ok: response.ok,
      body,
      rawText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function formatResponse(body) {
  if (!body || typeof body !== 'object') {
    return 'empty response';
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

function listItems(responseBody) {
  return responseBody?.data?.list || [];
}

function totalFromPage(responseBody) {
  return responseBody?.data?.pagination?.total ?? responseBody?.data?.total ?? 0;
}

function createJsonHeaders(token) {
  return {
    Authorization: token,
    'Content-Type': 'application/json',
  };
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
    requiredScopes: theme22RequiredScopes,
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

async function verifyDeniedPages(reporter, options, username, token) {
  for (const module of modules) {
    const response = await requestJson(
      `${options.baseUrl}/admin/performance/${module.endpoint}/page`,
      {
        method: 'POST',
        headers: createJsonHeaders(token),
        body: JSON.stringify({ page: 1, size: 10 }),
      }
    );
    const deniedProblem = validateDeniedResponse(response, ['无权限']);
    if (deniedProblem) {
      reporter.fail(`${username} ${module.key}:page`, deniedProblem);
      return false;
    }
    reporter.pass(
      `${username} ${module.key}:page`,
      `denied as expected: ${formatResponse(response.body)}`
    );
  }

  return true;
}

async function resolveSupportDocumentId(reporter, options, token) {
  const response = await requestJson(`${options.baseUrl}/admin/performance/documentCenter/page`, {
    method: 'POST',
    headers: createJsonHeaders(token),
    body: JSON.stringify({
      page: 1,
      size: 10,
      keyword: '联调-主题21-入职制度清单',
    }),
  });

  if (response.body?.code !== successCode) {
    reporter.fail('support documentCenter:page', formatResponse(response.body));
    return null;
  }

  const row = listItems(response.body).find(item => item.fileNo === 'PMS-DOC-21-POLICY-001');
  if (!row?.id) {
    reporter.fail('support documentCenter:page', 'missing PMS-DOC-21-POLICY-001');
    return null;
  }

  reporter.pass('support documentCenter:page', `documentId=${row.id}`);
  return Number(row.id);
}

async function verifyModuleCrudFlow(reporter, options, token, module, context) {
  const pageResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/page`,
    {
      method: 'POST',
      headers: createJsonHeaders(token),
      body: JSON.stringify({
        page: 1,
        size: 20,
        keyword: module.seedKeyword,
      }),
    }
  );

  if (pageResponse.body?.code !== successCode) {
    reporter.fail(`hr_admin ${module.key}:page`, formatResponse(pageResponse.body));
    return false;
  }

  const seedRow = listItems(pageResponse.body).find(item => item.title === module.seedTitle);
  if (!seedRow?.id) {
    reporter.fail(`hr_admin ${module.key}:page`, 'seed row missing');
    return false;
  }
  reporter.pass(
    `hr_admin ${module.key}:page`,
    `total=${totalFromPage(pageResponse.body)} seed=${seedRow.id}`
  );

  const infoResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/info?id=${seedRow.id}`,
    {
      headers: { Authorization: token },
    }
  );
  if (infoResponse.body?.code !== successCode) {
    reporter.fail(`hr_admin ${module.key}:info`, formatResponse(infoResponse.body));
    return false;
  }
  const infoProblem = module.infoAssert?.(infoResponse.body?.data, context);
  if (infoProblem) {
    reporter.fail(`hr_admin ${module.key}:info`, infoProblem);
    return false;
  }
  reporter.pass(`hr_admin ${module.key}:info`, `status=${infoResponse.body?.data?.status}`);

  const statsResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/stats?keyword=${encodeURIComponent(module.statsQuery)}`,
    {
      headers: { Authorization: token },
    }
  );
  if (statsResponse.body?.code !== successCode) {
    reporter.fail(`hr_admin ${module.key}:stats`, formatResponse(statsResponse.body));
    return false;
  }
  if (Number(statsResponse.body?.data?.total ?? 0) < 1) {
    reporter.fail(`hr_admin ${module.key}:stats`, 'expected total >= 1');
    return false;
  }
  reporter.pass(
    `hr_admin ${module.key}:stats`,
    `total=${statsResponse.body?.data?.total}`
  );

  const uniqueId = `${Date.now()}-${module.key}`;
  const addResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/add`,
    {
      method: 'POST',
      headers: createJsonHeaders(token),
      body: JSON.stringify(module.createPayload(uniqueId, context)),
    }
  );
  if (addResponse.body?.code !== successCode || !addResponse.body?.data?.id) {
    reporter.fail(`hr_admin ${module.key}:add`, formatResponse(addResponse.body));
    return false;
  }
  const createdId = Number(addResponse.body.data.id);
  reporter.pass(`hr_admin ${module.key}:add`, `id=${createdId}`);

  const updateResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/update`,
    {
      method: 'POST',
      headers: createJsonHeaders(token),
      body: JSON.stringify({
        id: createdId,
        ...module.updatePayload(uniqueId, context),
      }),
    }
  );
  if (updateResponse.body?.code !== successCode) {
    reporter.fail(`hr_admin ${module.key}:update`, formatResponse(updateResponse.body));
    return false;
  }
  const updateProblem = module.updateAssert?.(updateResponse.body?.data, context);
  if (updateProblem) {
    reporter.fail(`hr_admin ${module.key}:update`, updateProblem);
    return false;
  }
  reporter.pass(`hr_admin ${module.key}:update`, `id=${createdId}`);

  const deleteResponse = await requestJson(
    `${options.baseUrl}/admin/performance/${module.endpoint}/delete`,
    {
      method: 'POST',
      headers: createJsonHeaders(token),
      body: JSON.stringify({ ids: [createdId] }),
    }
  );
  if (deleteResponse.body?.code !== successCode) {
    reporter.fail(`hr_admin ${module.key}:delete`, formatResponse(deleteResponse.body));
    return false;
  }
  reporter.pass(`hr_admin ${module.key}:delete`, `id=${createdId}`);

  if (module.afterDelete) {
    return module.afterDelete(reporter, options, token, uniqueId, context);
  }

  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reporter = new Reporter();

  try {
    if (!(await verifyRuntimePreflight(reporter, options))) {
      printSummary(reporter);
      process.exit(1);
    }

    const sessions = new Map();

    for (const user of expectedUsers) {
      const session = await fetchCaptchaAndLogin(reporter, options, user.username);
      if (!session) {
        printSummary(reporter);
        process.exit(1);
      }
      sessions.set(user.username, session);
      await verifyPermMenu(reporter, options, user, session.token);
    }

    for (const username of ['manager_rd', 'employee_platform']) {
      await verifyDeniedPages(reporter, options, username, sessions.get(username).token);
    }

    const hrToken = sessions.get('hr_admin').token;
    const documentId = await resolveSupportDocumentId(reporter, options, hrToken);
    if (!documentId) {
      printSummary(reporter);
      process.exit(1);
    }

    for (const module of modules) {
      const ok = await verifyModuleCrudFlow(
        reporter,
        options,
        hrToken,
        module,
        { documentId }
      );
      if (!ok) {
        printSummary(reporter);
        process.exit(1);
      }
    }

    printSummary(reporter);
    process.exit(reporter.hasFailures() ? 1 : 0);
  } catch (error) {
    reporter.fail('fatal', error.message);
    printSummary(reporter);
    process.exit(1);
  }
}

await main();
