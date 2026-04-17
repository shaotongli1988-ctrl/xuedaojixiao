#!/usr/bin/env node
/**
 * Manages the user-scoped MariaDB-compatible local database used by cool-admin-midway.
 * It only touches ~/.local-mariadb and never modifies Homebrew services or repo config.
 * Inputs: local MariaDB binaries under ~/.local-mariadb/mariadb/* and the fixed app contract root/123456@127.0.0.1:3306 -> cool.
 * Maintenance pitfall: if the MariaDB bundle is replaced, keep the extracted layout compatible with bin/mariadbd and bin/mariadb-install-db.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = path.join(os.homedir(), '.local-mariadb');
const distRoot = path.join(rootDir, 'mariadb');
const dataDir = path.join(rootDir, 'data-3306');
const runDir = path.join(rootDir, 'run');
const logDir = path.join(rootDir, 'logs');
const port = 3306;
const host = '127.0.0.1';
const socketPath = path.join(runDir, 'mysql-3306.sock');
const pidFile = path.join(runDir, 'mysql-3306.pid');
const errorLog = path.join(logDir, 'mysql-3306.err');
const dbName = 'cool';
const dbUser = 'root';
const dbPassword = '123456';

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[INFO] ${message}`);
}

function success(message) {
  console.log(`[PASS] ${message}`);
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listDirectories(dirPath) {
  if (!exists(dirPath)) {
    return [];
  }
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dirPath, entry.name))
    .sort()
    .reverse();
}

function resolveBaseDir() {
  for (const candidate of listDirectories(distRoot)) {
    const mariadbd = path.join(candidate, 'bin', 'mariadbd');
    const installDb = path.join(candidate, 'bin', 'mariadb-install-db');
    const client = path.join(candidate, 'bin', 'mariadb');
    const admin = path.join(candidate, 'bin', 'mariadb-admin');
    if (exists(mariadbd) && exists(installDb) && exists(client) && exists(admin)) {
      return {
        baseDir: candidate,
        mariadbd,
        installDb,
        client,
        admin,
      };
    }
  }
  fail(
    `未找到本地 MariaDB 发行目录。期望路径类似 ${path.join(
      distRoot,
      '<version>'
    )}`
  );
}

const { baseDir, mariadbd, installDb, client, admin } = resolveBaseDir();

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });
}

function isPortListening(targetHost = host, targetPort = port, timeoutMs = 800) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: targetHost, port: targetPort });

    const finish = result => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForPort(expectedState, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await isPortListening()) === expectedState) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

function hasSystemTables() {
  return exists(path.join(dataDir, 'mysql'));
}

function ensureLayout() {
  ensureDir(rootDir);
  ensureDir(runDir);
  ensureDir(logDir);
  ensureDir(dataDir);
}

function mysqlArgs(extraArgs = []) {
  return [
    '--no-defaults',
    '-h127.0.0.1',
    `-P${port}`,
    `-u${dbUser}`,
    `-p${dbPassword}`,
    ...extraArgs,
  ];
}

function canLoginWithPassword() {
  const result = run(client, mysqlArgs(['-e', 'SELECT 1;']));
  return result.status === 0;
}

function alignRootAndDatabase() {
  const sql = [
    `CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}';`,
    `CREATE USER IF NOT EXISTS '${dbUser}'@'127.0.0.1' IDENTIFIED BY '${dbPassword}';`,
    `CREATE USER IF NOT EXISTS '${dbUser}'@'::1' IDENTIFIED BY '${dbPassword}';`,
    `ALTER USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}';`,
    `ALTER USER '${dbUser}'@'127.0.0.1' IDENTIFIED BY '${dbPassword}';`,
    `ALTER USER '${dbUser}'@'::1' IDENTIFIED BY '${dbPassword}';`,
    `GRANT ALL PRIVILEGES ON *.* TO '${dbUser}'@'localhost' WITH GRANT OPTION;`,
    `GRANT ALL PRIVILEGES ON *.* TO '${dbUser}'@'127.0.0.1' WITH GRANT OPTION;`,
    `GRANT ALL PRIVILEGES ON *.* TO '${dbUser}'@'::1' WITH GRANT OPTION;`,
    `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`,
    'FLUSH PRIVILEGES;',
  ].join('\n');

  const result = run(client, [
    '--no-defaults',
    `--socket=${socketPath}`,
    `-u${dbUser}`,
    '-e',
    sql,
  ]);

  if (result.status !== 0) {
    fail(
      `root/cool 对齐失败。\n${result.stderr || result.stdout || 'no output'}`
    );
  }
}

function initDataDir() {
  info(`初始化本地数据库目录: ${dataDir}`);
  const result = run(installDb, [
    '--no-defaults',
    `--basedir=${baseDir}`,
    `--datadir=${dataDir}`,
    '--auth-root-authentication-method=normal',
    '--skip-test-db',
  ]);

  if (result.status !== 0) {
    fail(`初始化失败。\n${result.stderr || result.stdout || 'no output'}`);
  }
}

function startServer() {
  const child = spawn(
    mariadbd,
    [
      '--no-defaults',
      `--basedir=${baseDir}`,
      `--datadir=${dataDir}`,
      `--port=${port}`,
      `--bind-address=${host}`,
      `--socket=${socketPath}`,
      `--pid-file=${pidFile}`,
      `--log-error=${errorLog}`,
      `--plugin-dir=${path.join(baseDir, 'lib', 'plugin')}`,
    ],
    {
      detached: true,
      stdio: 'ignore',
      cwd: rootDir,
    }
  );

  child.unref();
  return child.pid;
}

function readPid() {
  if (!exists(pidFile)) {
    return null;
  }
  const raw = fs.readFileSync(pidFile, 'utf8').trim();
  if (!raw) {
    return null;
  }
  const pid = Number(raw);
  return Number.isFinite(pid) ? pid : null;
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'EPERM') {
      return true;
    }
    return false;
  }
}

async function start() {
  ensureLayout();

  const portOpen = await isPortListening();
  if (portOpen) {
    if (canLoginWithPassword()) {
      success(`本地数据库已在 ${host}:${port} 运行`);
      return;
    }
    fail(`${host}:${port} 已被占用，但不是当前脚本管理的可用数据库`);
  }

  if (!hasSystemTables()) {
    initDataDir();
  }

  const pid = startServer();
  info(`已发起启动，PID=${pid}`);

  if (!(await waitForPort(true, 30000))) {
    const tail = exists(errorLog)
      ? fs.readFileSync(errorLog, 'utf8').split('\n').slice(-40).join('\n')
      : 'error log not found';
    fail(`数据库未能在 30 秒内监听 ${port}\n${tail}`);
  }

  if (!canLoginWithPassword()) {
    alignRootAndDatabase();
  }

  if (!canLoginWithPassword()) {
    fail(`数据库已监听 ${port}，但 root/${dbPassword} 登录失败`);
  }

  success(`本地数据库已启动: ${host}:${port}`);
}

async function stop() {
  const pid = readPid();

  if (!pid && !(await isPortListening())) {
    success('本地数据库已停止');
    return;
  }

  if (await isPortListening()) {
    const shutdownResult = run(admin, [...mysqlArgs(), 'shutdown']);
    if (shutdownResult.status === 0) {
      info('已通过数据库管理命令发起 shutdown');
    } else if (pid && processExists(pid)) {
      info(`shutdown 失败，回退到 SIGTERM，PID=${pid}`);
      try {
        process.kill(pid, 'SIGTERM');
      } catch (error) {
        fail(`无法结束 PID=${pid}: ${error?.message || 'unknown error'}`);
      }
    } else {
      fail(
        `数据库 shutdown 失败，且未找到可管理的 PID。\n${
          shutdownResult.stderr || shutdownResult.stdout || 'no output'
        }`
      );
    }
  }

  if (!(await waitForPort(false, 20000))) {
    if (pid && processExists(pid)) {
      info(`SIGTERM 超时，发送 SIGKILL 到 PID=${pid}`);
      try {
        process.kill(pid, 'SIGKILL');
      } catch (error) {
        fail(`SIGKILL 失败，无法结束 PID=${pid}: ${error?.message || 'unknown error'}`);
      }
      if (!(await waitForPort(false, 5000))) {
        fail(`数据库停止失败，${host}:${port} 仍在监听`);
      }
    } else {
      fail(`数据库停止失败，${host}:${port} 仍在监听`);
    }
  }

  success('本地数据库已停止');
}

async function status() {
  const listening = await isPortListening();
  const pid = readPid();
  const loginOk = listening ? canLoginWithPassword() : false;

  console.log(`baseDir=${baseDir}`);
  console.log(`dataDir=${dataDir}`);
  console.log(`errorLog=${errorLog}`);
  console.log(`pidFile=${pidFile}`);
  console.log(`listening=${listening}`);
  console.log(`pid=${pid ?? 'none'}`);
  console.log(`login=${loginOk ? 'ok' : 'fail'}`);
  console.log(`database=${dbName}`);

  if (listening && loginOk) {
    success(`本地数据库可用: ${host}:${port}`);
    return;
  }

  if (!listening) {
    info('本地数据库当前未运行');
    return;
  }

  fail(`数据库在 ${host}:${port} 监听，但登录校验失败`);
}

const command = process.argv[2] || 'status';

if (command === 'start') {
  await start();
} else if (command === 'stop') {
  await stop();
} else if (command === 'status') {
  await status();
} else {
  console.log('Usage: node ./scripts/local-db.mjs <start|stop|status>');
  process.exit(1);
}
