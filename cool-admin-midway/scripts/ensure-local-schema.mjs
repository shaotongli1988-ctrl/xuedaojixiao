/**
 * Ensures all repository-managed local schema migrations are applied before backend boot or smoke.
 * This file only delegates to the formal migration runner and does not define any schema on its own.
 * Maintenance pitfall: keep schema truth in `scripts/migrations` and use compatibility wrappers only for legacy entrypoints.
 */
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationRunnerPath = path.join(__dirname, 'run-migrations.mjs');

async function main() {
  const result = spawnSync(process.execPath, [migrationRunnerPath, 'up'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`migration runner exited with status ${result.status ?? 'unknown'}`);
  }
}

main().catch(error => {
  console.error(`[schema] FAILED: ${error.message}`);
  process.exitCode = 1;
});
