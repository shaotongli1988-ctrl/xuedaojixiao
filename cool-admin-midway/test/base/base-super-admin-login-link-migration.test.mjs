/**
 * Base super-admin login-link migration regression tests.
 * This file validates that the migration only backfills missing bindings, records rollback state, and reverts recorded changes.
 * It does not cover real MySQL execution or migration runner ordering.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(
  __dirname,
  '../../scripts/migrations/20260421110000-backfill-base-super-admin-login-link.mjs'
);

const migration = await import(pathToFileURL(migrationPath).href);

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function createMockConnection(overrides = {}) {
  const state = {
    tables: {
      base_sys_user: true,
      base_sys_role: true,
      base_sys_user_role: true,
      performance_approval_config: true,
      performance_approval_config_node: true,
      cool_schema_migration_state: false,
      ...(overrides.tables || {}),
    },
    users: overrides.users || [{ id: 1, username: 'admin' }],
    roles: overrides.roles || [],
    userRoles: overrides.userRoles || [],
    approvalConfigs:
      overrides.approvalConfigs || [{ id: 5, objectType: 'assetAssignmentRequest' }],
    approvalNodes:
      overrides.approvalNodes || [
        {
          id: 9,
          configId: 5,
          nodeCode: 'management-confirm',
          resolverValue: '1',
        },
      ],
    migrationStates: overrides.migrationStates || [],
    nextIds: {
      role: overrides.nextRoleId || 100,
      userRole: overrides.nextUserRoleId || 1000,
      migrationState: overrides.nextMigrationStateId || 1,
    },
  };

  let transactionSnapshot = null;

  return {
    state,
    async beginTransaction() {
      transactionSnapshot = cloneState(state);
    },
    async commit() {
      transactionSnapshot = null;
    },
    async rollback() {
      if (transactionSnapshot) {
        Object.assign(state, cloneState(transactionSnapshot));
      }
      transactionSnapshot = null;
    },
    async query(sql, params = []) {
      const normalizedSql = String(sql).replace(/\s+/g, ' ').trim();

      if (normalizedSql.includes('FROM information_schema.TABLES')) {
        return [[{ total: state.tables[params[0]] ? 1 : 0 }]];
      }

      if (
        normalizedSql.startsWith(
          'CREATE TABLE IF NOT EXISTS `cool_schema_migration_state`'
        )
      ) {
        state.tables.cool_schema_migration_state = true;
        return [{ affectedRows: 0 }];
      }

      if (
        normalizedSql ===
        'SELECT id FROM base_sys_user WHERE username = ? LIMIT 1'
      ) {
        const row = state.users.find(item => item.username === params[0]) || null;
        return [[row ? { id: row.id } : null].filter(Boolean)];
      }

      if (
        normalizedSql.includes('FROM base_sys_role') &&
        normalizedSql.includes("label IN ('system_root', 'admin')")
      ) {
        const row =
          state.roles
            .filter(
              item =>
                Number(item.isSuperAdmin || 0) === 1 ||
                ['system_root', 'admin'].includes(item.label)
            )
            .sort((left, right) => {
              const leftAdmin = Number(left.isSuperAdmin || 0);
              const rightAdmin = Number(right.isSuperAdmin || 0);
              if (rightAdmin !== leftAdmin) {
                return rightAdmin - leftAdmin;
              }
              return left.id - right.id;
            })[0] || null;

        return [[row ? { id: row.id, label: row.label, isSuperAdmin: row.isSuperAdmin } : null].filter(Boolean)];
      }

      if (normalizedSql.startsWith('INSERT INTO base_sys_role')) {
        const roleId = state.nextIds.role;
        state.nextIds.role += 1;
        state.roles.push({
          id: roleId,
          userId: '1',
          name: '系统超管',
          label: 'system_root',
          isSuperAdmin: 1,
          remark: 'super admin login backfill',
        });
        return [{ insertId: roleId }];
      }

      if (
        normalizedSql.startsWith('UPDATE base_sys_role SET isSuperAdmin = 1')
      ) {
        const role = state.roles.find(item => item.id === params[0]);
        if (role) {
          role.isSuperAdmin = 1;
        }
        return [{ affectedRows: role ? 1 : 0 }];
      }

      if (
        normalizedSql ===
        'SELECT id FROM base_sys_user_role WHERE userId = ? AND roleId = ? LIMIT 1'
      ) {
        const row =
          state.userRoles.find(
            item => item.userId === params[0] && item.roleId === params[1]
          ) || null;
        return [[row ? { id: row.id } : null].filter(Boolean)];
      }

      if (normalizedSql.startsWith('INSERT INTO base_sys_user_role')) {
        const userRoleId = state.nextIds.userRole;
        state.nextIds.userRole += 1;
        state.userRoles.push({
          id: userRoleId,
          userId: params[0],
          roleId: params[1],
        });
        return [{ insertId: userRoleId }];
      }

      if (
        normalizedSql.includes('FROM performance_approval_config') &&
        normalizedSql.includes("objectType = 'assetAssignmentRequest'")
      ) {
        const row =
          state.approvalConfigs.find(
            item => item.objectType === 'assetAssignmentRequest'
          ) || null;
        return [[row ? { id: row.id } : null].filter(Boolean)];
      }

      if (
        normalizedSql.includes('FROM performance_approval_config_node') &&
        normalizedSql.includes("nodeCode = 'management-confirm'")
      ) {
        const row =
          state.approvalNodes.find(
            item => item.configId === params[0] && item.nodeCode === 'management-confirm'
          ) || null;
        return [[row ? { id: row.id, resolverValue: row.resolverValue } : null].filter(Boolean)];
      }

      if (
        normalizedSql.startsWith(
          'UPDATE performance_approval_config_node SET resolverValue = ?'
        )
      ) {
        const row = state.approvalNodes.find(item => item.id === params[1]);
        if (row) {
          row.resolverValue = params[0];
        }
        return [{ affectedRows: row ? 1 : 0 }];
      }

      if (
        normalizedSql ===
        'SELECT id, payload FROM `cool_schema_migration_state` WHERE migrationId = ? LIMIT 1'
      ) {
        const row =
          state.migrationStates.find(item => item.migrationId === params[0]) || null;
        return [[row ? { id: row.id, payload: row.payload } : null].filter(Boolean)];
      }

      if (
        normalizedSql ===
        'SELECT id FROM `cool_schema_migration_state` WHERE migrationId = ? LIMIT 1'
      ) {
        const row =
          state.migrationStates.find(item => item.migrationId === params[0]) || null;
        return [[row ? { id: row.id } : null].filter(Boolean)];
      }

      if (
        normalizedSql.startsWith(
          'UPDATE `cool_schema_migration_state` SET payload = ?, updateTime = ?'
        )
      ) {
        const row = state.migrationStates.find(item => item.id === params[2]);
        if (row) {
          row.payload = params[0];
        }
        return [{ affectedRows: row ? 1 : 0 }];
      }

      if (
        normalizedSql.startsWith(
          'INSERT INTO `cool_schema_migration_state` (migrationId, payload, createTime, updateTime)'
        )
      ) {
        const rowId = state.nextIds.migrationState;
        state.nextIds.migrationState += 1;
        state.migrationStates.push({
          id: rowId,
          migrationId: params[0],
          payload: params[1],
        });
        return [{ insertId: rowId }];
      }

      if (
        normalizedSql ===
        'DELETE FROM `cool_schema_migration_state` WHERE migrationId = ?'
      ) {
        state.migrationStates = state.migrationStates.filter(
          item => item.migrationId !== params[0]
        );
        return [{ affectedRows: 1 }];
      }

      if (normalizedSql === 'DELETE FROM base_sys_user_role WHERE id = ?') {
        state.userRoles = state.userRoles.filter(item => item.id !== params[0]);
        return [{ affectedRows: 1 }];
      }

      if (normalizedSql === 'DELETE FROM base_sys_role WHERE id = ?') {
        state.roles = state.roles.filter(item => item.id !== params[0]);
        return [{ affectedRows: 1 }];
      }

      if (
        normalizedSql.startsWith('UPDATE base_sys_role SET isSuperAdmin = 0')
      ) {
        const role = state.roles.find(item => item.id === params[0]);
        if (role) {
          role.isSuperAdmin = 0;
        }
        return [{ affectedRows: role ? 1 : 0 }];
      }

      throw new Error(`Unhandled SQL in test mock: ${normalizedSql}`);
    },
  };
}

test('up preserves existing admin role bindings and remains idempotent', async () => {
  const connection = createMockConnection({
    roles: [{ id: 9, label: 'system_root', isSuperAdmin: 1 }],
    userRoles: [{ id: 11, userId: 1, roleId: 3 }],
  });

  await migration.up(connection);
  await migration.up(connection);

  assert.equal(
    connection.state.userRoles.filter(item => item.userId === 1 && item.roleId === 3)
      .length,
    1
  );
  assert.equal(
    connection.state.userRoles.filter(item => item.userId === 1 && item.roleId === 9)
      .length,
    1
  );

  await migration.down(connection);

  assert.equal(
    connection.state.userRoles.filter(item => item.userId === 1 && item.roleId === 3)
      .length,
    1
  );
  assert.equal(
    connection.state.userRoles.filter(item => item.userId === 1 && item.roleId === 9)
      .length,
    0
  );
});

test('up and down promote an existing admin role without rewriting labels', async () => {
  const connection = createMockConnection({
    roles: [{ id: 10, label: 'admin', isSuperAdmin: 0 }],
    userRoles: [{ id: 21, userId: 1, roleId: 3 }],
    approvalNodes: [
      {
        id: 88,
        configId: 5,
        nodeCode: 'management-confirm',
        resolverValue: '42',
      },
    ],
  });

  await migration.up(connection);

  assert.equal(connection.state.roles.find(item => item.id === 10)?.label, 'admin');
  assert.equal(connection.state.roles.find(item => item.id === 10)?.isSuperAdmin, 1);
  assert.ok(
    connection.state.userRoles.find(item => item.userId === 1 && item.roleId === 3)
  );
  assert.ok(
    connection.state.userRoles.find(item => item.userId === 1 && item.roleId === 10)
  );
  assert.equal(connection.state.approvalNodes[0].resolverValue, '1');
  assert.equal(connection.state.migrationStates.length, 1);

  await migration.down(connection);

  assert.equal(connection.state.roles.find(item => item.id === 10)?.label, 'admin');
  assert.equal(connection.state.roles.find(item => item.id === 10)?.isSuperAdmin, 0);
  assert.ok(
    connection.state.userRoles.find(item => item.userId === 1 && item.roleId === 3)
  );
  assert.equal(
    connection.state.userRoles.find(item => item.userId === 1 && item.roleId === 10),
    undefined
  );
  assert.equal(connection.state.approvalNodes[0].resolverValue, '42');
  assert.equal(connection.state.migrationStates.length, 0);
});

test('down deletes a role created only for the backfill', async () => {
  const connection = createMockConnection({
    roles: [{ id: 3, label: 'performance_hr', isSuperAdmin: 0 }],
    userRoles: [{ id: 31, userId: 1, roleId: 3 }],
    tables: {
      performance_approval_config: false,
      performance_approval_config_node: false,
    },
  });

  await migration.up(connection);

  const createdRole = connection.state.roles.find(
    item => item.label === 'system_root' && item.id !== 3
  );
  assert.ok(createdRole);
  assert.ok(
    connection.state.userRoles.find(
      item => item.userId === 1 && item.roleId === createdRole.id
    )
  );

  await migration.down(connection);

  assert.equal(
    connection.state.roles.find(item => item.id === createdRole.id),
    undefined
  );
  assert.equal(
    connection.state.userRoles.find(item => item.roleId === createdRole.id),
    undefined
  );
  assert.ok(
    connection.state.userRoles.find(item => item.userId === 1 && item.roleId === 3)
  );
});
