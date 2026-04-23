#!/usr/bin/env node
/**
 * Frontend dev-proxy smoke for material management.
 * It only checks that Vite can proxy runtimeMeta and login traffic to the target backend.
 * It does not drive browser clicks or validate page rendering.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const defaultPassword = '123456';
const defaultFrontendBaseUrl = process.env.MATERIAL_FRONTEND_BASE_URL || 'http://127.0.0.1:5173';

function md5(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex');
}

function resolveDefaultCacheDir() {
  const candidate = path.join(
    process.cwd(),
    '..',
    'cool-admin-midway',
    'src/config/config.default.ts'
  );
  const content = fs.readFileSync(candidate, 'utf8');
  const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
  if (!matched?.[1]) {
    throw new Error('Unable to resolve backend cache directory');
  }
  return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
}

function cacheFilePath(cacheDir, key) {
  return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, init);
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

async function readCaptchaValue(cacheDir, captchaId) {
  const key = `verify:img:${captchaId}`;
  const targetFile = cacheFilePath(cacheDir, key);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (fs.existsSync(targetFile)) {
      const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (parsed?.val) {
        return parsed.val;
      }
    }
    await sleep(100);
  }
  throw new Error(`captcha cache not found for ${captchaId}`);
}

async function main() {
  const frontendBaseUrl = defaultFrontendBaseUrl.replace(/\/+$/, '');
  const cacheDir = process.env.STAGE2_SMOKE_CACHE_DIR || resolveDefaultCacheDir();
  const runtimeMeta = await requestJson(`${frontendBaseUrl}/dev/admin/base/open/runtimeMeta`);
  if (runtimeMeta?.code !== 1000) {
    throw new Error(`frontend runtimeMeta proxy failed: ${JSON.stringify(runtimeMeta)}`);
  }

  const captcha = await requestJson(`${frontendBaseUrl}/dev/admin/base/open/captcha`);
  if (captcha?.code !== 1000 || !captcha?.data?.captchaId) {
    throw new Error(`frontend captcha proxy failed: ${JSON.stringify(captcha)}`);
  }

  const verifyCode = await readCaptchaValue(cacheDir, captcha.data.captchaId);
  const login = await requestJson(`${frontendBaseUrl}/dev/admin/base/open/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'hr_admin',
      password: process.env.STAGE2_SMOKE_PASSWORD || defaultPassword,
      captchaId: captcha.data.captchaId,
      verifyCode,
    }),
  });

  if (login?.code !== 1000 || !login?.data?.token) {
    throw new Error(`frontend login proxy failed: ${JSON.stringify(login)}`);
  }

  console.log(
    `[PASS] frontend material proxy smoke - runtimeMeta/login via ${frontendBaseUrl}/dev succeeded`
  );
}

main().catch(error => {
  console.error(`[FAIL] frontend material proxy smoke - ${error.message}`);
  process.exitCode = 1;
});
