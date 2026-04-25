#!/usr/bin/env node

/**
 * 负责校验仓库级 RBAC registry 是否把菜单拓扑、权限位主源和 performance 角色目录收敛到单一入口。
 * 不负责生成权限产物，也不替代更细粒度的 permission/state/runtime 守卫。
 * 关键依赖是 contracts/ssot/rbac-domain.catalog.json、menu-route-topology catalog、base permission source 和 performance role manifest。
 * 维护重点：repo 级 RBAC 主源只能做绑定与闭环校验，不能重新引入新的影子真相。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadXuedaoSsotManifest } from './xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const RBAC_DOMAIN_CATALOG_PATH = 'contracts/ssot/rbac-domain.catalog.json';
const MENU_ROUTE_TOPOLOGY_CATALOG_PATH =
  'contracts/ssot/menu-route-topology.catalog.json';
const BASE_PERMISSION_SOURCE_PATH =
  'cool-admin-midway/src/modules/base/domain/permissions/source.json';
const PERFORMANCE_ROLE_CATALOG_PATH =
  'cool-admin-midway/src/modules/performance/domain/roles/catalog.ts';
function fail(message) {
  console.error(`[rbac-domain-ssot] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`文件不存在：${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function ensurePathExists(relativePath, label) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    fail(`${label} 不存在：${relativePath}`);
  }
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

function main() {
  const rbacCatalog = readJson(RBAC_DOMAIN_CATALOG_PATH);
  const topologyCatalog = readJson(MENU_ROUTE_TOPOLOGY_CATALOG_PATH);
  const basePermissionSource = readJson(BASE_PERMISSION_SOURCE_PATH);
  const manifest = loadXuedaoSsotManifest();
  const roleCatalogText = fs.readFileSync(
    path.join(repoRoot, PERFORMANCE_ROLE_CATALOG_PATH),
    'utf8'
  );

  if (String(rbacCatalog.owner || '').trim() !== 'repo-governance') {
    fail('rbac-domain catalog owner 必须是 repo-governance。');
  }

  if (String(rbacCatalog.menuTopologySource || '').trim() !== MENU_ROUTE_TOPOLOGY_CATALOG_PATH) {
    fail('rbac-domain catalog 必须把 menuTopologySource 指向 menu-route-topology.catalog.json。');
  }

  const permissionBitsSourceFiles = normalizeList(
    rbacCatalog.permissionBitsSourceFiles
  );
  const roleCatalogSourceFiles = normalizeList(rbacCatalog.roleCatalogSourceFiles);
  const writablePrimarySources = normalizeList(rbacCatalog.writablePrimarySources);

  if (!permissionBitsSourceFiles.length) {
    fail('rbac-domain catalog 缺少 permissionBitsSourceFiles。');
  }

  if (!roleCatalogSourceFiles.length) {
    fail('rbac-domain catalog 缺少 roleCatalogSourceFiles。');
  }

  if (!writablePrimarySources.length) {
    fail('rbac-domain catalog 缺少 writablePrimarySources。');
  }

  ensurePathExists(MENU_ROUTE_TOPOLOGY_CATALOG_PATH, 'menu topology catalog');
  ensurePathExists(PERFORMANCE_ROLE_CATALOG_PATH, 'performance role catalog');

  for (const relativePath of [
    ...permissionBitsSourceFiles,
    ...roleCatalogSourceFiles,
    ...writablePrimarySources,
    ...normalizeList(rbacCatalog.supportingGuards),
    ...normalizeList(rbacCatalog.generatedConsumers),
  ]) {
    ensurePathExists(relativePath, 'rbac-domain 依赖');
  }

  if (String(topologyCatalog.primarySource || '').trim() !== String(basePermissionSource.menuSourcePath || '').trim()) {
    fail('menu-route-topology.primarySource 与 permission source.menuSourcePath 不一致。');
  }

  assertSameSet(
    topologyCatalog.permissionSources,
    permissionBitsSourceFiles,
    'menu-route-topology.permissionSources 与 rbac-domain.permissionBitsSourceFiles'
  );

  const manifestPermissionBits =
    manifest.sourceOfTruth?.permissionBits?.sourceFiles || [];
  const manifestPerformanceRoles =
    manifest.sourceOfTruth?.performanceRoles?.sourceFiles || [];
  const manifestRbacDomain = manifest.sourceOfTruth?.rbacDomain?.sourceFile || '';

  assertSameSet(
    manifestPermissionBits,
    permissionBitsSourceFiles,
    'manifest.permissionBits.sourceFiles 与 rbac-domain.permissionBitsSourceFiles'
  );
  assertSameSet(
    manifestPerformanceRoles,
    roleCatalogSourceFiles,
    'manifest.performanceRoles.sourceFiles 与 rbac-domain.roleCatalogSourceFiles'
  );

  if (manifestRbacDomain !== RBAC_DOMAIN_CATALOG_PATH) {
    fail('manifest.rbacDomain.sourceFile 与 rbac-domain catalog 路径不一致。');
  }

  assertSameSet(
    [
      topologyCatalog.primarySource,
      ...permissionBitsSourceFiles,
      ...roleCatalogSourceFiles,
    ],
    writablePrimarySources,
    'rbac-domain.writablePrimarySources'
  );

  if (
    !roleCatalogText.includes('PerformanceRegisteredRoleKind') ||
    !roleCatalogText.includes('PERFORMANCE_PERSONA_ROLE_KIND_BY_KEY')
  ) {
    fail('performance 角色目录缺少关键角色事实源导出。');
  }

  console.log(
    `[rbac-domain-ssot] PASS (${permissionBitsSourceFiles.length} permission sources, ${roleCatalogSourceFiles.length} role catalogs)`
  );
}

main();
