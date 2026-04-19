/**
 * Theme-5 stage-1 smoke for approval-flow.
 * This file verifies permission registration, captcha/login, and the minimum live API path for approval-flow config/detail guards.
 * It does not mutate approval configs, submit source objects, or replace fuller workflow smoke after seeded approval instances exist.
 * Maintenance pitfall: menu permission registration, seeded stage accounts, and approval-flow endpoint semantics must stay aligned.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const successCode = 1000;
const users = [
  { username: 'hr_admin', expectConfigInfo: 'allow' },
  { username: 'manager_rd', expectConfigInfo: 'deny' },
  { username: 'employee_platform', expectConfigInfo: 'deny' },
];

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
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

async function requestJson(url, init = {}) {
  const response = await fetch(url, init);
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  return { status: response.status, body };
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
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Captcha cache file not found for ${captchaId}`);
}

class Reporter {
  constructor() {
    this.failed = false;
  }

  pass(scope, detail) {
    console.log(`[PASS] ${scope} - ${detail}`);
  }

  fail(scope, detail) {
    this.failed = true;
    console.log(`[FAIL] ${scope} - ${detail}`);
  }
}

async function login(baseUrl, cacheDir, username, password, reporter) {
  const captcha = await requestJson(`${baseUrl}/admin/base/open/captcha`);
  const captchaId = captcha.body?.data?.captchaId;
  if (captcha.body?.code !== successCode || !captchaId) {
    reporter.fail(`${username} captcha`, JSON.stringify(captcha.body));
    return null;
  }
  const verifyCode = await readCaptchaValue(cacheDir, captchaId);
  const loginResponse = await requestJson(`${baseUrl}/admin/base/open/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      captchaId,
      verifyCode,
    }),
  });
  if (loginResponse.body?.code !== successCode || !loginResponse.body?.data?.token) {
    reporter.fail(`${username} login`, JSON.stringify(loginResponse.body));
    return null;
  }
  reporter.pass(`${username} login`, 'token acquired');
  return loginResponse.body.data.token;
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.APPROVAL_FLOW_SMOKE_BASE_URL || '',
    password: process.env.APPROVAL_FLOW_SMOKE_PASSWORD || defaultPassword,
    cacheDir: process.env.APPROVAL_FLOW_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
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
  APPROVAL_FLOW_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
      process.exit(0);
    }
  }

  if (!options.baseUrl) {
    throw new Error(
      'Missing target backend base URL. Pass --base-url URL or set APPROVAL_FLOW_SMOKE_BASE_URL.'
    );
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, '');
  return options;
}

async function main() {
  const reporter = new Reporter();
  const options = parseArgs(process.argv.slice(2));
  const baseUrl = options.baseUrl;
  const cacheDir = options.cacheDir;
  const menuContent = fs.readFileSync(
    path.join(projectRoot, 'src/modules/base/menu.json'),
    'utf8'
  );

  console.log('Theme 5 approval-flow smoke');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Cache dir: ${cacheDir}`);

  if (!/performance:approvalFlow:/.test(menuContent)) {
    reporter.fail(
      'permission registration',
      'src/modules/base/menu.json missing performance:approvalFlow:*'
    );
  } else {
    reporter.pass('permission registration', 'approvalFlow permission keys found');
  }

  const tokens = {};
  for (const user of users) {
    tokens[user.username] = await login(
      baseUrl,
      cacheDir,
      user.username,
      options.password,
      reporter
    );
  }

  for (const user of users) {
    const token = tokens[user.username];
    if (!token) {
      continue;
    }
    const response = await requestJson(
      `${baseUrl}/admin/performance/approval-flow/config/info?objectType=assessment`,
      {
        headers: { Authorization: token },
      }
    );
    if (user.expectConfigInfo === 'allow') {
      if (response.body?.code === successCode && response.body?.data?.objectType === 'assessment') {
        reporter.pass(`${user.username} configInfo`, 'assessment config info reachable');
      } else {
        reporter.fail(`${user.username} configInfo`, JSON.stringify(response.body));
      }
      continue;
    }
    const message = String(response.body?.message || '');
    if (response.body?.code !== successCode && message.includes('无权限查看审批流配置')) {
      reporter.pass(`${user.username} configInfo`, `denied as expected: ${message}`);
    } else {
      reporter.fail(`${user.username} configInfo`, JSON.stringify(response.body));
    }
  }

  if (tokens.hr_admin) {
    const response = await requestJson(
      `${baseUrl}/admin/performance/approval-flow/info?id=999999`,
      {
        headers: { Authorization: tokens.hr_admin },
      }
    );
    const message = String(response.body?.message || '');
    if (response.body?.code !== successCode && message.includes('审批实例不存在')) {
      reporter.pass('hr_admin info guard', `missing instance guarded: ${message}`);
    } else {
      reporter.fail('hr_admin info guard', JSON.stringify(response.body));
    }
  }

  if (reporter.failed) {
    console.log('\nConclusion: FAIL');
    process.exit(1);
  }

  console.log('\nConclusion: PASS');
}

main().catch(error => {
  console.error('[FAIL] smoke bootstrap -', error.message);
  process.exit(1);
});
