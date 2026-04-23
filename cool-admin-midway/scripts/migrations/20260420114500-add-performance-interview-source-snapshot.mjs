/**
 * Adds sourceSnapshot storage to performance interviews.
 * This migration only appends an additive json column so interview records can retain upstream source context such as talentAsset or resumePool.
 * Maintenance pitfall: keep the column nullable during rollout so old code and old rows remain compatible.
 */

export const migrationId = '20260420114500';
export const migrationName = 'add-performance-interview-source-snapshot';

const tableName = 'performance_interview';
const columnName = 'sourceSnapshot';

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

  if (await hasColumn(connection, tableName, columnName)) {
    return;
  }

  await connection.query(`
    ALTER TABLE \`${tableName}\`
    ADD COLUMN \`${columnName}\` json DEFAULT NULL COMMENT '来源轻量快照'
    AFTER \`recruitPlanId\`
  `);
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
