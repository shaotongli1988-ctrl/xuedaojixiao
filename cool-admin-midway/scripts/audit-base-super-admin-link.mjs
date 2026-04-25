/**
 * Audits whether the base super-admin login-link migration was applied safely in an existing environment.
 * This file only reads DB state and reports migration safety findings; it never mutates role bindings or attempts repair.
 * Maintenance pitfall: a legacy-applied environment may have already lost admin role bindings, and this script must not pretend that loss is auto-recoverable.
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditedMigrationId = '20260421110000';
const migrationStateTableName = 'cool_schema_migration_state';
const migrationTableName = 'cool_schema_migration';

const dbConfig = {
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: Number(process.env.LOCAL_DB_PORT || 3306),
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '123456',
  database: process.env.LOCAL_DB_NAME || 'cool',
};

function normalizeRow(row) {
  return row || null;
}

async function queryOne(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return normalizeRow(Array.isArray(rows) ? rows[0] || null : null);
}

async function queryAll(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return Array.isArray(rows) ? rows : [];
}

async function hasTable(connection, tableName) {
  const row = await queryOne(
    connection,
    `
      SELECT COUNT(1) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName]
  );

  return Number(row?.total || 0) > 0;
}

export function evaluateSuperAdminLinkAudit(snapshot) {
  const passes = [];
  const warnings = [];
  const failures = [];

  if (!snapshot.hasMigrationTable) {
    failures.push({
      scope: migrationTableName,
      detail: '缺少 cool_schema_migration，无法确认 20260421110000 的真实执行来源。',
    });
    return { passes, warnings, failures };
  }

  if (!snapshot.migrationApplied) {
    passes.push({
      scope: auditedMigrationId,
      detail: '迁移未应用，旧版本数据破坏风险不在当前环境生效。',
    });
    return { passes, warnings, failures };
  }

  passes.push({
    scope: auditedMigrationId,
    detail: `迁移已记录为 APPLIED${snapshot.migrationAppliedAt ? `，appliedAt=${snapshot.migrationAppliedAt}` : ''}，继续核查 admin 绑定和回滚状态记录。`,
  });

  if (!snapshot.adminUser) {
    warnings.push({
      scope: 'base_sys_user.admin',
      detail:
        '已应用目标迁移，但当前不存在 admin 用户；请确认是否是有意去基座化，或是否需要历史数据排查。',
    });
    return { passes, warnings, failures };
  }

  if (!snapshot.hasMigrationStateTable) {
    failures.push({
      scope: migrationStateTableName,
      detail:
        'admin 存在且迁移已应用，但缺少 cool_schema_migration_state。该环境很可能执行过旧版 migration 源码，需人工审计是否发生历史角色绑定丢失。',
    });
  } else if (snapshot.migrationStateRow) {
    passes.push({
      scope: migrationStateTableName,
      detail: '已找到该 migration 的状态记录，down() 具备按记录回滚的依据。',
    });
  } else {
    passes.push({
      scope: migrationStateTableName,
      detail: '状态表存在但该 migration 无状态行，说明当前库在应用时已基本对齐，未发生需要记录的补写动作。',
    });
  }

  if (!snapshot.adminRoles.length) {
    failures.push({
      scope: 'base_sys_user_role',
      detail: 'admin 当前没有任何角色绑定，登录与权限流转不可信。',
    });
  }

  const superAdminRoles = snapshot.adminRoles.filter(item => Number(item.isSuperAdmin || 0) === 1);
  if (!superAdminRoles.length) {
    failures.push({
      scope: 'base_sys_role.isSuperAdmin',
      detail: 'admin 当前没有绑定任何 isSuperAdmin=1 角色，基座超管链路已断。',
    });
  } else {
    passes.push({
      scope: 'base_sys_role.isSuperAdmin',
      detail: `admin 已绑定 ${superAdminRoles.length} 个超管角色，当前角色集合：${snapshot.adminRoles
        .map(item => `${item.label || 'NULL'}#${item.id}`)
        .join(', ')}`,
    });
  }

  if (superAdminRoles.length > 1) {
    warnings.push({
      scope: 'base_sys_role.isSuperAdmin',
      detail: 'admin 同时绑定多个超管角色，建议确认是否属于有意设计，避免权限语义重复。',
    });
  }

  if (
    !snapshot.hasMigrationStateTable &&
    snapshot.adminRoles.length === 1 &&
    superAdminRoles.length === 1
  ) {
    failures.push({
      scope: 'base_sys_user_role',
      detail:
        '当前 admin 只剩单一超管角色，且环境缺少 migration 状态表；这与旧版 migration 的“删旧重建”行为一致，需结合备份或历史审计手工确认是否丢失过其他角色绑定。',
    });
  }

  const bindingCreatedAtMigrationTime = snapshot.adminRoles.some(item => {
    return (
      snapshot.migrationAppliedAt &&
      item.userRoleCreateTime &&
      item.roleCreateTime &&
      String(item.userRoleCreateTime) === String(snapshot.migrationAppliedAt) &&
      String(item.roleCreateTime) === String(snapshot.migrationAppliedAt)
    );
  });

  if (bindingCreatedAtMigrationTime) {
    failures.push({
      scope: `${auditedMigrationId}.forensics`,
      detail:
        'admin 当前绑定的超管角色创建时间、用户角色绑定创建时间与 migration appliedAt 完全同秒；这强烈说明当前链路由旧版 migration 直接写入，历史是否删掉过其他角色绑定仍需人工核对。',
    });
  }

  if (snapshot.approvalNode) {
    if (String(snapshot.approvalNode.resolverValue ?? '') !== String(snapshot.adminUser.id)) {
      failures.push({
        scope: 'performance_approval_config_node.management-confirm',
        detail: `assetAssignmentRequest.management-confirm 当前 resolverValue=${snapshot.approvalNode.resolverValue}，未指向 admin.userId=${snapshot.adminUser.id}。`,
      });
    } else {
      passes.push({
        scope: 'performance_approval_config_node.management-confirm',
        detail: `assetAssignmentRequest.management-confirm 已指向 admin.userId=${snapshot.adminUser.id}。`,
      });
    }
  } else {
    warnings.push({
      scope: 'performance_approval_config_node.management-confirm',
      detail: '未找到 assetAssignmentRequest.management-confirm 节点，跳过该审批指针核查。',
    });
  }

  return { passes, warnings, failures };
}

async function collectAuditSnapshot(connection) {
  const hasMigrationTable = await hasTable(connection, migrationTableName);
  const migrationAppliedRow = hasMigrationTable
    ? await queryOne(
        connection,
        `SELECT migrationId, appliedAt FROM \`${migrationTableName}\` WHERE migrationId = ? LIMIT 1`,
        [auditedMigrationId]
      )
    : null;
  const migrationApplied = Boolean(migrationAppliedRow);
  const migrationAppliedAt = migrationAppliedRow?.appliedAt
    ? String(migrationAppliedRow.appliedAt)
    : null;

  const adminUser =
    (await hasTable(connection, 'base_sys_user'))
      ? await queryOne(
          connection,
          'SELECT id, username FROM base_sys_user WHERE username = ? LIMIT 1',
          ['admin']
        )
      : null;

  const adminRoles =
    adminUser && (await hasTable(connection, 'base_sys_user_role')) && (await hasTable(connection, 'base_sys_role'))
      ? await queryAll(
          connection,
          `
            SELECT r.id, r.label, COALESCE(r.isSuperAdmin, 0) AS isSuperAdmin
              , ur.id AS userRoleId
              , ur.createTime AS userRoleCreateTime
              , ur.updateTime AS userRoleUpdateTime
              , r.createTime AS roleCreateTime
              , r.updateTime AS roleUpdateTime
            FROM base_sys_user_role ur
            INNER JOIN base_sys_role r ON r.id = ur.roleId
            WHERE ur.userId = ?
            ORDER BY r.id ASC
          `,
          [adminUser.id]
        )
      : [];

  const hasMigrationStateTable = await hasTable(connection, migrationStateTableName);
  const migrationStateRow = hasMigrationStateTable
    ? await queryOne(
        connection,
        `SELECT id, payload FROM \`${migrationStateTableName}\` WHERE migrationId = ? LIMIT 1`,
        [auditedMigrationId]
      )
    : null;

  const hasApprovalConfigTable = await hasTable(connection, 'performance_approval_config');
  const hasApprovalNodeTable = await hasTable(connection, 'performance_approval_config_node');
  const approvalNode =
    hasApprovalConfigTable && hasApprovalNodeTable
      ? await queryOne(
          connection,
          `
            SELECT n.id, n.resolverValue
            FROM performance_approval_config c
            INNER JOIN performance_approval_config_node n
              ON n.configId = c.id
            WHERE c.objectType = 'assetAssignmentRequest'
              AND n.nodeCode = 'management-confirm'
            LIMIT 1
          `
        )
      : null;

  return {
    auditedMigrationId,
    hasMigrationTable,
    migrationApplied,
    migrationAppliedAt,
    adminUser,
    adminRoles,
    hasMigrationStateTable,
    migrationStateRow,
    approvalNode,
  };
}

function printAuditResult(result) {
  for (const item of result.passes) {
    console.log(`[PASS] ${item.scope} - ${item.detail}`);
  }
  for (const item of result.warnings) {
    console.log(`[WARN] ${item.scope} - ${item.detail}`);
  }
  for (const item of result.failures) {
    console.log(`[FAIL] ${item.scope} - ${item.detail}`);
  }

  console.log('');
  console.log('Summary');
  console.log(`PASS: ${result.passes.length}`);
  console.log(`WARN: ${result.warnings.length}`);
  console.log(`FAIL: ${result.failures.length}`);
  console.log(`Conclusion: ${result.failures.length > 0 ? 'FAILED' : 'PASSED'}`);
}

function printHelp() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), fileURLToPath(import.meta.url))} [options]

Options:
  --json         Print the audit result as JSON
  --help, -h     Show help

Environment:
  LOCAL_DB_HOST
  LOCAL_DB_PORT
  LOCAL_DB_USER
  LOCAL_DB_PASSWORD
  LOCAL_DB_NAME
`);
}

function parseArgs(argv) {
  const options = {
    json: false,
  };

  for (const current of argv) {
    if (current === '--json') {
      options.json = true;
      continue;
    }

    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return options;
}

export async function runAudit(options = { json: false }) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const snapshot = await collectAuditSnapshot(connection);
    const result = evaluateSuperAdminLinkAudit(snapshot);

    if (options.json) {
      console.log(JSON.stringify({ snapshot, result }, null, 2));
    } else {
      printAuditResult(result);
    }

    return result;
  } finally {
    await connection.end();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runAudit(options);
  if (result.failures.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`[audit] FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
