#!/usr/bin/env node

/**
 * 负责校验 performance 状态机 coverage catalog 是否把已治理聚合和待治理边界显式登记。
 * 不负责补业务状态机实现，也不替代状态流对齐守卫的源码扫描。
 * 关键依赖是 state-machine-coverage catalog、manifest 的 stateMachines/stateMachineCoverage 声明和现有 domain/states 文件。
 * 维护重点：implemented/planned/outOfScope 边界必须互斥，且 implemented 聚合必须真实来自 machine source。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadXuedaoSsotManifest } from './xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const STATE_MACHINE_COVERAGE_PATH =
  'contracts/ssot/state-machine-coverage.catalog.json';

function fail(message) {
  console.error(`[state-machine-coverage-ssot] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`文件不存在：${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`文件不存在：${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function normalizeList(items) {
  return [...new Set((Array.isArray(items) ? items : []).map(item => String(item || '').trim()).filter(Boolean))].sort();
}

function assertSameSet(left, right, label) {
  const normalizedLeft = normalizeList(left);
  const normalizedRight = normalizeList(right);
  if (JSON.stringify(normalizedLeft) !== JSON.stringify(normalizedRight)) {
    fail(
      `${label} 不一致：${JSON.stringify(normalizedLeft)} !== ${JSON.stringify(normalizedRight)}`
    );
  }
}

function assertNoOverlap(groups) {
  const seen = new Map();
  for (const [groupName, entries] of Object.entries(groups)) {
    for (const entry of normalizeList(entries)) {
      if (seen.has(entry)) {
        fail(
          `aggregate ${entry} 同时出现在 ${seen.get(entry)} 和 ${groupName}。`
        );
      }
      seen.set(entry, groupName);
    }
  }
}

function extractAggregate(relativePath) {
  const source = readText(relativePath);
  const match = source.match(/aggregate:\s*'([^']+)'/);
  if (!match) {
    return null;
  }
  return match[1];
}

function main() {
  const catalog = readJson(STATE_MACHINE_COVERAGE_PATH);
  const manifest = loadXuedaoSsotManifest();

  if (String(catalog.owner || '').trim() !== 'repo-governance') {
    fail('state-machine coverage catalog owner 必须是 repo-governance。');
  }

  const machineSourceFiles = normalizeList(catalog.machineSourceFiles);
  const implementedAggregates = normalizeList(catalog.implementedAggregates);
  const plannedAggregates = normalizeList(catalog.plannedAggregates);
  const outOfScopeAggregates = normalizeList(catalog.outOfScopeAggregates);

  if (!machineSourceFiles.length) {
    fail('state-machine coverage catalog 缺少 machineSourceFiles。');
  }

  if (!implementedAggregates.length) {
    fail('state-machine coverage catalog 缺少 implementedAggregates。');
  }

  assertNoOverlap({
    implementedAggregates,
    plannedAggregates,
    outOfScopeAggregates,
  });

  for (const relativePath of [
    ...machineSourceFiles,
    ...normalizeList(catalog.supportingGuards),
    ...normalizeList(catalog.generatedConsumers),
  ]) {
    if (!fs.existsSync(path.join(repoRoot, relativePath))) {
      fail(`coverage 依赖不存在：${relativePath}`);
    }
  }

  const implementedBySource = machineSourceFiles
    .map(relativePath => extractAggregate(relativePath))
    .filter(Boolean)
    .sort();

  assertSameSet(
    implementedBySource,
    implementedAggregates,
    'machineSourceFiles 提取的 aggregate 与 implementedAggregates'
  );

  assertSameSet(
    manifest.sourceOfTruth?.stateMachines?.sourceFiles || [],
    machineSourceFiles,
    'manifest.stateMachines.sourceFiles 与 coverage.machineSourceFiles'
  );

  if (
    String(manifest.sourceOfTruth?.stateMachineCoverage?.sourceFile || '') !==
    STATE_MACHINE_COVERAGE_PATH
  ) {
    fail('manifest.stateMachineCoverage.sourceFile 与 coverage catalog 路径不一致。');
  }

  console.log(
    `[state-machine-coverage-ssot] PASS (${implementedAggregates.length} implemented, ${plannedAggregates.length} planned, ${outOfScopeAggregates.length} out_of_scope)`
  );
}

main();
