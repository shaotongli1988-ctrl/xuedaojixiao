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

const guardScripts = [
	'check-directory-naming-conflicts.mjs',
	'check-menu-route-viewpath-drift.mjs',
	'check-permission-key-alignment.mjs',
	'check-doc-contract-writeback.mjs'
];

for (const guardScript of guardScripts) {
	const result = spawnSync(process.execPath, [path.join(scriptDir, guardScript), ...process.argv.slice(2)], {
		stdio: 'inherit'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log('[repo-consistency-guards] 通过，所有仓库一致性守卫已完成。');
