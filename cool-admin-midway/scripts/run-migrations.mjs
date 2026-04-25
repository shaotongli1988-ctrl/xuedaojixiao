/**
 * Runs additive schema migrations against the configured MySQL database.
 * This file is responsible for discovering local migration modules, recording apply history, and executing up/down/status commands.
 * Maintenance pitfall: keep migration IDs immutable once applied because the history table keys on migrationId.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationDir = path.join(__dirname, 'migrations');
const migrationTableName = 'cool_schema_migration';

const dbConfig = {
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: Number(process.env.LOCAL_DB_PORT || 3306),
  user: process.env.LOCAL_DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD || '123456',
  database: process.env.LOCAL_DB_NAME || 'cool',
};

const createMigrationTableSql = `
CREATE TABLE IF NOT EXISTS \`${migrationTableName}\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`migrationId\` varchar(32) NOT NULL COMMENT '迁移编号',
  \`name\` varchar(200) NOT NULL COMMENT '迁移名称',
  \`appliedAt\` varchar(19) NOT NULL COMMENT '执行时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_cool_schema_migration_migration_id\` (\`migrationId\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Schema 迁移执行记录';
`;

function nowTime() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function printHelp() {
  console.log(`Usage:
  node ./scripts/run-migrations.mjs <command> [options]

Commands:
  up                 Apply all pending migrations
  down               Roll back the latest applied migration, or the one given by --id
  status             Print applied and pending migrations

Options:
  --id <migrationId> Roll back the specified migration with down
  --help, -h         Show help

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
    command: 'up',
    migrationId: '',
  };

  let commandAssigned = false;
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }

    if (current === '--id' && next) {
      options.migrationId = next;
      index += 1;
      continue;
    }

    if (!commandAssigned && !current.startsWith('-')) {
      options.command = current;
      commandAssigned = true;
      continue;
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  if (!['up', 'down', 'status'].includes(options.command)) {
    throw new Error(`Unsupported command: ${options.command}`);
  }

  return options;
}

async function loadMigrations() {
  const fileNames = fs
    .readdirSync(migrationDir)
    .filter(fileName => fileName.endsWith('.mjs'))
    .sort((left, right) => left.localeCompare(right));

  const migrations = [];
  for (const fileName of fileNames) {
    const fullPath = path.join(migrationDir, fileName);
    const migration = await import(pathToFileURL(fullPath).href);
    if (
      typeof migration.migrationId !== 'string' ||
      typeof migration.migrationName !== 'string' ||
      typeof migration.up !== 'function' ||
      typeof migration.down !== 'function'
    ) {
      throw new Error(`Invalid migration module: ${fileName}`);
    }
    migrations.push({
      fileName,
      fullPath,
      migrationId: migration.migrationId,
      migrationName: migration.migrationName,
      up: migration.up,
      down: migration.down,
    });
  }
  return migrations;
}

async function ensureMigrationTable(connection) {
  await connection.query(createMigrationTableSql);
}

async function getAppliedRows(connection) {
  const [rows] = await connection.query(
    `SELECT migrationId, name, appliedAt FROM \`${migrationTableName}\` ORDER BY migrationId ASC`
  );
  return Array.isArray(rows) ? rows : [];
}

async function runUp(connection, migrations) {
  const appliedRows = await getAppliedRows(connection);
  const appliedIds = new Set(appliedRows.map(row => String(row.migrationId)));
  const pending = migrations.filter(item => !appliedIds.has(item.migrationId));

  if (!pending.length) {
    console.log('[migration] no pending migrations');
    return;
  }

  for (const migration of pending) {
    console.log(`[migration] applying ${migration.migrationId} ${migration.migrationName}`);
    await migration.up(connection);
    await connection.query(
      `INSERT INTO \`${migrationTableName}\` (\`migrationId\`, \`name\`, \`appliedAt\`) VALUES (?, ?, ?)`,
      [migration.migrationId, migration.migrationName, nowTime()]
    );
    console.log(`[migration] applied ${migration.migrationId}`);
  }
}

async function runDown(connection, migrations, targetId) {
  const appliedRows = await getAppliedRows(connection);
  if (!appliedRows.length) {
    console.log('[migration] no applied migrations to roll back');
    return;
  }

  const appliedIds = new Set(appliedRows.map(row => String(row.migrationId)));
  const selectedId =
    targetId || String(appliedRows[appliedRows.length - 1].migrationId);

  if (!appliedIds.has(selectedId)) {
    throw new Error(`Migration ${selectedId} is not applied`);
  }

  const migration = migrations.find(item => item.migrationId === selectedId);
  if (!migration) {
    throw new Error(`Migration source file not found for ${selectedId}`);
  }

  console.log(`[migration] rolling back ${migration.migrationId} ${migration.migrationName}`);
  await migration.down(connection);
  await connection.query(
    `DELETE FROM \`${migrationTableName}\` WHERE \`migrationId\` = ?`,
    [migration.migrationId]
  );
  console.log(`[migration] rolled back ${migration.migrationId}`);
}

async function printStatus(connection, migrations) {
  const appliedRows = await getAppliedRows(connection);
  const appliedIds = new Set(appliedRows.map(row => String(row.migrationId)));

  for (const migration of migrations) {
    const status = appliedIds.has(migration.migrationId) ? 'APPLIED' : 'PENDING';
    const appliedRow = appliedRows.find(row => String(row.migrationId) === migration.migrationId);
    const detail = appliedRow ? ` at ${appliedRow.appliedAt}` : '';
    console.log(`[migration] ${status} ${migration.migrationId} ${migration.migrationName}${detail}`);
  }

  if (!migrations.length) {
    console.log('[migration] no migration files found');
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const migrations = await loadMigrations();
  const connection = await mysql.createConnection(dbConfig);

  try {
    await ensureMigrationTable(connection);

    if (options.command === 'status') {
      await printStatus(connection, migrations);
      return;
    }

    if (options.command === 'down') {
      await runDown(connection, migrations, options.migrationId);
      return;
    }

    await runUp(connection, migrations);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(`[migration] FAILED: ${error.message}`);
  process.exitCode = 1;
});
