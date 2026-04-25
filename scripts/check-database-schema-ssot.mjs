#!/usr/bin/env node

/**
 * 负责校验仓库级数据库 schema catalog 是否完整覆盖 migration root、entities 聚合入口与表级 parity，
 * 并对已启用的 ownership groups 追加字段/索引级 parity。
 * 不负责直接执行 migration、连接数据库或替代运行态启动验证。
 * 依赖 contracts/ssot/database-schema.catalog.json、cool-admin-midway/src/entities.ts 与 scripts/migrations 目录。
 * 维护重点：任何新增 migration 文件、实体根目录、实体表名或已纳入 field/index parity 的 schema 变化，都必须先回写 catalog，再继续实现。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { resolveSsotRepoPath } from './xuedao-ssot-manifest.mjs';

const guardName = 'database-schema-ssot';
const catalogRelativePath = 'contracts/ssot/database-schema.catalog.json';
const tableDecoratorPattern = /@Entity\(['"]([^'"]+)['"]\)/g;
const migrationTablePatterns = [
  /CREATE TABLE(?: IF NOT EXISTS)?\s+\\?`([^`$]+)\\?`/g,
  /ALTER TABLE\s+\\?`([^`$]+)\\?`/g,
  /DROP TABLE(?: IF EXISTS)?\s+\\?`([^`$]+)\\?`/g,
];
const tableConstantPattern = /const\s+[A-Za-z0-9_]*table[A-Za-z0-9_]*\s*=\s*'([^']+)'/gi;
const stringConstantPattern =
  /const\s+([A-Za-z0-9_]+)\s*=\s*['"]([^'"]+)['"]/g;

function loadCatalog() {
  return JSON.parse(fs.readFileSync(resolveSsotRepoPath(catalogRelativePath), 'utf8'));
}

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function normalizeTableName(value) {
  return String(value || '').replace(/\\+$/g, '').trim();
}

function normalizeIdentifier(value) {
  return String(value || '')
    .replace(/\\/g, '')
    .replace(/[`'"]/g, '')
    .trim();
}

function normalizeColumns(columns) {
  return [...new Set((columns || []).map(normalizeIdentifier).filter(Boolean))];
}

function createIndexSignature(kind, columns) {
  return `${kind}:${normalizeColumns(columns).sort((left, right) => left.localeCompare(right)).join('|')}`;
}

function parseEntityImports(entityAggregatorPath) {
  const entityAggregator = fs.readFileSync(resolveSsotRepoPath(entityAggregatorPath), 'utf8');
  return [...entityAggregator.matchAll(/from\s+'(\.\/modules\/[^']+)'/g)].map(match =>
    normalizePath(
      path.join(path.dirname(entityAggregatorPath), `${match[1].replace(/^\.\//, '')}.ts`)
    )
  );
}

function collectFiles(relativePath) {
  const fullPath = resolveSsotRepoPath(relativePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const stats = fs.statSync(fullPath);
  if (!stats.isDirectory()) {
    return relativePath.endsWith('.ts') ? [relativePath] : [];
  }

  const results = [];
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    const childRelativePath = normalizePath(path.join(relativePath, entry.name));
    if (entry.isDirectory()) {
      results.push(...collectFiles(childRelativePath));
      continue;
    }
    if (entry.name.endsWith('.ts')) {
      results.push(childRelativePath);
    }
  }

  return results;
}

function parseEntityTables(entityRoot) {
  const tableToFiles = new Map();

  for (const filePath of collectFiles(entityRoot)) {
    const text = fs.readFileSync(resolveSsotRepoPath(filePath), 'utf8');
    let match;
    while ((match = tableDecoratorPattern.exec(text))) {
      const tableName = normalizeTableName(match[1]);
      const current = tableToFiles.get(tableName) || [];
      current.push(filePath);
      tableToFiles.set(tableName, current);
    }
    tableDecoratorPattern.lastIndex = 0;
  }

  return tableToFiles;
}

function parseMigrationTouchedTables(migrationPath) {
  const text = toForwardMigrationText(resolveMigrationTemplateStrings(
    fs.readFileSync(resolveSsotRepoPath(migrationPath), 'utf8')
  ));
  const touchedTables = new Set();

  for (const pattern of migrationTablePatterns) {
    let match;
    while ((match = pattern.exec(text))) {
      touchedTables.add(normalizeTableName(match[1]));
    }
    pattern.lastIndex = 0;
  }

  let constantMatch;
  while ((constantMatch = tableConstantPattern.exec(text))) {
    touchedTables.add(normalizeTableName(constantMatch[1]));
  }
  tableConstantPattern.lastIndex = 0;

  return [...touchedTables].sort((left, right) => left.localeCompare(right));
}

function extractStringConstants(text) {
  const constants = new Map();
  let match;
  while ((match = stringConstantPattern.exec(text))) {
    constants.set(String(match[1] || '').trim(), String(match[2] || '').trim());
  }
  stringConstantPattern.lastIndex = 0;
  return constants;
}

function resolveMigrationTemplateStrings(text) {
  const constants = extractStringConstants(text);
  return text.replace(/\$\{([A-Za-z0-9_]+)\}/g, (fullMatch, identifier) => {
    return constants.has(identifier) ? constants.get(identifier) : fullMatch;
  });
}

function stripExportedFunctionBodies(text, functionNames) {
  let output = text;

  for (const functionName of functionNames) {
    let searchIndex = output.indexOf(`export async function ${functionName}`);

    while (searchIndex >= 0) {
      const bodyOpenIndex = output.indexOf('{', searchIndex);
      if (bodyOpenIndex < 0) {
        break;
      }

      let braceDepth = 1;
      let cursor = bodyOpenIndex + 1;
      while (cursor < output.length && braceDepth > 0) {
        const current = output[cursor];
        if (current === '{') {
          braceDepth += 1;
        } else if (current === '}') {
          braceDepth -= 1;
        }
        cursor += 1;
      }

      if (braceDepth !== 0) {
        break;
      }

      output = `${output.slice(0, searchIndex)}\n${output.slice(cursor)}`;
      searchIndex = output.indexOf(`export async function ${functionName}`);
    }
  }

  return output;
}

function toForwardMigrationText(text) {
  return stripExportedFunctionBodies(text, ['down']);
}

function ensureArrayConfig(failures, groupId, fieldName, values) {
  if (!Array.isArray(values)) {
    failures.push(`ownershipGroups.${groupId}.${fieldName} 未配置数组。`);
    return [];
  }
  return values;
}

function hasNamespaceMatch(tableName, tableNamespaces) {
  return tableNamespaces.some(namespace => tableName === namespace || tableName.startsWith(namespace));
}

function parseDecoratorBlock(lines, startIndex) {
  const collected = [];
  let balance = 0;
  let started = false;
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    collected.push(line);
    for (const char of line) {
      if (char === '(') {
        balance += 1;
        started = true;
      } else if (char === ')') {
        balance -= 1;
      }
    }
    if (started && balance <= 0) {
      break;
    }
    index += 1;
  }

  return {
    text: collected.join('\n'),
    nextIndex: index,
  };
}

function findNextPropertyName(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('//')) {
      continue;
    }
    if (trimmed.startsWith('@')) {
      continue;
    }
    const match = trimmed.match(/^([A-Za-z0-9_]+)\??\s*:/);
    if (match) {
      return match[1];
    }
    break;
  }
  return null;
}

function parseIndexColumnsFromDecoratorText(text) {
  const arrayMatch = text.match(/\[([^\]]+)\]/s);
  if (!arrayMatch) {
    return [];
  }
  return normalizeColumns(
    [...arrayMatch[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(match => match[1])
  );
}

function createEntityIndexDescriptor(kind, columns) {
  const normalizedColumns = normalizeColumns(columns);
  return {
    kind,
    columns: normalizedColumns,
    signature: createIndexSignature(kind, normalizedColumns),
  };
}

function parseColumnNameFromDecoratorText(text, propertyName) {
  const explicitNameMatch = text.match(/name\s*:\s*['"`]([^'"`]+)['"`]/);
  return explicitNameMatch ? normalizeIdentifier(explicitNameMatch[1]) : propertyName;
}

function mapEntityIndexColumns(columns, propertyToColumnMap) {
  return normalizeColumns(
    (columns || []).map(column => propertyToColumnMap.get(column) || column)
  );
}

function parseIndexDecoratorText(text, propertyName = null) {
  const kind = /unique\s*:\s*true/.test(text) ? 'unique' : 'index';
  const columns = propertyName ? [propertyName] : parseIndexColumnsFromDecoratorText(text);
  if (!columns.length) {
    return null;
  }
  return createEntityIndexDescriptor(kind, columns);
}

function parseEntitySchemaFile(filePath, baseEntityColumns) {
  const text = fs.readFileSync(resolveSsotRepoPath(filePath), 'utf8');
  const tableMatch = text.match(/@Entity\(['"]([^'"]+)['"]\)/);
  if (!tableMatch) {
    return null;
  }

  const tableName = normalizeTableName(tableMatch[1]);
  const lines = text.split(/\r?\n/);
  const columns = new Set();
  const indexMap = new Map();
  const propertyToColumnMap = new Map();
  const pendingClassIndexes = [];
  const extendsBaseEntity = /\bextends\s+BaseEntity\b/.test(text);

  if (extendsBaseEntity) {
    for (const columnName of baseEntityColumns) {
      columns.add(columnName);
    }
    indexMap.set(createIndexSignature('primary', ['id']), createEntityIndexDescriptor('primary', ['id']));
    for (const indexedBaseField of ['createTime', 'updateTime', 'tenantId']) {
      indexMap.set(
        createIndexSignature('index', [indexedBaseField]),
        createEntityIndexDescriptor('index', [indexedBaseField])
      );
    }
  }

  const classLineIndex = lines.findIndex(line => /\bexport class\b/.test(line));
  for (let index = 0; index >= 0 && index < classLineIndex; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed.startsWith('@Index(')) {
      continue;
    }
    const decorator = parseDecoratorBlock(lines, index);
    index = decorator.nextIndex;
    const descriptor = parseIndexDecoratorText(decorator.text);
    if (descriptor) {
      pendingClassIndexes.push(descriptor);
    }
  }

  const pendingPropertyIndexes = [];
  for (let index = classLineIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('@Index(')) {
      const decorator = parseDecoratorBlock(lines, index);
      index = decorator.nextIndex;
      pendingPropertyIndexes.push(decorator.text);
      continue;
    }

    if (
      trimmed.startsWith('@Column(') ||
      trimmed.startsWith('@PrimaryGeneratedColumn(')
    ) {
      const isPrimaryColumn = trimmed.startsWith('@PrimaryGeneratedColumn(');
      const decorator = parseDecoratorBlock(lines, index);
      const propertyName = findNextPropertyName(lines, decorator.nextIndex + 1);
      index = decorator.nextIndex;
      if (!propertyName) {
        pendingPropertyIndexes.length = 0;
        continue;
      }

      const columnName = parseColumnNameFromDecoratorText(decorator.text, propertyName);
      propertyToColumnMap.set(propertyName, columnName);
      columns.add(columnName);
      if (isPrimaryColumn) {
        indexMap.set(
          createIndexSignature('primary', [columnName]),
          createEntityIndexDescriptor('primary', [columnName])
        );
      }

      for (const pendingIndex of pendingPropertyIndexes.splice(0)) {
        const descriptor = parseIndexDecoratorText(pendingIndex, columnName);
        if (descriptor) {
          indexMap.set(descriptor.signature, descriptor);
        }
      }
      continue;
    }

    if (trimmed === '}') {
      break;
    }
  }

  for (const descriptor of pendingClassIndexes) {
    const mappedColumns = mapEntityIndexColumns(
      descriptor.columns,
      propertyToColumnMap
    );
    const mappedDescriptor = createEntityIndexDescriptor(
      descriptor.kind,
      mappedColumns
    );
    indexMap.set(mappedDescriptor.signature, mappedDescriptor);
  }

  return {
    tableName,
    filePath,
    columns: [...columns].sort((left, right) => left.localeCompare(right)),
    indexes: [...indexMap.values()].sort((left, right) => left.signature.localeCompare(right.signature)),
  };
}

function parseEntitySchemas(entityRoots, baseEntityColumns) {
  const tableSchemas = new Map();
  const duplicateTables = [];

  for (const entityRoot of entityRoots) {
    for (const filePath of collectFiles(entityRoot)) {
      const parsed = parseEntitySchemaFile(filePath, baseEntityColumns);
      if (!parsed) {
        continue;
      }
      if (tableSchemas.has(parsed.tableName)) {
        duplicateTables.push(
          `${parsed.tableName} -> ${tableSchemas.get(parsed.tableName).filePath}, ${parsed.filePath}`
        );
        continue;
      }
      tableSchemas.set(parsed.tableName, parsed);
    }
  }

  return {
    tableSchemas,
    duplicateTables,
  };
}

function parseSqlColumnsAndIndexes(tableDefinition) {
  const columns = new Set();
  const indexMap = new Map();
  const lines = tableDefinition
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const normalizedLine = line.replace(/,$/, '');
    if (/^\\?`/.test(normalizedLine)) {
      const columnMatch = normalizedLine.match(/^\\?`([^`]+)\\?`/);
      if (columnMatch) {
        columns.add(normalizeIdentifier(columnMatch[1]));
      }
      continue;
    }

    const primaryMatch = normalizedLine.match(/^PRIMARY KEY\s*\(([^)]+)\)/i);
    if (primaryMatch) {
      const descriptor = createEntityIndexDescriptor(
        'primary',
        [...primaryMatch[1].matchAll(/\\?`([^`]+)\\?`/g)].map(match => match[1])
      );
      indexMap.set(descriptor.signature, descriptor);
      continue;
    }

    const uniqueMatch = normalizedLine.match(/^UNIQUE KEY\s+\\?`[^`]+\\?`\s*\(([^)]+)\)/i);
    if (uniqueMatch) {
      const descriptor = createEntityIndexDescriptor(
        'unique',
        [...uniqueMatch[1].matchAll(/\\?`([^`]+)\\?`/g)].map(match => match[1])
      );
      indexMap.set(descriptor.signature, descriptor);
      continue;
    }

    const indexMatch = normalizedLine.match(/^KEY\s+\\?`[^`]+\\?`\s*\(([^)]+)\)/i);
    if (indexMatch) {
      const descriptor = createEntityIndexDescriptor(
        'index',
        [...indexMatch[1].matchAll(/\\?`([^`]+)\\?`/g)].map(match => match[1])
      );
      indexMap.set(descriptor.signature, descriptor);
    }
  }

  return {
    columns: [...columns].sort((left, right) => left.localeCompare(right)),
    indexes: [...indexMap.values()].sort((left, right) => left.signature.localeCompare(right.signature)),
  };
}

function parseCreateTableBlocks(text) {
  const tableMap = new Map();
  const createTablePattern =
    /CREATE TABLE(?: IF NOT EXISTS)?\s+\\?`([^`$]+)\\?`\s*\(([\s\S]*?)\)\s*ENGINE=/g;
  let match;
  while ((match = createTablePattern.exec(text))) {
    tableMap.set(normalizeTableName(match[1]), parseSqlColumnsAndIndexes(match[2]));
  }
  return tableMap;
}

function applyMigrationAlterStatements(text, tableSchemas) {
  function ensureMutableSchema(tableName) {
    if (!tableSchemas.has(tableName)) {
      return null;
    }
    const schema = tableSchemas.get(tableName);
    return {
      schema,
      columnSet: new Set(schema.columns || []),
      indexMap: new Map((schema.indexes || []).map(item => [item.signature, item])),
    };
  }

  function commitMutableSchema(tableName, mutable) {
    if (!mutable) {
      return;
    }
    tableSchemas.set(tableName, {
      ...mutable.schema,
      columns: [...mutable.columnSet].sort((left, right) => left.localeCompare(right)),
      indexes: [...mutable.indexMap.values()].sort((left, right) =>
        left.signature.localeCompare(right.signature)
      ),
    });
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?ADD COLUMN\s+\\?`([^`]+)\\?`/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const columnName = normalizeIdentifier(match[2]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    mutable.columnSet.add(columnName);
    commitMutableSchema(tableName, mutable);
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?DROP COLUMN\s+\\?`([^`]+)\\?`/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const columnName = normalizeIdentifier(match[2]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    mutable.columnSet.delete(columnName);
    for (const [signature, descriptor] of mutable.indexMap.entries()) {
      if ((descriptor.columns || []).includes(columnName)) {
        mutable.indexMap.delete(signature);
      }
    }
    commitMutableSchema(tableName, mutable);
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?ADD PRIMARY KEY\s*\(([^)]+)\)/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    const descriptor = createEntityIndexDescriptor(
      'primary',
      [...match[2].matchAll(/\\?`([^`]+)\\?`/g)].map(item => item[1])
    );
    mutable.indexMap.set(descriptor.signature, descriptor);
    commitMutableSchema(tableName, mutable);
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?ADD UNIQUE(?: KEY| INDEX)?(?:\s+\\?`[^`]+\\?`)?\s*\(([^)]+)\)/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    const descriptor = createEntityIndexDescriptor(
      'unique',
      [...match[2].matchAll(/\\?`([^`]+)\\?`/g)].map(item => item[1])
    );
    mutable.indexMap.set(descriptor.signature, descriptor);
    commitMutableSchema(tableName, mutable);
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?ADD (?:INDEX|KEY)(?:\s+\\?`[^`]+\\?`)?\s*\(([^)]+)\)/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    const descriptor = createEntityIndexDescriptor(
      'index',
      [...match[2].matchAll(/\\?`([^`]+)\\?`/g)].map(item => item[1])
    );
    mutable.indexMap.set(descriptor.signature, descriptor);
    commitMutableSchema(tableName, mutable);
  }

  for (const match of text.matchAll(
    /ALTER TABLE\s+\\?`([^`$]+)\\?`[\s\S]*?DROP PRIMARY KEY/gi
  )) {
    const tableName = normalizeTableName(match[1]);
    const mutable = ensureMutableSchema(tableName);
    if (!mutable) {
      continue;
    }
    for (const [signature, descriptor] of mutable.indexMap.entries()) {
      if (descriptor.kind === 'primary') {
        mutable.indexMap.delete(signature);
      }
    }
    commitMutableSchema(tableName, mutable);
  }
}

function parseMigrationCreateTableSchemas(migrationFiles, migrationRoot) {
  const tableSchemas = new Map();
  const duplicateTables = [];

  for (const migrationFile of migrationFiles) {
    const relativePath = normalizePath(path.join(migrationRoot, migrationFile));
    const text = toForwardMigrationText(resolveMigrationTemplateStrings(
      fs.readFileSync(resolveSsotRepoPath(relativePath), 'utf8')
    ));
    for (const [tableName, schema] of parseCreateTableBlocks(text).entries()) {
      if (tableSchemas.has(tableName)) {
        duplicateTables.push(`${tableName} -> ${tableSchemas.get(tableName).migrationFile}, ${migrationFile}`);
        continue;
      }
      tableSchemas.set(tableName, {
        ...schema,
        migrationFile,
      });
    }
    applyMigrationAlterStatements(text, tableSchemas);
  }

  return {
    tableSchemas,
    duplicateTables,
  };
}

function compareFieldIndexParity(failures, groupId, entitySchema, migrationSchema) {
  if (!migrationSchema) {
    failures.push(`ownershipGroups.${groupId} 缺少 CREATE TABLE 基线，无法执行字段/索引 parity: ${entitySchema.tableName}`);
    return;
  }

  const entityColumns = new Set(entitySchema.columns);
  const migrationColumns = new Set(migrationSchema.columns);

  const missingInMigration = entitySchema.columns.filter(column => !migrationColumns.has(column));
  const staleInMigration = migrationSchema.columns.filter(column => !entityColumns.has(column));
  if (missingInMigration.length) {
    failures.push(
      `ownershipGroups.${groupId} 表 ${entitySchema.tableName} migration 缺少实体列: ${missingInMigration.join(', ')}`
    );
  }
  if (staleInMigration.length) {
    failures.push(
      `ownershipGroups.${groupId} 表 ${entitySchema.tableName} migration 多出实体未声明列: ${staleInMigration.join(', ')}`
    );
  }

  const entityIndexMap = new Map(entitySchema.indexes.map(item => [item.signature, item]));
  const migrationIndexMap = new Map(migrationSchema.indexes.map(item => [item.signature, item]));
  const missingIndexes = entitySchema.indexes
    .filter(item => !migrationIndexMap.has(item.signature))
    .map(item => item.signature);
  const staleIndexes = migrationSchema.indexes
    .filter(item => !entityIndexMap.has(item.signature))
    .map(item => item.signature);

  if (missingIndexes.length) {
    failures.push(
      `ownershipGroups.${groupId} 表 ${entitySchema.tableName} migration 缺少实体索引: ${missingIndexes.join(', ')}`
    );
  }
  if (staleIndexes.length) {
    failures.push(
      `ownershipGroups.${groupId} 表 ${entitySchema.tableName} migration 多出实体未声明索引: ${staleIndexes.join(', ')}`
    );
  }
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

  if (
    !Array.isArray(sourcePaths.schemaBootstrapEntrypoints) ||
    sourcePaths.schemaBootstrapEntrypoints.length === 0
  ) {
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

  const fieldIndexParityConfig = catalog.fieldIndexParity || {};
  const fieldIndexParityGroups = new Set(
    Array.isArray(fieldIndexParityConfig.enabledOwnershipGroups)
      ? fieldIndexParityConfig.enabledOwnershipGroups.map(item => String(item || '').trim()).filter(Boolean)
      : []
  );
  const excludedTablesByOwnershipGroup = fieldIndexParityConfig.excludedTablesByOwnershipGroup || {};
  const baseEntityColumns = Array.isArray(fieldIndexParityConfig.baseEntityColumns)
    ? fieldIndexParityConfig.baseEntityColumns.map(item => String(item || '').trim()).filter(Boolean)
    : ['id', 'createTime', 'updateTime', 'tenantId'];

  const declaredMigrationFiles = new Map();
  const declaredEntityRoots = [];
  const declaredTableOwners = new Map();
  const migrationCoverageByGroup = new Map();

  for (const group of ownershipGroups) {
    if (!group.id) {
      failures.push('ownershipGroups 存在缺少 id 的条目。');
      continue;
    }

    const entityRoots = ensureArrayConfig(failures, group.id, 'entityRoots', group.entityRoots);
    const migrationFiles = ensureArrayConfig(failures, group.id, 'migrationFiles', group.migrationFiles);
    const tableNamespaces = ensureArrayConfig(failures, group.id, 'tableNamespaces', group.tableNamespaces);
    const entityTables = ensureArrayConfig(failures, group.id, 'entityTables', group.entityTables);
    const migrationOnlyTables = ensureArrayConfig(
      failures,
      group.id,
      'migrationOnlyTables',
      group.migrationOnlyTables
    );

    for (const entityRoot of entityRoots) {
      declaredEntityRoots.push(entityRoot);
      if (!fs.existsSync(resolveSsotRepoPath(entityRoot))) {
        failures.push(`ownershipGroups.${group.id} entityRoot 不存在: ${entityRoot}`);
      }
    }

    for (const migrationFile of migrationFiles) {
      if (declaredMigrationFiles.has(migrationFile)) {
        failures.push(
          `migration 文件重复归属: ${migrationFile} 同时出现在 ${declaredMigrationFiles.get(migrationFile)} 与 ${group.id}`
        );
        continue;
      }
      declaredMigrationFiles.set(migrationFile, group.id);
    }

    const entityTableMap = new Map();
    for (const entityRoot of entityRoots) {
      for (const [tableName, filePaths] of parseEntityTables(entityRoot).entries()) {
        const current = entityTableMap.get(tableName) || [];
        current.push(...filePaths);
        entityTableMap.set(tableName, current);
      }
    }

    const declaredEntityTableSet = new Set(entityTables);
    const declaredAllTableSet = new Set([...entityTables, ...migrationOnlyTables]);

    for (const [tableName, filePaths] of entityTableMap.entries()) {
      if (filePaths.length > 1) {
        failures.push(
          `ownershipGroups.${group.id} 存在重复实体表声明: ${tableName} -> ${filePaths.join(', ')}`
        );
      }
      if (!declaredEntityTableSet.has(tableName)) {
        failures.push(`ownershipGroups.${group.id} 缺少 entityTables 登记: ${tableName}`);
      }
    }

    for (const tableName of entityTables) {
      if (!entityTableMap.has(tableName)) {
        failures.push(`ownershipGroups.${group.id} entityTables 登记但未找到实体: ${tableName}`);
      }
    }

    for (const tableName of declaredAllTableSet) {
      if (!hasNamespaceMatch(tableName, tableNamespaces)) {
        failures.push(
          `ownershipGroups.${group.id} 表 ${tableName} 未命中任何 tableNamespaces: ${tableNamespaces.join(', ')}`
        );
      }
      if (declaredTableOwners.has(tableName)) {
        failures.push(
          `表重复归属: ${tableName} 同时出现在 ${declaredTableOwners.get(tableName)} 与 ${group.id}`
        );
        continue;
      }
      declaredTableOwners.set(tableName, group.id);
    }

    const migrationTouchedTables = new Set();
    for (const migrationFile of migrationFiles) {
      const fullMigrationPath = resolveSsotRepoPath(path.join(sourcePaths.migrationRoot || '', migrationFile));
      if (!fs.existsSync(fullMigrationPath)) {
        failures.push(`catalog 登记的 migration 文件不存在: ${migrationFile}`);
        continue;
      }

      for (const tableName of parseMigrationTouchedTables(
        normalizePath(path.join(sourcePaths.migrationRoot || '', migrationFile))
      )) {
        migrationTouchedTables.add(tableName);
        if (!declaredAllTableSet.has(tableName)) {
          failures.push(`ownershipGroups.${group.id} 的 migration ${migrationFile} 触达未登记表: ${tableName}`);
        }
      }
    }

    migrationCoverageByGroup.set(group.id, migrationTouchedTables);

    for (const tableName of declaredAllTableSet) {
      if (!migrationTouchedTables.has(tableName)) {
        failures.push(`ownershipGroups.${group.id} 登记的表未被所属 migration 覆盖: ${tableName}`);
      }
    }

    if (fieldIndexParityGroups.has(group.id)) {
      const excludedTables = new Set(
        Array.isArray(excludedTablesByOwnershipGroup[group.id])
          ? excludedTablesByOwnershipGroup[group.id].map(item => String(item || '').trim()).filter(Boolean)
          : []
      );
      const entitySchemas = parseEntitySchemas(entityRoots, baseEntityColumns);
      for (const duplicateTable of entitySchemas.duplicateTables) {
        failures.push(`ownershipGroups.${group.id} 字段/索引 parity 存在重复实体 schema: ${duplicateTable}`);
      }

      const migrationSchemas = parseMigrationCreateTableSchemas(migrationFiles, sourcePaths.migrationRoot || '');
      for (const duplicateTable of migrationSchemas.duplicateTables) {
        failures.push(`ownershipGroups.${group.id} 字段/索引 parity 存在重复 migration CREATE TABLE: ${duplicateTable}`);
      }

      for (const tableName of entityTables) {
        if (excludedTables.has(tableName)) {
          continue;
        }
        const entitySchema = entitySchemas.tableSchemas.get(tableName);
        if (!entitySchema) {
          continue;
        }
        const migrationSchema = migrationSchemas.tableSchemas.get(tableName);
        compareFieldIndexParity(failures, group.id, entitySchema, migrationSchema);
      }
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
  }

  const entityAggregatorPath = sourcePaths.entityAggregator;
  if (entityAggregatorPath && fs.existsSync(resolveSsotRepoPath(entityAggregatorPath))) {
    const entityImports = parseEntityImports(entityAggregatorPath);
    for (const importedEntityPath of entityImports) {
      if (!fs.existsSync(resolveSsotRepoPath(importedEntityPath))) {
        failures.push(`entities.ts 引用的实体文件不存在: ${importedEntityPath}`);
        continue;
      }
      if (
        !declaredEntityRoots.some(
          entityRoot =>
            importedEntityPath.startsWith(`${entityRoot}/`) || importedEntityPath === `${entityRoot}.ts`
        )
      ) {
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

  const declaredTableCount = [...declaredTableOwners.keys()].length;
  console.log(
    `[${guardName}] PASS: 已校验 ${ownershipGroups.length} 个 ownership groups、${declaredMigrationFiles.size} 个 migration 文件与 ${declaredTableCount} 张登记表。`
  );
}

main();
