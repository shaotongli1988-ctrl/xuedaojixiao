#!/usr/bin/env node

/**
 * 负责校验业务字典 registry、provider registry 和运行时 store 之间的绑定覆盖是否被显式登记。
 * 不负责补齐每个业务字典 key，也不替代 dict 模块单测或页面联调。
 * 关键依赖是 business-dict-binding catalog、performance/domain/dicts/catalog.ts 与 dict/domain/dicts/catalog.ts。
 * 维护重点：registry key、provider family 和 runtime consumer 的分层关系必须显式，不能继续靠隐式约定。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadXuedaoSsotManifest } from './xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const BUSINESS_DICT_BINDING_PATH =
  'contracts/ssot/business-dict-binding.catalog.json';
const PERFORMANCE_DICT_CATALOG_PATH =
  'cool-admin-midway/src/modules/performance/domain/dicts/catalog.ts';
const DICT_PROVIDER_CATALOG_PATH =
  'cool-admin-midway/src/modules/dict/domain/dicts/catalog.ts';

function fail(message) {
  console.error(`[business-dict-binding-ssot] ${message}`);
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
          `${entry} 同时出现在 ${seen.get(entry)} 和 ${groupName}。`
        );
      }
      seen.set(entry, groupName);
    }
  }
}

function extractConstBlock(source, exportName) {
  const startMarker = `export const ${exportName} =`;
  const startIndex = source.indexOf(startMarker);
  if (startIndex < 0) {
    fail(`未找到导出块：${exportName}`);
  }

  const blockStart = source.indexOf('[', startIndex);
  if (blockStart < 0) {
    fail(`导出块缺少数组起始：${exportName}`);
  }

  let depth = 0;
  for (let index = blockStart; index < source.length; index += 1) {
    const current = source[index];
    if (current === '[') {
      depth += 1;
      continue;
    }
    if (current === ']') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(blockStart, index + 1);
      }
    }
  }

  fail(`导出块未闭合：${exportName}`);
}

function extractPerformanceRegistryKeys(source) {
  return [...extractConstBlock(source, 'PERFORMANCE_BUSINESS_DICTS').matchAll(/key:\s*'([^']+)'/g)].map(
    match => match[1]
  );
}

function extractProviderFamilyKeys(source) {
  return [...extractConstBlock(source, 'DICT_BUSINESS_DICT_PROVIDERS').matchAll(/key:\s*'([^']+)'/g)].map(
    match => match[1]
  );
}

function main() {
  const catalog = readJson(BUSINESS_DICT_BINDING_PATH);
  const performanceCatalogSource = readText(PERFORMANCE_DICT_CATALOG_PATH);
  const providerCatalogSource = readText(DICT_PROVIDER_CATALOG_PATH);
  const manifest = loadXuedaoSsotManifest();

  if (String(catalog.owner || '').trim() !== 'repo-governance') {
    fail('business-dict binding catalog owner 必须是 repo-governance。');
  }

  const registrySourceFiles = normalizeList(catalog.registrySourceFiles);
  const runtimeSourceFiles = normalizeList(catalog.runtimeSourceFiles);
  const registryKeysBackedByProviders = normalizeList(
    catalog.registryKeysBackedByProviders
  );
  const registryKeysPlannedWithoutProviders = normalizeList(
    catalog.registryKeysPlannedWithoutProviders
  );
  const providerFamiliesWithRegistryBinding = normalizeList(
    catalog.providerFamiliesWithRegistryBinding
  );
  const providerFamiliesWithoutRegistryBinding = normalizeList(
    catalog.providerFamiliesWithoutRegistryBinding
  );

  assertNoOverlap({
    registryKeysBackedByProviders,
    registryKeysPlannedWithoutProviders,
    providerFamiliesWithRegistryBinding,
    providerFamiliesWithoutRegistryBinding,
  });

  for (const relativePath of [
    ...registrySourceFiles,
    ...runtimeSourceFiles,
    ...normalizeList(catalog.supportingGuards),
    ...normalizeList(catalog.generatedConsumers),
  ]) {
    if (!fs.existsSync(path.join(repoRoot, relativePath))) {
      fail(`binding 依赖不存在：${relativePath}`);
    }
  }

  assertSameSet(
    manifest.sourceOfTruth?.businessDictionaries?.sourceFile
      ? [manifest.sourceOfTruth.businessDictionaries.sourceFile]
      : [],
    [PERFORMANCE_DICT_CATALOG_PATH],
    'manifest.businessDictionaries.sourceFile'
  );
  assertSameSet(
    manifest.sourceOfTruth?.dictBusinessCatalog?.sourceFiles || [],
    [DICT_PROVIDER_CATALOG_PATH, 'cool-admin-midway/src/modules/dict/service/info.ts'],
    'manifest.dictBusinessCatalog.sourceFiles'
  );
  if (
    String(manifest.sourceOfTruth?.businessDictBinding?.sourceFile || '') !==
    BUSINESS_DICT_BINDING_PATH
  ) {
    fail('manifest.businessDictBinding.sourceFile 与 binding catalog 路径不一致。');
  }

  const performanceRegistryKeys = extractPerformanceRegistryKeys(
    performanceCatalogSource
  );
  const providerFamilyKeys = extractProviderFamilyKeys(providerCatalogSource);

  assertSameSet(
    performanceRegistryKeys,
    [...registryKeysBackedByProviders, ...registryKeysPlannedWithoutProviders],
    'performance registry keys 与 binding coverage'
  );
  assertSameSet(
    providerFamilyKeys,
    [
      ...providerFamiliesWithRegistryBinding,
      ...providerFamiliesWithoutRegistryBinding,
    ],
    'dict provider family keys 与 binding coverage'
  );

  console.log(
    `[business-dict-binding-ssot] PASS (${performanceRegistryKeys.length} registry keys, ${providerFamilyKeys.length} provider families)`
  );
}

main();
