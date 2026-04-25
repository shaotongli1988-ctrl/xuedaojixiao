#!/usr/bin/env node
/**
 * Stage-2 material-management smoke verification.
 * It only validates the real backend login, menu scope, and Phase-1 material catalog/stock/inbound/issue API chain.
 * It does not seed unrelated modules, open a browser, or replace broader stage-2 smoke coverage.
 * Maintenance pitfall: keep field names, status assertions, and permission checks aligned with material-domain.ts and seed-stage2-performance.mjs.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const defaultPassword = '123456';
const successCode = 1000;

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.STAGE2_SMOKE_BASE_URL || '',
    password: process.env.STAGE2_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.STAGE2_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--base-url' && next) {
      options.baseUrl = next;
      index += 1;
      continue;
    }
    if (current === '--password' && next) {
      options.password = next;
      index += 1;
      continue;
    }
    if (current === '--cache-dir' && next) {
      options.cacheDir = next;
      index += 1;
      continue;
    }
    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${current}`);
  }

  if (!options.baseUrl) {
    throw new Error('Missing backend base URL. Pass --base-url or set STAGE2_SMOKE_BASE_URL.');
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/smoke-stage2-material.mjs [--base-url URL] [--password PASS] [--cache-dir DIR]

Environment:
  STAGE2_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8064
  STAGE2_SMOKE_PASSWORD   Shared password. Default: ${defaultPassword}
  STAGE2_SMOKE_CACHE_DIR  Override cache directory used for captcha lookup
`);
}

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function resolveDefaultCacheDir() {
  const candidate = path.join(process.cwd(), 'src/config/config.default.ts');
  const content = fs.readFileSync(candidate, 'utf8');
  const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
  if (!matched?.[1]) {
    throw new Error('Unable to resolve cache directory from src/config/config.default.ts');
  }
  return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    return this.records.some(item => item.status === 'FAIL');
  }
}

async function requestJson(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

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
        return parsed.val;
      }
    }
    await sleep(100);
  }

  throw new Error(`Captcha cache file not found for ${captchaId} under ${cacheDir}`);
}

function requireSuccess(scope, response) {
  if (response.body?.code !== successCode) {
    throw new Error(`${scope} failed: ${JSON.stringify(response.body)}`);
  }
  return response.body.data;
}

async function login(options, reporter) {
  const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
  const captchaData = requireSuccess('captcha', captchaResponse);
  const verifyCode = await readCaptchaValue(options.cacheDir, captchaData.captchaId);

  const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'hr_admin',
      password: options.password,
      captchaId: captchaData.captchaId,
      verifyCode,
    }),
  });
  const loginData = requireSuccess('login', loginResponse);
  if (!loginData?.token) {
    throw new Error('login succeeded without token');
  }
  reporter.pass('login', 'hr_admin token acquired');
  return loginData.token;
}

async function authJson(options, token, method, route, payload) {
  return requestJson(`${options.baseUrl}${route}`, {
    method,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reporter = new Reporter();
  const token = await login(options, reporter);

  const runtimeMeta = requireSuccess(
    'runtimeMeta',
    await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`)
  );
  reporter.pass('runtimeMeta', `git=${runtimeMeta.gitHash} port=${runtimeMeta.port}`);

  const permmenu = requireSuccess(
    'permmenu',
    await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
      headers: { Authorization: token },
    })
  );
  const routers = JSON.stringify(permmenu.menus || []);
  const perms = new Set(permmenu.perms || []);
  for (const route of [
    '/performance/material/catalog',
    '/performance/material/stock',
    '/performance/material/inbound',
    '/performance/material/issue',
  ]) {
    if (!routers.includes(route)) {
      throw new Error(`missing route ${route}`);
    }
  }
  for (const perm of [
    'performance:materialCatalog:add',
    'performance:materialStock:summary',
    'performance:materialInbound:receive',
    'performance:materialIssue:issue',
  ]) {
    if (!perms.has(perm)) {
      throw new Error(`missing perm ${perm}`);
    }
  }
  reporter.pass('permmenu', 'material routes and perms present');

  const person = requireSuccess(
    'person',
    await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
      headers: { Authorization: token },
    })
  );
  const departmentId = Number(person.departmentId || 0);
  const userId = Number(person.id || 0);
  const assigneeName = person.name || person.nickName || person.username || 'hr_admin';
  if (!departmentId || !userId) {
    throw new Error(`invalid person payload ${JSON.stringify(person)}`);
  }
  reporter.pass('person', `userId=${userId} departmentId=${departmentId}`);

  const uniqueKey = `${Date.now()}`;
  const catalogCode = `MAT-SMOKE-${uniqueKey}`;
  const catalogName = `物资冒烟-${uniqueKey}`;

  const createdCatalog = requireSuccess(
    'materialCatalog:add',
    await authJson(options, token, 'POST', '/admin/performance/materialCatalog/add', {
      code: catalogCode,
      name: catalogName,
      category: '冒烟物资',
      specification: 'Phase1',
      unit: '个',
      safetyStock: 2,
      referenceUnitCost: 15.5,
      remark: 'stage2 material smoke',
    })
  );
  if (createdCatalog.code !== catalogCode) {
    throw new Error(`catalog code mismatch ${createdCatalog.code}`);
  }
  reporter.pass('materialCatalog:add', `catalogId=${createdCatalog.id}`);

  const updatedCatalog = requireSuccess(
    'materialCatalog:update',
    await authJson(options, token, 'POST', '/admin/performance/materialCatalog/update', {
      id: createdCatalog.id,
      code: catalogCode,
      name: `${catalogName}-更新`,
      category: '冒烟物资',
      specification: 'Phase1-Updated',
      unit: '个',
      safetyStock: 3,
      referenceUnitCost: 18,
      remark: 'stage2 material smoke updated',
    })
  );
  if (updatedCatalog.safetyStock !== 3) {
    throw new Error(`catalog update mismatch ${JSON.stringify(updatedCatalog)}`);
  }
  reporter.pass('materialCatalog:update', 'catalog mutable fields persisted');

  const catalogPage = requireSuccess(
    'materialCatalog:page',
    await authJson(options, token, 'POST', '/admin/performance/materialCatalog/page', {
      page: 1,
      size: 20,
      keyword: catalogCode,
    })
  );
  if (!(catalogPage.list || []).some(item => item.code === catalogCode)) {
    throw new Error('catalog page missing created row');
  }
  reporter.pass('materialCatalog:page', 'created catalog visible');

  const createdInbound = requireSuccess(
    'materialInbound:add',
    await authJson(options, token, 'POST', '/admin/performance/materialInbound/add', {
      title: `物资入库冒烟-${uniqueKey}`,
      catalogId: createdCatalog.id,
      departmentId,
      quantity: 6,
      unitCost: 18,
      totalAmount: 108,
      sourceType: 'manual',
      sourceBizId: `SMOKE-IN-${uniqueKey}`,
      remark: 'stage2 material inbound smoke',
    })
  );
  reporter.pass('materialInbound:add', `inboundId=${createdInbound.id}`);

  const updatedInbound = requireSuccess(
    'materialInbound:update',
    await authJson(options, token, 'POST', '/admin/performance/materialInbound/update', {
      id: createdInbound.id,
      title: `物资入库冒烟更新-${uniqueKey}`,
      catalogId: createdCatalog.id,
      departmentId,
      quantity: 8,
      unitCost: 18,
      totalAmount: 144,
      sourceType: 'manual',
      sourceBizId: `SMOKE-IN-${uniqueKey}`,
      remark: 'stage2 material inbound smoke updated',
    })
  );
  if (Number(updatedInbound.quantity) !== 8) {
    throw new Error('inbound update quantity mismatch');
  }
  reporter.pass('materialInbound:update', 'draft update succeeded');

  requireSuccess(
    'materialInbound:submit',
    await authJson(options, token, 'POST', '/admin/performance/materialInbound/submit', {
      id: createdInbound.id,
    })
  );
  const receivedInbound = requireSuccess(
    'materialInbound:receive',
    await authJson(options, token, 'POST', '/admin/performance/materialInbound/receive', {
      id: createdInbound.id,
      receivedAt: '2026-04-19 18:00:00',
      remark: 'stage2 material inbound receive',
    })
  );
  if (receivedInbound.status !== 'received') {
    throw new Error('inbound did not enter received');
  }
  reporter.pass('materialInbound:receive', 'received and stock should increase');

  const stockPageAfterInbound = requireSuccess(
    'materialStock:page after inbound',
    await authJson(options, token, 'POST', '/admin/performance/materialStock/page', {
      page: 1,
      size: 20,
      departmentId,
      keyword: catalogCode,
    })
  );
  const stockRowAfterInbound = (stockPageAfterInbound.list || []).find(
    item => Number(item.catalogId) === Number(createdCatalog.id) && Number(item.departmentId) === departmentId
  );
  if (!stockRowAfterInbound) {
    throw new Error('stock row missing after inbound');
  }
  if (Number(stockRowAfterInbound.currentQty) !== 8 || Number(stockRowAfterInbound.availableQty) !== 8) {
    throw new Error(`stock mismatch after inbound ${JSON.stringify(stockRowAfterInbound)}`);
  }
  reporter.pass('materialStock:page after inbound', 'stock increased to 8/8');

  const createdIssue = requireSuccess(
    'materialIssue:add',
    await authJson(options, token, 'POST', '/admin/performance/materialIssue/add', {
      title: `物资领用冒烟-${uniqueKey}`,
      catalogId: createdCatalog.id,
      departmentId,
      quantity: 3,
      assigneeId: userId,
      assigneeName,
      issueDate: '2026-04-19 18:30:00',
      purpose: 'stage2 material smoke',
      remark: 'stage2 material issue smoke',
    })
  );
  reporter.pass('materialIssue:add', `issueId=${createdIssue.id}`);

  requireSuccess(
    'materialIssue:submit',
    await authJson(options, token, 'POST', '/admin/performance/materialIssue/submit', {
      id: createdIssue.id,
    })
  );
  const issuedResult = requireSuccess(
    'materialIssue:issue',
    await authJson(options, token, 'POST', '/admin/performance/materialIssue/issue', {
      id: createdIssue.id,
      issuedAt: '2026-04-19 19:00:00',
      remark: 'stage2 material issue confirmed',
    })
  );
  if (issuedResult.status !== 'issued') {
    throw new Error('issue did not enter issued');
  }
  reporter.pass('materialIssue:issue', 'issued and stock should decrease');

  const stockPageAfterIssue = requireSuccess(
    'materialStock:page after issue',
    await authJson(options, token, 'POST', '/admin/performance/materialStock/page', {
      page: 1,
      size: 20,
      departmentId,
      keyword: catalogCode,
    })
  );
  const stockRowAfterIssue = (stockPageAfterIssue.list || []).find(
    item => Number(item.catalogId) === Number(createdCatalog.id) && Number(item.departmentId) === departmentId
  );
  if (!stockRowAfterIssue) {
    throw new Error('stock row missing after issue');
  }
  if (
    Number(stockRowAfterIssue.currentQty) !== 5 ||
    Number(stockRowAfterIssue.availableQty) !== 5 ||
    Number(stockRowAfterIssue.issuedQty) !== 3
  ) {
    throw new Error(`stock mismatch after issue ${JSON.stringify(stockRowAfterIssue)}`);
  }
  reporter.pass('materialStock:page after issue', 'stock decreased to 5/5 and issuedQty=3');

  const stockSummary = requireSuccess(
    'materialStock:summary',
    await requestJson(
      `${options.baseUrl}/admin/performance/materialStock/summary?departmentId=${departmentId}`,
      {
        headers: { Authorization: token },
      }
    )
  );
  if (Number(stockSummary.totalAvailableQty) < 5 || Number(stockSummary.stockCount) < 1) {
    throw new Error(`unexpected stock summary ${JSON.stringify(stockSummary)}`);
  }
  reporter.pass('materialStock:summary', `available=${stockSummary.totalAvailableQty}`);

  const issuePage = requireSuccess(
    'materialIssue:page',
    await authJson(options, token, 'POST', '/admin/performance/materialIssue/page', {
      page: 1,
      size: 20,
      departmentId,
      keyword: createdIssue.issueNo,
    })
  );
  if (!(issuePage.list || []).some(item => Number(item.id) === Number(createdIssue.id))) {
    throw new Error('issue page missing created issue');
  }
  reporter.pass('materialIssue:page', 'created issue visible');

  console.log('');
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

main().catch(error => {
  console.error(`[FAIL] material smoke bootstrap - ${error.message}`);
  process.exitCode = 1;
});
