/**
 * Rebuilds and refreshes the latest local backend on a target port, then seeds and verifies it.
 * This file coordinates build, port cleanup, fresh start, runtime fingerprint check, seed replay, and smoke.
 * It is not responsible for changing business data semantics, selecting theme-specific fixture IDs, or managing production deployment.
 * Maintenance pitfall: keep the default smoke script and runtime fingerprint expectations aligned with stage2-runtime-meta.mjs and delivery docs.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  resolveProjectGitHash,
  resolveProjectSourceHash,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function parseInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const options = {
    port: parseInteger(process.env.LATEST_RESET_PORT ?? process.env.PORT, 8006),
    startTimeoutMs: parseInteger(
      process.env.LATEST_RESET_START_TIMEOUT_MS,
      45000
    ),
    baseUrl: '',
    seedScript:
      process.env.LATEST_RESET_SEED_SCRIPT || './scripts/seed-stage2-performance.mjs',
    smokeScript:
      process.env.LATEST_RESET_SMOKE_SCRIPT || './scripts/smoke-stage2-performance.mjs',
    killAll: process.env.LATEST_RESET_KILL_ALL === '1',
    skipBuild: process.env.LATEST_RESET_SKIP_BUILD === '1',
    logPath: process.env.LATEST_RESET_LOG_PATH || '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if ((current === '--port' || current === '-p') && next) {
      options.port = parseInteger(next, options.port);
      index += 1;
      continue;
    }

    if (current === '--start-timeout-ms' && next) {
      options.startTimeoutMs = parseInteger(next, options.startTimeoutMs);
      index += 1;
      continue;
    }

    if (current === '--seed-script' && next) {
      options.seedScript = next;
      index += 1;
      continue;
    }

    if (current === '--smoke-script' && next) {
      options.smokeScript = next;
      index += 1;
      continue;
    }

    if (current === '--kill-all') {
      options.killAll = true;
      continue;
    }

    if (current === '--skip-build') {
      options.skipBuild = true;
      continue;
    }

    if (current === '--log-path' && next) {
      options.logPath = next;
      index += 1;
      continue;
    }

    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  options.baseUrl = `http://127.0.0.1:${options.port}`;
  if (!options.logPath) {
    options.logPath = path.join('/tmp', `cool-admin-latest-${options.port}.log`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/latest-reset-and-verify.mjs [options]

Options:
  --port, -p             Target backend port. Default: 8006
  --start-timeout-ms     Wait time for fresh backend startup. Default: 45000
  --seed-script          Seed script path. Default: ./scripts/seed-stage2-performance.mjs
  --smoke-script         Smoke script path. Default: ./scripts/smoke-stage2-performance.mjs
  --kill-all             Stop all same-repo backend listeners before restart
  --skip-build           Skip npm run build
  --log-path             Override backend log path
  --help, -h             Show help

Environment:
  LATEST_RESET_PORT
  LATEST_RESET_START_TIMEOUT_MS
  LATEST_RESET_SEED_SCRIPT
  LATEST_RESET_SMOKE_SCRIPT
  LATEST_RESET_KILL_ALL=1
  LATEST_RESET_SKIP_BUILD=1
  LATEST_RESET_LOG_PATH

This command runs:
  local-db start -> optional build -> dev-port-guard cleanup -> npm start -> runtimeMeta wait -> seed -> smoke
`);
}

function logStep(message) {
  console.log(`[latest-reset] ${message}`);
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      env: options.env || process.env,
      stdio: options.stdio || 'inherit',
      detached: options.detached || false,
    });

    if (options.detached) {
      child.unref();
      resolve({ pid: child.pid });
      return;
    }

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) {
        resolve({ code });
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(' ')} failed with exit code ${code}`
        )
      );
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function readLogTail(logPath, maxBytes = 4000) {
  if (!fs.existsSync(logPath)) {
    return `log file not found: ${logPath}`;
  }
  const content = fs.readFileSync(logPath, 'utf8');
  return content.slice(-maxBytes);
}

async function fetchRuntimeMeta(baseUrl) {
  const response = await fetch(`${baseUrl}/admin/base/open/runtimeMeta`);
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch (error) {
    body = raw;
  }
  return {
    status: response.status,
    body,
  };
}

function validateFreshRuntime(runtimeMeta, options) {
  const problems = [];
  const expectedGitHash = resolveProjectGitHash(projectRoot);
  const expectedSourceHash = resolveProjectSourceHash(projectRoot);

  if (!runtimeMeta || typeof runtimeMeta !== 'object') {
    return ['runtimeMeta payload missing'];
  }

  if (runtimeMeta.gitHash !== expectedGitHash) {
    problems.push(
      `gitHash mismatch expected ${expectedGitHash} got ${runtimeMeta.gitHash || 'empty'}`
    );
  }

  if (runtimeMeta.sourceHash !== expectedSourceHash) {
    problems.push(
      `sourceHash mismatch expected ${expectedSourceHash} got ${runtimeMeta.sourceHash || 'empty'}`
    );
  }

  if (Number(runtimeMeta.port) !== options.port) {
    problems.push(
      `port mismatch expected ${options.port} got ${runtimeMeta.port || 'empty'}`
    );
  }

  return problems;
}

async function waitForFreshRuntime(options) {
  const deadline = Date.now() + options.startTimeoutMs;
  let lastBody;

  while (Date.now() < deadline) {
    try {
      const response = await fetchRuntimeMeta(options.baseUrl);
      lastBody = response.body;
      if (response.body?.code === 1000 && response.body?.data) {
        const problems = validateFreshRuntime(response.body.data, options);
        if (!problems.length) {
          return response.body.data;
        }
      }
    } catch (error) {
      lastBody = error.message;
    }
    await sleep(1000);
  }

  const logTail = readLogTail(options.logPath);
  throw new Error(
    `fresh runtime did not become ready on ${options.baseUrl} within ${options.startTimeoutMs}ms.\nlastRuntimeMeta=${JSON.stringify(
      lastBody
    )}\nlogTail:\n${logTail}`
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const backendEnv = {
    ...process.env,
    PORT: String(options.port),
  };

  logStep(`target port=${options.port} baseUrl=${options.baseUrl}`);
  logStep('ensuring local database');
  await spawnCommand(process.execPath, ['./scripts/local-db.mjs', 'start']);

  if (!options.skipBuild) {
    logStep('running npm run build');
    await spawnCommand(npmCommand, ['run', 'build']);
  }

  logStep(
    options.killAll
      ? 'freeing all same-repo backend listeners'
      : `freeing latest port ${options.port}`
  );
  await spawnCommand(
    process.execPath,
    [
      './scripts/dev-port-guard.mjs',
      options.killAll ? '--kill-all' : '--kill',
    ],
    { env: backendEnv }
  );

  fs.mkdirSync(path.dirname(options.logPath), { recursive: true });
  fs.writeFileSync(options.logPath, '');

  logStep(`starting fresh backend -> ${options.logPath}`);
  const logFd = fs.openSync(options.logPath, 'a');
  const startResult = await spawnCommand(npmCommand, ['start'], {
    env: backendEnv,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  fs.closeSync(logFd);
  logStep(`started pid=${startResult.pid}`);

  const runtimeMeta = await waitForFreshRuntime(options);
  logStep(
    `runtime ready git=${runtimeMeta.gitHash} source=${runtimeMeta.sourceHash} port=${runtimeMeta.port}`
  );

  logStep(`running seed ${options.seedScript}`);
  await spawnCommand(process.execPath, [options.seedScript], { env: backendEnv });

  logStep(`running smoke ${options.smokeScript}`);
  const smokeEnv = {
    ...backendEnv,
    STAGE2_SMOKE_BASE_URL: options.baseUrl,
  };
  await spawnCommand(process.execPath, [options.smokeScript], { env: smokeEnv });

  logStep(`done latest backend=${options.baseUrl}`);
}

main().catch(error => {
  console.error(`[latest-reset] FAILED: ${error.message}`);
  process.exitCode = 1;
});
