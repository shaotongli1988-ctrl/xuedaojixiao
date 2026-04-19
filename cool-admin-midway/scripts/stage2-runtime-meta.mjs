/**
 * Shared stage-2 runtime guard constants and validators.
 * This file defines the seed metadata contract consumed by seed scripts and smoke preflight checks.
 * It does not call backend APIs, mutate database state, or manage process lifecycle.
 * Maintenance pitfall: update the version/scopes here together with seed-stage2-performance.mjs and all stage-2 smoke scripts.
 */
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const STAGE2_RUNTIME_META_PARAM_KEY = 'stage2.performance.seedMeta';
export const STAGE2_RUNTIME_META_VERSION = '2026-04-18.stage2.runtime-v1';
export const STAGE2_RUNTIME_META_SCOPES = Object.freeze([
  'stage2-performance-core',
  'theme10-contract',
  'theme11-procurement-supplier',
  'theme12-talentAsset',
  'theme13-capability-certificate',
  'theme14-course-learning',
  'theme15-resumePool',
  'theme16-recruit-plan',
  'theme17-job-standard',
  'theme18-hiring',
  'theme19-teacher-channel',
  'theme20-asset-management',
  'theme21-office-knowledge',
]);

export function buildStage2SeedMeta(updatedAt = new Date().toISOString()) {
  return {
    version: STAGE2_RUNTIME_META_VERSION,
    scopes: [...STAGE2_RUNTIME_META_SCOPES],
    updatedAt,
  };
}

export function resolveProjectGitHash(projectRoot) {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    return 'unknown';
  }
}

function loadFingerprintPaths(projectRoot) {
  const configPath = path.join(projectRoot, 'scripts', 'stage2-runtime-fingerprint.json');
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return Array.isArray(parsed.paths) ? parsed.paths : [];
}

function collectFingerprintFiles(projectRoot, relativePath, output) {
  const targetPath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath).sort();
    for (const entry of entries) {
      collectFingerprintFiles(
        projectRoot,
        path.join(relativePath, entry),
        output
      );
    }
    return;
  }

  if (stat.isFile()) {
    output.push(relativePath.replace(/\\/g, '/'));
  }
}

export function resolveProjectSourceHash(projectRoot) {
  const hash = crypto.createHash('sha1');
  const files = [];

  for (const relativePath of loadFingerprintPaths(projectRoot)) {
    collectFingerprintFiles(projectRoot, relativePath, files);
  }

  for (const relativePath of files.sort()) {
    const absolutePath = path.join(projectRoot, relativePath);
    hash.update(relativePath);
    hash.update('\n');
    hash.update(fs.readFileSync(absolutePath));
    hash.update('\n');
  }

  return hash.digest('hex');
}

export function resolveExpectedPort(baseUrl) {
  try {
    const port = Number(new URL(baseUrl).port);
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch (error) {
    return null;
  }
}

export function validateStage2RuntimeMeta(meta, options = {}) {
  const problems = [];
  const {
    expectedGitHash,
    expectedSourceHash,
    expectedPort,
    requiredVersion = STAGE2_RUNTIME_META_VERSION,
    requiredScopes = [],
  } = options;

  if (!meta || typeof meta !== 'object') {
    return ['runtime meta payload missing'];
  }

  if (!meta.runtimeId || typeof meta.runtimeId !== 'string') {
    problems.push('runtimeId missing');
  }

  if (!meta.startedAt || typeof meta.startedAt !== 'string') {
    problems.push('startedAt missing');
  }

  const gitHash = typeof meta.gitHash === 'string' ? meta.gitHash.trim() : '';
  if (!gitHash) {
    problems.push('gitHash missing');
  } else if (
    expectedGitHash &&
    expectedGitHash !== 'unknown' &&
    gitHash !== expectedGitHash
  ) {
    problems.push(`gitHash mismatch expected ${expectedGitHash} got ${gitHash}`);
  }

  const sourceHash =
    typeof meta.sourceHash === 'string' ? meta.sourceHash.trim() : '';
  if (!sourceHash) {
    problems.push('sourceHash missing');
  } else if (
    expectedSourceHash &&
    sourceHash !== expectedSourceHash
  ) {
    problems.push(
      `sourceHash mismatch expected ${expectedSourceHash} got ${sourceHash}`
    );
  }

  const port = Number(meta.port);
  if (!Number.isInteger(port) || port <= 0) {
    problems.push('port missing');
  } else if (
    Number.isInteger(expectedPort) &&
    expectedPort > 0 &&
    port !== expectedPort
  ) {
    problems.push(`port mismatch expected ${expectedPort} got ${port}`);
  }

  if (!meta.seedMeta || typeof meta.seedMeta !== 'object') {
    problems.push('seedMeta missing');
    return problems;
  }

  if (meta.seedMeta.version !== requiredVersion) {
    problems.push(
      `seedMeta.version mismatch expected ${requiredVersion} got ${meta.seedMeta.version || 'empty'}`
    );
  }

  const actualScopes = Array.isArray(meta.seedMeta.scopes)
    ? meta.seedMeta.scopes.filter(item => typeof item === 'string')
    : [];

  for (const scope of requiredScopes) {
    if (!actualScopes.includes(scope)) {
      problems.push(`seedMeta.scopes missing ${scope}`);
    }
  }

  return problems;
}
