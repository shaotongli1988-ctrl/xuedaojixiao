/**
 * Adds a persisted performance persona preference column to base_sys_user.
 * This migration only stores the user's selected performance persona key; runtime role/capability/scope resolution still comes from existing permission inference.
 * Maintenance pitfall: persisted values must always be revalidated against availablePersonas at runtime instead of being trusted as authorization truth.
 */

export const migrationId = '20260423090000';
export const migrationName = 'add-base-user-active-performance-persona';

const tableName = 'base_sys_user';
const columnName = 'activePerformancePersonaKey';

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
    ADD COLUMN \`${columnName}\` varchar(64) NULL COMMENT '绩效域当前视角偏好'
    AFTER \`remark\`
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
