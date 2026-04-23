/**
 * Backward-compatible wrapper for the legacy performance-named local schema entrypoint.
 * This file is not a separate schema path; it forwards to the repo-wide migration-based schema bootstrap.
 * Maintenance pitfall: update callers to `ensure-local-schema.mjs` and keep this wrapper thin.
 */
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ensureLocalSchemaPath = path.join(__dirname, 'ensure-local-schema.mjs');

async function main() {
  const result = spawnSync(process.execPath, [ensureLocalSchemaPath], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`ensure-local-schema exited with status ${result.status ?? 'unknown'}`);
  }
}

main().catch(error => {
  console.error(`[schema] FAILED: ${error.message}`);
  process.exitCode = 1;
});
