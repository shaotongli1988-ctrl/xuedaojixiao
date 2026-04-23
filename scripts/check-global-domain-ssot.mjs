#!/usr/bin/env node

/**
 * 守卫仓库级全域领域模型 SSOT 骨架。
 * 这里只负责校验 backend 模块覆盖、global domain registry 记录完整性以及 implemented 模块的 registry 文件是否存在。
 * 不负责修复业务代码，也不替代更细粒度的 performance/base/user/dict 域内结构校验。
 * 维护重点：新增 backend 模块或新增模块级 domain registry 时，必须同步更新全局 registry，否则全域治理会立即失真。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const midwayRoot = path.join(repoRoot, 'cool-admin-midway');
const modulesRoot = path.join(midwayRoot, 'src/modules');
const globalRegistryCatalogFile = path.join(
  midwayRoot,
  'src/domain-registry/catalog.ts'
);

function fail(message) {
  console.error(`[global-domain-ssot] ${message}`);
  process.exit(1);
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function listBackendModuleDirs() {
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function parseModuleOrder(catalogSource) {
  const orderMatch = catalogSource.match(
    /const GLOBAL_SSOT_MODULE_ORDER = \[([\s\S]*?)\] as const/
  );
  if (!orderMatch) {
    fail('无法在 global registry catalog 中解析 GLOBAL_SSOT_MODULE_ORDER。');
  }

  return [...orderMatch[1].matchAll(/'([^']+)'/g)].map(item => item[1]).sort();
}

function extractModuleBlock(catalogSource, moduleKey) {
  const startToken = `  ${moduleKey}: {`;
  const startIndex = catalogSource.indexOf(startToken);
  if (startIndex === -1) {
    fail(`global registry catalog 缺少模块块：${moduleKey}`);
  }

  const blockStartIndex = startIndex + startToken.length;
  const remainingSource = catalogSource.slice(blockStartIndex);
  const nextModuleMatch = remainingSource.match(/\n  [a-z]+: \{/);
  const blockEndIndex = nextModuleMatch
    ? blockStartIndex + nextModuleMatch.index
    : catalogSource.indexOf('\n});', blockStartIndex);

  if (blockEndIndex === -1) {
    fail(`无法定位模块块结束位置：${moduleKey}`);
  }

  return catalogSource.slice(blockStartIndex, blockEndIndex);
}

function extractSurfaceBlock(moduleBlock, surfaceKey) {
  const surfaceToken = `key: '${surfaceKey}'`;
  const startIndex = moduleBlock.indexOf(surfaceToken);
  if (startIndex === -1) {
    fail(`模块缺少 surface 定义：${surfaceKey}`);
  }

  const remainingSource = moduleBlock.slice(startIndex);
  const nextSurfaceMatch = remainingSource.match(/\n      \{/);
  const surfaceEndIndex = nextSurfaceMatch
    ? startIndex + nextSurfaceMatch.index
    : moduleBlock.indexOf('\n    ],', startIndex);

  if (surfaceEndIndex === -1) {
    fail(`无法定位 surface 结束位置：${surfaceKey}`);
  }

  return moduleBlock.slice(startIndex, surfaceEndIndex);
}

function parseSingleQuotedField(source, fieldName) {
  const match = source.match(new RegExp(`${fieldName}: '([^']+)'`));
  return match ? match[1] : null;
}

function main() {
  const catalogSource = fs.readFileSync(globalRegistryCatalogFile, 'utf8');
  const backendModuleDirs = listBackendModuleDirs();
  const moduleOrder = parseModuleOrder(catalogSource);

  if (JSON.stringify(moduleOrder) !== JSON.stringify(backendModuleDirs)) {
    fail(
      `GLOBAL_SSOT_MODULE_ORDER 与 backend 模块目录不一致。order=${moduleOrder.join(
        ','
      )}; dirs=${backendModuleDirs.join(',')}`
    );
  }

  for (const moduleKey of backendModuleDirs) {
    const moduleBlock = extractModuleBlock(catalogSource, moduleKey);
    const domainRegistrySurfaceBlock = extractSurfaceBlock(
      moduleBlock,
      'domain_registry'
    );
    const domainRegistryStatus = parseSingleQuotedField(
      domainRegistrySurfaceBlock,
      'status'
    );
    const targetSourcePath = parseSingleQuotedField(
      domainRegistrySurfaceBlock,
      'targetSourcePath'
    );
    const runtimeRegistryDeclared = /runtimeRegistry:\s*[A-Z0-9_]+/.test(
      moduleBlock
    );
    const registryFilePath = path.join(
      modulesRoot,
      moduleKey,
      'domain/registry/index.ts'
    );
    const domainEntryFilePath = path.join(
      modulesRoot,
      moduleKey,
      'domain/index.ts'
    );
    const registryExists = fs.existsSync(registryFilePath);

    if (registryExists && domainRegistryStatus !== 'implemented') {
      fail(
        `${moduleKey} 已存在 domain/registry/index.ts，但 global registry 未将 domain_registry 标记为 implemented。`
      );
    }

    if (!registryExists && domainRegistryStatus === 'implemented') {
      fail(
        `${moduleKey} 在 global registry 中标记为 implemented，但缺少 domain/registry/index.ts。`
      );
    }

    if (domainRegistryStatus === 'implemented') {
      if (!targetSourcePath) {
        fail(`${moduleKey} 的 domain_registry 已 implemented，但缺少 targetSourcePath。`);
      }

      const targetFilePath = path.join(midwayRoot, targetSourcePath);
      if (!fs.existsSync(targetFilePath)) {
        fail(
          `${moduleKey} 的 targetSourcePath 不存在：${normalizePath(
            path.relative(repoRoot, targetFilePath)
          )}`
        );
      }

      if (!fs.existsSync(domainEntryFilePath)) {
        fail(`${moduleKey} 已 implemented，但缺少 domain/index.ts 统一入口。`);
      }

      if (!runtimeRegistryDeclared) {
        fail(
          `${moduleKey} 的 domain_registry 已 implemented，但 global registry 模块块缺少 runtimeRegistry。`
        );
      }
    }

    if (domainRegistryStatus !== 'implemented' && runtimeRegistryDeclared) {
      fail(
        `${moduleKey} 尚未 implemented，却在 global registry 中声明了 runtimeRegistry。`
      );
    }
  }

  console.log('[global-domain-ssot] passed');
}

main();
