/**
 * Base admin login smoke verification for a live local backend.
 * This file validates captcha -> /admin/base/open/login -> protected admin APIs with the real super-admin account.
 * It does not seed data, start the backend process, or replace broader RBAC regression coverage.
 * Maintenance pitfall: this smoke assumes the local DB keeps the `admin` account bound to an `isSuperAdmin=1` role.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const successCode = 1000;
const defaultBaseUrl =
  process.env.BASE_ADMIN_LOGIN_BASE_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:8006';
const defaultUsername = process.env.BASE_ADMIN_LOGIN_USERNAME || 'admin';
const defaultPassword = process.env.BASE_ADMIN_LOGIN_PASSWORD || '123456';

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function decodeTokenPayload(token) {
  const encoded = String(token || '').split('.')[1];
  if (!encoded) {
    return {};
  }
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
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
      ok: response.ok,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function createJsonHeaders(token) {
  return {
    Authorization: token,
    'Content-Type': 'application/json',
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

  summary() {
    const stats = { PASS: 0, FAIL: 0 };
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
  console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function assertCondition(reporter, scope, condition, detail) {
  if (!condition) {
    reporter.fail(scope, detail);
    return false;
  }
  reporter.pass(scope, detail);
  return true;
}

function parseArgs(argv) {
  const options = {
    baseUrl: defaultBaseUrl,
    username: defaultUsername,
    password: defaultPassword,
    cacheDir: process.env.BASE_ADMIN_LOGIN_CACHE_DIR || resolveDefaultCacheDir(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if ((current === '--base-url' || current === '-u') && next) {
      options.baseUrl = next;
      index += 1;
      continue;
    }
    if ((current === '--username' || current === '-n') && next) {
      options.username = next;
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
  --base-url, -u   Backend base URL (default: ${defaultBaseUrl})
  --username, -n   Login username (default: ${defaultUsername})
  --password, -p   Login password (default: ${defaultPassword})
  --cache-dir, -c  Cool cache directory for captcha lookup
  --help, -h       Show this help message
`);
      process.exit(0);
    }
  }

  options.baseUrl = String(options.baseUrl || '').replace(/\/+$/, '');
  if (!options.baseUrl) {
    throw new Error('Missing backend base URL.');
  }
  if (!options.cacheDir) {
    throw new Error('Missing captcha cache directory.');
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const reporter = new Reporter();

  console.log('Base admin login smoke');
  console.log(`Base URL: ${options.baseUrl}`);
  console.log(`Username: ${options.username}`);
  console.log(`Cache dir: ${options.cacheDir}`);

  const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
  if (captchaResponse.body?.code !== successCode) {
    reporter.fail('captcha', formatResponse(captchaResponse.body));
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  const captchaId = captchaResponse.body?.data?.captchaId;
  if (!assertCondition(reporter, 'captcha', Boolean(captchaId), 'captchaId returned')) {
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  let verifyCode;
  try {
    verifyCode = await readCaptchaValue(options.cacheDir, captchaId);
    reporter.pass('captcha cache', `verifyCode length=${String(verifyCode).length}`);
  } catch (error) {
    reporter.fail('captcha cache', error.message);
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: options.username,
      password: options.password,
      captchaId,
      verifyCode,
    }),
  });

  if (loginResponse.body?.code !== successCode) {
    reporter.fail('login', formatResponse(loginResponse.body));
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  const token = loginResponse.body?.data?.token;
  const permissionMask = loginResponse.body?.data?.permissionMask;
  if (!assertCondition(reporter, 'login token', Boolean(token), 'token issued')) {
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }
  assertCondition(
    reporter,
    'login permissionMask',
    typeof permissionMask === 'string' && permissionMask !== '0',
    `permissionMask=${permissionMask ?? 'missing'}`
  );

  const payload = decodeTokenPayload(token);
  assertCondition(
    reporter,
    'jwt username',
    payload.username === options.username,
    `payload.username=${payload.username ?? 'missing'}`
  );
  assertCondition(
    reporter,
    'jwt admin',
    payload.isAdmin === true,
    `payload.isAdmin=${String(payload.isAdmin)}`
  );
  assertCondition(
    reporter,
    'jwt roles',
    Array.isArray(payload.roleIds) && payload.roleIds.length > 0,
    `roleIds=${JSON.stringify(payload.roleIds ?? null)}`
  );
  assertCondition(
    reporter,
    'jwt permissionMask',
    typeof payload.permissionMask === 'string' && payload.permissionMask !== '0',
    `payload.permissionMask=${payload.permissionMask ?? 'missing'}`
  );

  const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
    headers: { Authorization: token },
  });
  if (personResponse.body?.code !== successCode) {
    reporter.fail('person', formatResponse(personResponse.body));
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }
  assertCondition(
    reporter,
    'person username',
    personResponse.body?.data?.username === options.username,
    `person.username=${personResponse.body?.data?.username ?? 'missing'}`
  );
  assertCondition(
    reporter,
    'person permissionMask',
    typeof personResponse.body?.data?.permissionMask === 'string' &&
      personResponse.body.data.permissionMask !== '0',
    `person.permissionMask=${personResponse.body?.data?.permissionMask ?? 'missing'}`
  );

  const permmenuResponse = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
    headers: createJsonHeaders(token),
  });
  if (permmenuResponse.body?.code !== successCode) {
    reporter.fail('permmenu', formatResponse(permmenuResponse.body));
    printSummary(reporter);
    process.exitCode = 1;
    return;
  }

  const perms = permmenuResponse.body?.data?.perms;
  const menus = permmenuResponse.body?.data?.menus;
  assertCondition(
    reporter,
    'permmenu perms',
    Array.isArray(perms) && perms.length > 0,
    `perms=${Array.isArray(perms) ? perms.length : 'invalid'}`
  );
  assertCondition(
    reporter,
    'permmenu menus',
    Array.isArray(menus) && menus.length > 0,
    `menus=${Array.isArray(menus) ? menus.length : 'invalid'}`
  );

  printSummary(reporter);
  process.exitCode = reporter.hasFailures() ? 1 : 0;
}

main().catch(error => {
  console.error(`[smoke-base-admin-login] FAILED: ${error.message}`);
  process.exitCode = 1;
});
