/**
 * Adds a dedicated super-admin role flag to base_sys_role and backfills existing admin-label rows.
 * This migration only introduces an additive boolean source-of-truth field so runtime authorization stops inferring super admin from role labels.
 * Maintenance pitfall: keep runtime code reading isSuperAdmin only; label-based backfill here is transitional and must not leak back into services.
 */

export const migrationId = '20260421093000';
export const migrationName = 'add-base-role-is-super-admin';

const tableName = 'base_sys_role';
const columnName = 'isSuperAdmin';

async function hasTable(connection, targetTable) {
  const [rows] = await connection.query(
    `
      SELECT COUNT(1) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [targetTable]
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

async function hasColumn(connection, targetTable, targetColumn) {
  const [rows] = await connection.query(
    `
      SELECT COUNT(1) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [targetTable, targetColumn]
  );

  return Number(rows?.[0]?.total || 0) > 0;
}

export async function up(connection) {
  if (!(await hasTable(connection, tableName))) {
    return;
  }

  if (!(await hasColumn(connection, tableName, columnName))) {
    await connection.query(`
      ALTER TABLE \`${tableName}\`
      ADD COLUMN \`${columnName}\` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否系统超管角色'
      AFTER \`label\`
    `);
  }

  await connection.query(
    `
      UPDATE \`${tableName}\`
      SET \`${columnName}\` = 1
      WHERE \`${columnName}\` = 0
        AND \`label\` = 'admin'
    `
  );
}

export async function down(connection) {
  if (!(await hasTable(connection, tableName))) {
    return;
  }

  if (!(await hasColumn(connection, tableName, columnName))) {
    return;
  }

  await connection.query(`
    ALTER TABLE \`${tableName}\`
    DROP COLUMN \`${columnName}\`
  `);
}
