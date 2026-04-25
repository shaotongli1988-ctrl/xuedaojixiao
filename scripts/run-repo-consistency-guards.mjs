#!/usr/bin/env node

/**
 * 负责串行执行仓库一致性守卫集合，并在任一守卫失败时中断。
 * 不负责定义守卫规则，也不替代更大范围的 type-check、build 或 smoke。
 * 依赖同目录下的各个 guard 脚本与当前 Node 运行时。
 * 维护重点：执行顺序要稳定，显式 changed-file 范围只能透传给支持范围裁剪的子守卫，错误输出要保留原始守卫上下文，便于快速定位。
 */

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function normalizePath(value) {
	return String(value || '').replaceAll('\\', '/').trim();
}

function parseArgs(argv) {
	const args = {
		all: false,
		changedFiles: [],
		filesFrom: ''
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];

		if (current === '--all') {
			args.all = true;
			continue;
		}

		if (current === '--changed') {
			continue;
		}

		if (current === '--file' && next) {
			args.changedFiles.push(normalizePath(next));
			index += 1;
			continue;
		}

		if (current === '--files-from' && next) {
			args.filesFrom = next;
			index += 1;
			continue;
		}

		throw new Error(`Unsupported arg: ${current}`);
	}

	if (args.all && (args.changedFiles.length > 0 || args.filesFrom)) {
		throw new Error('`--all` 不能与 `--file/--files-from` 同时使用。');
	}

	if (args.filesFrom) {
		const resolvedPath = path.isAbsolute(args.filesFrom)
			? args.filesFrom
			: path.resolve(process.cwd(), args.filesFrom);
		const rawText = fs.readFileSync(resolvedPath, 'utf8');
		for (const line of rawText.split(/\r?\n/)) {
			const filePath = normalizePath(line);
			if (filePath) {
				args.changedFiles.push(filePath);
			}
		}
	}

	args.changedFiles = [...new Set(args.changedFiles)];
	return args;
}

function buildScopeArgs(guardEntry, parsedArgs) {
	if (!guardEntry.supportsChangedFiles) {
		return [];
	}

	if (parsedArgs.all) {
		return ['--all'];
	}

	if (parsedArgs.changedFiles.length === 0) {
		return [];
	}

	return [
		'--changed',
		...parsedArgs.changedFiles.flatMap(filePath => ['--file', filePath])
	];
}

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
		script: 'check-business-dict-binding-ssot.mjs',
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
		script: 'check-rbac-domain-ssot.mjs',
		args: []
	},
	{
		script: 'check-performance-role-ssot.mjs',
		args: []
	},
	{
		script: 'check-state-machine-coverage-ssot.mjs',
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
		args: ['--phase', 'batch', '--force'],
		supportsChangedFiles: true
	},
	{
		script: 'check-state-machine-alignment.mjs',
		args: ['--phase', 'batch', '--force'],
		supportsChangedFiles: true
	},
	{
		script: 'check-component-reuse.mjs',
		args: ['--phase', 'batch', '--force'],
		supportsChangedFiles: true
	}
];

const parsedArgs = parseArgs(process.argv.slice(2));

for (const guardEntry of guardEntries) {
	const result = spawnSync(process.execPath, [
		path.join(scriptDir, guardEntry.script),
		...guardEntry.args,
		...buildScopeArgs(guardEntry, parsedArgs)
	], {
		cwd: repoRoot,
		stdio: 'inherit'
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log('[repo-consistency-guards] 通过，所有仓库一致性守卫已完成。');
