/**
 * Base super-admin migration audit regression tests.
 * This file validates the audit classifier for patched, legacy-applied, and broken role-binding states.
 * It does not connect to a live database.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditScriptPath = path.join(
  __dirname,
  '../../scripts/audit-base-super-admin-link.mjs'
);

const { evaluateSuperAdminLinkAudit } = await import(pathToFileURL(auditScriptPath).href);

test('patched no-op environment should pass without failures', () => {
  const result = evaluateSuperAdminLinkAudit({
    hasMigrationTable: true,
    migrationApplied: true,
    migrationAppliedAt: '2026-04-21 12:00:00',
    adminUser: { id: 1, username: 'admin' },
    adminRoles: [
      {
        id: 9,
        label: 'system_root',
        isSuperAdmin: 1,
        userRoleCreateTime: '2026-04-20 10:00:00',
        roleCreateTime: '2026-04-20 10:00:00',
      },
    ],
    hasMigrationStateTable: true,
    migrationStateRow: null,
    approvalNode: { id: 8, resolverValue: '1' },
  });

  assert.equal(result.failures.length, 0);
  assert.ok(
    result.passes.some(item => item.scope === 'cool_schema_migration_state')
  );
});

test('legacy-applied environment without migration state table should fail', () => {
  const result = evaluateSuperAdminLinkAudit({
    hasMigrationTable: true,
    migrationApplied: true,
    migrationAppliedAt: '2026-04-21 12:00:00',
    adminUser: { id: 1, username: 'admin' },
    adminRoles: [
      {
        id: 9,
        label: 'system_root',
        isSuperAdmin: 1,
        userRoleCreateTime: '2026-04-21 12:00:00',
        roleCreateTime: '2026-04-21 12:00:00',
      },
    ],
    hasMigrationStateTable: false,
    migrationStateRow: null,
    approvalNode: { id: 8, resolverValue: '1' },
  });

  assert.ok(result.failures.some(item => item.scope === 'cool_schema_migration_state'));
  assert.ok(result.failures.some(item => item.scope === 'base_sys_user_role'));
  assert.ok(result.failures.some(item => item.scope === '20260421110000.forensics'));
});

test('missing super-admin role binding should fail even on patched environment', () => {
  const result = evaluateSuperAdminLinkAudit({
    hasMigrationTable: true,
    migrationApplied: true,
    migrationAppliedAt: '2026-04-21 12:00:00',
    adminUser: { id: 1, username: 'admin' },
    adminRoles: [
      {
        id: 3,
        label: 'performance_hr',
        isSuperAdmin: 0,
        userRoleCreateTime: '2026-04-20 10:00:00',
        roleCreateTime: '2026-04-20 09:00:00',
      },
    ],
    hasMigrationStateTable: true,
    migrationStateRow: { id: 1, payload: '{}' },
    approvalNode: { id: 8, resolverValue: '1' },
  });

  assert.ok(
    result.failures.some(item => item.scope === 'base_sys_role.isSuperAdmin')
  );
});
