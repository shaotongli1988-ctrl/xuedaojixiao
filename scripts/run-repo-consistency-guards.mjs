#!/usr/bin/env node

/**
 * 负责串行执行仓库一致性守卫集合，并在任一守卫失败时中断。
 * 不负责定义守卫规则，也不替代更大范围的 type-check、build 或 smoke。
 * 依赖同目录下的各个 guard 脚本与当前 Node 运行时。
 * 维护重点：执行顺序要稳定，错误输出要保留原始守卫上下文，便于快速定位。
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const guardEntries = [
	{
		script: 'check-xuedao-ssot-manifest.mjs',
		args: []
	},
	{
		script: 'check-xuedao-ssot-conformance.mjs',
		args: []
	},
	{
		script: 'sync-repo-openapi-ssot.mjs',
		args: ['--write']
	},
	{
		script: 'sync-performance-openapi-ssot.mjs',
		args: ['--write']
	},
	{
		script: 'openapi-contract-sync.mjs',
		args: ['--write']
	},
	{
		script: 'check-performance-contract-closure.mjs',
		args: []
	},
	{
		script: 'check-performance-domain-model-ssot.mjs',
		args: []
	},
	{
		script: 'check-office-ledger-enum-alignment.mjs',
		args: []
	},
	{
		script: 'check-global-domain-ssot.mjs',
		args: []
	},
	{
		script: 'check-base-permission-domain-ssot.mjs',
		args: []
	},
	{
		script: 'sync-eps-openapi-ssot.mjs',
		args: ['--write']
	},
	{
		script: 'check-directory-naming-conflicts.mjs',
		args: []
	},
	{
		script: 'check-menu-route-viewpath-drift.mjs',
		args: []
	},
	{
		script: 'check-permission-key-alignment.mjs',
		args: []
	},
	{
		script: 'check-doc-contract-writeback.mjs',
		args: []
	},
	{
		script: 'check-rbac-alignment.mjs',
		args: ['--phase', 'batch', '--force']
	},
	{
		script: 'check-state-machine-alignment.mjs',
		args: ['--phase', 'batch', '--force']
	},
	{
		script: 'check-component-reuse.mjs',
		args: ['--phase', 'batch', '--force']
	}
];

for (const guardEntry of guardEntries) {
	const result = spawnSync(process.execPath, [path.join(scriptDir, guardEntry.script), ...guardEntry.args, ...process.argv.slice(2)], {
		stdio: 'inherit'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log('[repo-consistency-guards] 通过，所有仓库一致性守卫已完成。');
