#!/usr/bin/env node

/**
 * 守卫 base 权限域的 SSOT 生成链。
 * 这里只负责校验 source.json、source.mjs 与 generated 权限产物之间的一致性，不负责修复菜单内容或运行时鉴权逻辑。
 * 关键依赖是 base/domain/permissions/source.json、source.mjs 和 generate-permissions.mjs。
 * 维护重点：配置、纯计算入口和 generated 文件必须共源，不能重新回到脚本或 generated 文件各自维护规则。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { generatePermissions } from './generate-permissions.mjs';
import {
  collectPermissionModel,
  loadBasePermissionSourceConfig,
  resolveBasePermissionUsageAllowedFiles,
  resolveBasePermissionUsageIgnoredPathSegments,
  resolveBasePermissionUsageScanExtensions,
  resolveBasePermissionOwnedSourceFiles,
  resolveBasePermissionUsageScanRoots,
} from '../cool-admin-midway/src/modules/base/domain/permissions/source.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function fail(message) {
  console.error(`[base-permission-domain-ssot] ${message}`);
  process.exit(1);
}

function ensureUnique(items, label) {
  if (new Set(items).size !== items.length) {
    fail(`${label} 存在重复项。`);
  }
}

function main() {
  const sourceConfig = loadBasePermissionSourceConfig(repoRoot);

  if (!sourceConfig.menuSourcePath) {
    fail('source.json 缺少 menuSourcePath。');
  }

  if (!sourceConfig.generatedTargets.length) {
    fail('source.json 缺少 generatedTargets。');
  }

  if (!sourceConfig.writeActions.length) {
    fail('source.json 缺少 writeActions。');
  }

  if (!sourceConfig.permissionUsageScanRoots.length) {
    fail('source.json 缺少 permissionUsageScanRoots。');
  }

  if (!sourceConfig.permissionUsageIgnoredPathSegments.length) {
    fail('source.json 缺少 permissionUsageIgnoredPathSegments。');
  }

  if (!sourceConfig.permissionUsageAllowedFiles.length) {
    fail('source.json 缺少 permissionUsageAllowedFiles。');
  }

  if (!sourceConfig.permissionUsageScanExtensions.length) {
    fail('source.json 缺少 permissionUsageScanExtensions。');
  }

  if (!Object.keys(sourceConfig.routePermissionPriority).length) {
    fail('source.json 缺少 routePermissionPriority。');
  }

  ensureUnique(sourceConfig.generatedTargets, 'generatedTargets');
  ensureUnique(sourceConfig.ownedSourceFiles, 'ownedSourceFiles');
  ensureUnique(sourceConfig.permissionUsageScanRoots, 'permissionUsageScanRoots');
  ensureUnique(
    sourceConfig.permissionUsageIgnoredPathSegments,
    'permissionUsageIgnoredPathSegments'
  );
  ensureUnique(
    sourceConfig.permissionUsageAllowedFiles,
    'permissionUsageAllowedFiles'
  );
  ensureUnique(
    sourceConfig.permissionUsageScanExtensions,
    'permissionUsageScanExtensions'
  );
  ensureUnique(sourceConfig.writeActions, 'writeActions');

  const menuSourceFile = path.join(repoRoot, sourceConfig.menuSourcePath);
  if (!fs.existsSync(menuSourceFile)) {
    fail(`menuSourcePath 不存在：${sourceConfig.menuSourcePath}`);
  }

  for (const targetPath of sourceConfig.generatedTargets) {
    const absoluteTargetPath = path.join(repoRoot, targetPath);
    if (!fs.existsSync(absoluteTargetPath)) {
      fail(`generated target 不存在：${targetPath}`);
    }
  }

  for (const ownedSourceFile of resolveBasePermissionOwnedSourceFiles(repoRoot)) {
    const absoluteOwnedSourceFile = path.join(repoRoot, ownedSourceFile);
    if (!fs.existsSync(absoluteOwnedSourceFile)) {
      fail(`owned source file 不存在：${ownedSourceFile}`);
    }
  }

  for (const scanRoot of resolveBasePermissionUsageScanRoots(repoRoot)) {
    const absoluteScanRoot = path.join(repoRoot, scanRoot);
    if (!fs.existsSync(absoluteScanRoot)) {
      fail(`permission usage scan root 不存在：${scanRoot}`);
    }
  }

  for (const allowedFile of resolveBasePermissionUsageAllowedFiles(repoRoot)) {
    const absoluteAllowedFile = path.join(repoRoot, allowedFile);
    if (!fs.existsSync(absoluteAllowedFile)) {
      fail(`permission usage allowed file 不存在：${allowedFile}`);
    }
  }

  for (const extension of resolveBasePermissionUsageScanExtensions(repoRoot)) {
    if (!extension.startsWith('.')) {
      fail(`permission usage scan extension 必须以 . 开头：${extension}`);
    }
  }

  const allowedFileSet = new Set(resolveBasePermissionUsageAllowedFiles(repoRoot));
  for (const ownedSourceFile of resolveBasePermissionOwnedSourceFiles(repoRoot)) {
    if (!allowedFileSet.has(ownedSourceFile)) {
      fail(
        `permissionUsageAllowedFiles 必须覆盖 ownedSourceFiles：${ownedSourceFile}`
      );
    }
  }

  const menuTree = JSON.parse(fs.readFileSync(menuSourceFile, 'utf8'));
  const model = collectPermissionModel(menuTree, {
    writeActions: sourceConfig.writeActions,
    routePermissionPriority: sourceConfig.routePermissionPriority,
  });

  if (!model.permissionKeys.length) {
    fail('source.mjs 生成的权限模型为空。');
  }

  if (!model.routeEntries.length) {
    fail('source.mjs 生成的路由权限模型为空。');
  }

  const generationResult = generatePermissions({ check: true });
  if (generationResult.changedFiles.length) {
    fail(
      `generated 权限产物已漂移：${generationResult.changedFiles
        .map(item => path.relative(repoRoot, item))
        .join(', ')}`
    );
  }

  const permissionsGeneratedFile = path.join(
    repoRoot,
    'cool-admin-midway/src/modules/base/generated/permissions.generated.ts'
  );
  const permissionsGeneratedSource = fs.readFileSync(
    permissionsGeneratedFile,
    'utf8'
  );

  if (
    !permissionsGeneratedSource.includes(
      `export const PERMISSION_SOURCE_FILE = ${JSON.stringify(
        sourceConfig.menuSourcePath
      )};`
    )
  ) {
    fail('permissions.generated.ts 中的 PERMISSION_SOURCE_FILE 与 source.json 不一致。');
  }

  const checkPermissionsScript = fs.readFileSync(
    path.join(repoRoot, 'scripts/check-permissions.mjs'),
    'utf8'
  );
  if (
    !checkPermissionsScript.includes('resolveBasePermissionUsageAllowedFiles') ||
    !checkPermissionsScript.includes(
      'resolveBasePermissionUsageIgnoredPathSegments'
    ) ||
    !checkPermissionsScript.includes('resolveBasePermissionUsageScanExtensions') ||
    !checkPermissionsScript.includes('resolveBasePermissionUsageScanRoots')
  ) {
    fail('check-permissions.mjs 没有完整复用 base domain source helper。');
  }

  if (checkPermissionsScript.includes('const SCAN_DIRECTORIES = [')) {
    fail('check-permissions.mjs 仍然本地维护 SCAN_DIRECTORIES。');
  }

  if (checkPermissionsScript.includes("const IGNORED_SEGMENTS = ['/generated/'")) {
    fail('check-permissions.mjs 仍然本地维护 IGNORED_SEGMENTS。');
  }

  if (
    checkPermissionsScript.includes(
      "['.ts', '.tsx', '.js', '.mjs', '.vue', '.json']"
    )
  ) {
    fail('check-permissions.mjs 仍然本地维护扫描扩展名白名单。');
  }

  console.log(
    `[base-permission-domain-ssot] passed (${model.permissionKeys.length} permissions, ${model.routeEntries.length} routes)`
  );
}

main();
