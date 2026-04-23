#!/usr/bin/env node

/**
 * 负责校验仓库级数据库 schema catalog 是否完整覆盖 migration root 与 entities 聚合入口。
 * 不负责比对每一列的物理 schema，也不替代 migration 执行或数据库启动验证。
 * 依赖 contracts/ssot/database-schema.catalog.json、cool-admin-midway/src/entities.ts 与 scripts/migrations 目录。
 * 维护重点：任何新增 migration 文件或新增实体根目录，都必须先回写 catalog，再继续实现。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { resolveSsotRepoPath } from './xuedao-ssot-manifest.mjs';

const guardName = 'database-schema-ssot';
const catalogRelativePath = 'contracts/ssot/database-schema.catalog.json';

function loadCatalog() {
  return JSON.parse(fs.readFileSync(resolveSsotRepoPath(catalogRelativePath), 'utf8'));
}

function normalizePath(value) {
  return value.replaceAll('\\', '/');
}

function parseEntityImports(entityAggregatorPath) {
  const entityAggregator = fs.readFileSync(resolveSsotRepoPath(entityAggregatorPath), 'utf8');
  return [...entityAggregator.matchAll(/from\s+'(\.\/modules\/[^']+)'/g)].map(match =>
    normalizePath(
      path.join(path.dirname(entityAggregatorPath), `${match[1].replace(/^\.\//, '')}.ts`)
    )
  );
}

function main() {
  const catalog = loadCatalog();
  const failures = [];

  const sourcePaths = catalog.sourcePaths || {};
  const requiredSourceKeys = ['entityAggregator', 'migrationRunner', 'migrationRoot'];
  for (const sourceKey of requiredSourceKeys) {
    if (!sourcePaths[sourceKey]) {
      failures.push(`sourcePaths.${sourceKey} 未配置。`);
      continue;
    }
    if (!fs.existsSync(resolveSsotRepoPath(sourcePaths[sourceKey]))) {
      failures.push(`sourcePaths.${sourceKey} 不存在: ${sourcePaths[sourceKey]}`);
    }
  }

  if (!Array.isArray(sourcePaths.schemaBootstrapEntrypoints) || sourcePaths.schemaBootstrapEntrypoints.length === 0) {
    failures.push('sourcePaths.schemaBootstrapEntrypoints 未配置。');
  } else {
    for (const entry of sourcePaths.schemaBootstrapEntrypoints) {
      if (!fs.existsSync(resolveSsotRepoPath(entry))) {
        failures.push(`schema bootstrap entry 不存在: ${entry}`);
      }
    }
  }

  const ownershipGroups = Array.isArray(catalog.ownershipGroups) ? catalog.ownershipGroups : [];
  if (!ownershipGroups.length) {
    failures.push('ownershipGroups 未配置。');
  }

  const declaredMigrationFiles = new Map();
  const declaredEntityRoots = [];

  for (const group of ownershipGroups) {
    if (!group.id) {
      failures.push('ownershipGroups 存在缺少 id 的条目。');
      continue;
    }
    if (!Array.isArray(group.entityRoots) || group.entityRoots.length === 0) {
      failures.push(`ownershipGroups.${group.id} 缺少 entityRoots。`);
    } else {
      for (const entityRoot of group.entityRoots) {
        declaredEntityRoots.push(entityRoot);
        if (!fs.existsSync(resolveSsotRepoPath(entityRoot))) {
          failures.push(`ownershipGroups.${group.id} entityRoot 不存在: ${entityRoot}`);
        }
      }
    }

    if (!Array.isArray(group.migrationFiles) || group.migrationFiles.length === 0) {
      failures.push(`ownershipGroups.${group.id} 缺少 migrationFiles。`);
    } else {
      for (const migrationFile of group.migrationFiles) {
        if (declaredMigrationFiles.has(migrationFile)) {
          failures.push(
            `migration 文件重复归属: ${migrationFile} 同时出现在 ${declaredMigrationFiles.get(
              migrationFile
            )} 与 ${group.id}`
          );
          continue;
        }
        declaredMigrationFiles.set(migrationFile, group.id);
      }
    }

    if (!Array.isArray(group.tableNamespaces) || group.tableNamespaces.length === 0) {
      failures.push(`ownershipGroups.${group.id} 缺少 tableNamespaces。`);
    }
  }

  const migrationRoot = sourcePaths.migrationRoot;
  if (migrationRoot && fs.existsSync(resolveSsotRepoPath(migrationRoot))) {
    const actualMigrationFiles = fs
      .readdirSync(resolveSsotRepoPath(migrationRoot))
      .filter(fileName => fileName.endsWith('.mjs'))
      .sort((left, right) => left.localeCompare(right));

    for (const migrationFile of actualMigrationFiles) {
      if (!declaredMigrationFiles.has(migrationFile)) {
        failures.push(`migration 文件未登记归属: ${migrationFile}`);
      }
    }

    for (const migrationFile of declaredMigrationFiles.keys()) {
      const fullMigrationPath = resolveSsotRepoPath(path.join(migrationRoot, migrationFile));
      if (!fs.existsSync(fullMigrationPath)) {
        failures.push(`catalog 登记的 migration 文件不存在: ${migrationFile}`);
      }
    }
  }

  const entityAggregatorPath = sourcePaths.entityAggregator;
  if (entityAggregatorPath && fs.existsSync(resolveSsotRepoPath(entityAggregatorPath))) {
    const entityImports = parseEntityImports(entityAggregatorPath);
    for (const importedEntityPath of entityImports) {
      if (!fs.existsSync(resolveSsotRepoPath(importedEntityPath))) {
        failures.push(`entities.ts 引用的实体文件不存在: ${importedEntityPath}`);
        continue;
      }
      if (!declaredEntityRoots.some(entityRoot => importedEntityPath.startsWith(`${entityRoot}/`) || importedEntityPath === `${entityRoot}.ts`)) {
        failures.push(`实体文件未命中任何登记的 entityRoots: ${importedEntityPath}`);
      }
    }
  }

  if (failures.length) {
    console.error(`[${guardName}] FAIL`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `[${guardName}] PASS: 已校验 ${ownershipGroups.length} 个 ownership groups 与 ${declaredMigrationFiles.size} 个 migration 文件。`
  );
}

main();
