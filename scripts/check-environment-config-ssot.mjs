#!/usr/bin/env node

/**
 * 负责校验仓库级环境变量 catalog 与受治理 runtime/config/automation roots 的变量命名是否一致。
 * 不负责修改任何配置文件，也不替代具体工作区对环境值合法性的业务校验。
 * 依赖 contracts/ssot/environment-config.catalog.json 与仓库内真实的 config/script 入口文件。
 * 维护重点：第一阶段只校验 curated scan roots，发现新入口时先补 catalog 再扩大扫描范围。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  resolveSsotRepoPath
} from './xuedao-ssot-manifest.mjs';

const guardName = 'environment-config-ssot';
const catalogRelativePath = 'contracts/ssot/environment-config.catalog.json';
const allowedFilePattern = /\.(mjs|cjs|js|ts|vue)$/;

function loadCatalog() {
  return JSON.parse(fs.readFileSync(resolveSsotRepoPath(catalogRelativePath), 'utf8'));
}

function normalizePath(value) {
  return value.replaceAll('\\', '/');
}

function collectFiles(relativePath) {
  const fullPath = resolveSsotRepoPath(relativePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const stats = fs.statSync(fullPath);
  if (!stats.isDirectory()) {
    return allowedFilePattern.test(relativePath) ? [relativePath] : [];
  }

  const files = [];
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    const childRelative = normalizePath(path.join(relativePath, entry.name));
    if (entry.isDirectory()) {
      files.push(...collectFiles(childRelative));
      continue;
    }
    if (allowedFilePattern.test(entry.name)) {
      files.push(childRelative);
    }
  }
  return files;
}

function collectDiscoveredVariables(scanRoots) {
  const variables = new Map();
  const patterns = [
    /process\.env\.([A-Z0-9_]+)/g,
    /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
    /import\.meta\.env\.([A-Z0-9_]+)/g,
    /runtimeEnv\?\.([A-Z0-9_]+)/g,
    /runtimeEnv\?\[['"]([A-Z0-9_]+)['"]\]/g
  ];

  for (const scanRoot of scanRoots) {
    for (const filePath of collectFiles(scanRoot)) {
      const text = fs.readFileSync(resolveSsotRepoPath(filePath), 'utf8');
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text))) {
          const current = variables.get(match[1]) || new Set();
          current.add(filePath);
          variables.set(match[1], current);
        }
      }
    }
  }

  return variables;
}

function isRegistered(variableName, exactVariables, patternVariables) {
  if (Object.hasOwn(exactVariables, variableName)) {
    return true;
  }

  return patternVariables.some(entry => new RegExp(entry.pattern).test(variableName));
}

function main() {
  const catalog = loadCatalog();
  const failures = [];

  if (!Array.isArray(catalog.scanRoots) || catalog.scanRoots.length === 0) {
    failures.push('scanRoots 未配置。');
  }

  for (const scanRoot of catalog.scanRoots || []) {
    if (!fs.existsSync(resolveSsotRepoPath(scanRoot))) {
      failures.push(`scanRoot 不存在: ${scanRoot}`);
    }
  }

  const exactVariables = catalog.exactVariables || {};
  const patternVariables = Array.isArray(catalog.patternVariables) ? catalog.patternVariables : [];

  for (const [variableName, meta] of Object.entries(exactVariables)) {
    if (!meta || typeof meta !== 'object') {
      failures.push(`exactVariables.${variableName} 缺少对象配置。`);
      continue;
    }
    if (!meta.classification) {
      failures.push(`exactVariables.${variableName} 缺少 classification。`);
    }
    if (typeof meta.sensitive !== 'boolean') {
      failures.push(`exactVariables.${variableName} 缺少 sensitive 布尔值。`);
    }
    if (typeof meta.required !== 'boolean') {
      failures.push(`exactVariables.${variableName} 缺少 required 布尔值。`);
    }
    if (!meta.description) {
      failures.push(`exactVariables.${variableName} 缺少 description。`);
    }
  }

  for (const patternVariable of patternVariables) {
    if (!patternVariable.id) {
      failures.push('patternVariables 存在缺少 id 的条目。');
    }
    if (!patternVariable.pattern) {
      failures.push(`patternVariables.${patternVariable.id || '(unknown)'} 缺少 pattern。`);
      continue;
    }
    try {
      // Validate regex syntax early.
      new RegExp(patternVariable.pattern);
    } catch (error) {
      failures.push(
        `patternVariables.${patternVariable.id || '(unknown)'} pattern 非法: ${error.message}`
      );
    }
    if (!patternVariable.classification) {
      failures.push(`patternVariables.${patternVariable.id || '(unknown)'} 缺少 classification。`);
    }
    if (typeof patternVariable.sensitive !== 'boolean') {
      failures.push(`patternVariables.${patternVariable.id || '(unknown)'} 缺少 sensitive 布尔值。`);
    }
    if (!patternVariable.description) {
      failures.push(`patternVariables.${patternVariable.id || '(unknown)'} 缺少 description。`);
    }
  }

  const discoveredVariables = collectDiscoveredVariables(catalog.scanRoots || []);
  for (const [variableName, fileSet] of [...discoveredVariables.entries()].sort((left, right) =>
    left[0].localeCompare(right[0])
  )) {
    if (!isRegistered(variableName, exactVariables, patternVariables)) {
      failures.push(
        `发现未登记环境变量 ${variableName}，来源: ${[...fileSet].sort().join(', ')}`
      );
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
    `[${guardName}] PASS: 已校验 ${(catalog.scanRoots || []).length} 个 scan roots，覆盖 ${discoveredVariables.size} 个变量名。`
  );
}

main();
