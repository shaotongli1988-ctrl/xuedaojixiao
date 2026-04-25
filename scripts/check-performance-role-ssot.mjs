#!/usr/bin/env node

/**
 * 负责校验 performance 角色目录与前端/移动端角色消费者的 SSOT 闭环。
 * 不负责推断业务权限语义，也不替代 access-context service 的运行时测试。
 * 关键依赖是 backend roles/catalog.ts、frontend role-fact/access-context/workbench 类型和 cool-uni 角色展示契约。
 * 维护重点：角色种类、persona key 和前端 transport role 集合必须以 backend 角色目录为准，不能再次散落维护。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const ROLE_CATALOG_PATH =
  'cool-admin-midway/src/modules/performance/domain/roles/catalog.ts';
const FRONTEND_ROLE_FACT_PATH =
  'cool-admin-vue/src/modules/performance/service/role-fact.ts';
const FRONTEND_ACCESS_CONTEXT_CONTRACT_PATH =
  'cool-admin-vue/src/modules/performance/service/access-context-contract.ts';
const FRONTEND_WORKBENCH_TYPES_PATH =
  'cool-admin-vue/src/modules/performance/workbench/types.ts';
const MOBILE_ROLE_FACT_PATH = 'cool-uni/cool/utils/performance-role-fact.ts';
const MOBILE_SHARED_CONTRACT_PATH = 'cool-uni/types/performance-mobile.ts';

function fail(message) {
  console.error(`[performance-role-ssot] ${message}`);
  process.exit(1);
}

function readRepoText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`文件不存在：${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function unique(items) {
  return [...new Set(items)];
}

function extractQuotedStrings(source) {
  return unique(
    [...source.matchAll(/'([^']+)'/g)]
      .map(match => match[1]?.trim())
      .filter(Boolean)
  );
}

function extractExportBlock(source, exportName) {
  const startMarker = `export const ${exportName} =`;
  const startIndex = source.indexOf(startMarker);
  if (startIndex < 0) {
    fail(`未找到导出块：${exportName}`);
  }

  const blockStart = source.indexOf('{', startIndex);
  if (blockStart < 0) {
    fail(`导出块缺少对象起始：${exportName}`);
  }

  let depth = 0;
  for (let index = blockStart; index < source.length; index += 1) {
    const current = source[index];
    if (current === '{') {
      depth += 1;
      continue;
    }
    if (current === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(blockStart, index + 1);
      }
    }
  }

  fail(`导出块未闭合：${exportName}`);
}

function extractUnionMembers(source, exportName) {
  const match = source.match(
    new RegExp(`export type ${exportName} =([\\s\\S]*?);`)
  );
  if (!match) {
    fail(`未找到类型联合：${exportName}`);
  }

  return extractQuotedStrings(match[1]);
}

function extractObjectKeys(source, exportName) {
  return unique(
    [...extractExportBlock(source, exportName).matchAll(/'([^']+)'\s*:/g)]
      .map(match => match[1]?.trim())
      .filter(Boolean)
  );
}

function ensureEveryTokenPresent(filePath, source, tokens, label) {
  const missingTokens = tokens.filter(
    token => !source.includes(`'${token}'`) && !source.includes(`"${token}"`)
  );
  if (missingTokens.length) {
    fail(`${filePath} 缺少 ${label}: ${missingTokens.join(', ')}`);
  }
}

function main() {
  const roleCatalogSource = readRepoText(ROLE_CATALOG_PATH);
  const frontendRoleFactSource = readRepoText(FRONTEND_ROLE_FACT_PATH);
  const frontendAccessContextSource = readRepoText(
    FRONTEND_ACCESS_CONTEXT_CONTRACT_PATH
  );
  const frontendWorkbenchTypesSource = readRepoText(
    FRONTEND_WORKBENCH_TYPES_PATH
  );
  const mobileRoleFactSource = readRepoText(MOBILE_ROLE_FACT_PATH);
  const mobileSharedContractSource = readRepoText(MOBILE_SHARED_CONTRACT_PATH);

  const backendRoleKinds = extractUnionMembers(
    roleCatalogSource,
    'PerformanceRegisteredRoleKind'
  );
  const backendPersonaKeys = extractObjectKeys(
    roleCatalogSource,
    'PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY'
  );
  const transportRoleKinds = [...backendRoleKinds, 'unsupported'];

  if (!backendRoleKinds.length) {
    fail('backend 角色种类为空。');
  }

  if (!backendPersonaKeys.length) {
    fail('backend persona key 为空。');
  }

  ensureEveryTokenPresent(
    FRONTEND_ACCESS_CONTEXT_CONTRACT_PATH,
    frontendAccessContextSource,
    transportRoleKinds,
    'roleKind transport 集合'
  );
  ensureEveryTokenPresent(
    FRONTEND_WORKBENCH_TYPES_PATH,
    frontendWorkbenchTypesSource,
    backendPersonaKeys,
    'persona key 联合'
  );
  ensureEveryTokenPresent(
    FRONTEND_WORKBENCH_TYPES_PATH,
    frontendWorkbenchTypesSource,
    transportRoleKinds,
    'roleKind 联合'
  );
  ensureEveryTokenPresent(
    FRONTEND_ROLE_FACT_PATH,
    frontendRoleFactSource,
    backendPersonaKeys,
    'persona 分支'
  );
  ensureEveryTokenPresent(
    MOBILE_ROLE_FACT_PATH,
    mobileRoleFactSource,
    backendPersonaKeys,
    'persona 分支'
  );
  ensureEveryTokenPresent(
    MOBILE_SHARED_CONTRACT_PATH,
    mobileSharedContractSource,
    transportRoleKinds,
    'mobile roleKind transport 集合'
  );

  console.log(
    `[performance-role-ssot] PASS (${backendRoleKinds.length} roleKinds, ${backendPersonaKeys.length} personas)`
  );
}

main();
