#!/usr/bin/env node
/**
 * 负责统一调用仓库内统一交付守卫，供本地 gate、CI 和发布门禁复用。
 * 不负责定义交付规则本身，也不替代真实 build、lint、test。
 * 依赖同目录下的 `unified_delivery_guard.py` 与本机 `python3`。
 * 维护重点：phase、all、skip 子守卫和报告输出语义要稳定，避免本地/CI 判断分叉。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getSsotArtifactRoot } from './xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const defaultArtifactRoot = getSsotArtifactRoot();

function parseArgs(argv) {
	const args = {
		phase: 'batch',
		all: false,
		reportMd: '',
		reportJson: '',
		task: '',
		failOn: '',
		changedFiles: [],
		skipRbacGuard: false,
		skipStateMachineGuard: false,
		skipComponentReuseGuard: false
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];

		if (current === '--phase' && next) {
			args.phase = next;
			index += 1;
			continue;
		}

		if (current === '--report-md' && next) {
			args.reportMd = next;
			index += 1;
			continue;
		}

		if (current === '--report-json' && next) {
			args.reportJson = next;
			index += 1;
			continue;
		}

		if (current === '--task' && next) {
			args.task = next;
			index += 1;
			continue;
		}

		if (current === '--fail-on' && next) {
			args.failOn = next;
			index += 1;
			continue;
		}

		if (current === '--file' && next) {
			args.changedFiles.push(next);
			index += 1;
			continue;
		}

		if (current === '--all') {
			args.all = true;
			continue;
		}

		if (current === '--changed') {
			continue;
		}

		if (current === '--skip-rbac-guard') {
			args.skipRbacGuard = true;
			continue;
		}

		if (current === '--skip-state-machine-guard') {
			args.skipStateMachineGuard = true;
			continue;
		}

		if (current === '--skip-component-reuse-guard') {
			args.skipComponentReuseGuard = true;
			continue;
		}

		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

function resolveDefaultReportPath(phase, suffix) {
	return path.join(repoRoot, defaultArtifactRoot, `unified-delivery-${phase}.latest.${suffix}`);
}

const args = parseArgs(process.argv.slice(2));
if (!args.reportMd && args.phase !== 'start') {
	args.reportMd = resolveDefaultReportPath(args.phase, 'md');
}
if (!args.reportJson && args.phase !== 'start') {
	args.reportJson = resolveDefaultReportPath(args.phase, 'json');
}
const command = [
	path.join(scriptDir, 'unified_delivery_guard.py'),
	'--phase',
	args.phase,
	'--cwd',
	repoRoot
];

if (args.all) {
	command.push('--all');
}

if (args.reportMd) {
	command.push('--report-md', args.reportMd);
}

if (args.reportJson) {
	command.push('--report-json', args.reportJson);
}

if (args.task) {
	command.push('--task', args.task);
}

if (args.failOn) {
	command.push('--fail-on', args.failOn);
}

if (args.skipRbacGuard) {
	command.push('--skip-rbac-guard');
}

if (args.skipStateMachineGuard) {
	command.push('--skip-state-machine-guard');
}

if (args.skipComponentReuseGuard) {
	command.push('--skip-component-reuse-guard');
}

for (const changedFile of args.changedFiles) {
	command.push('--changed-file', changedFile);
}

const result = spawnSync('python3', command, {
	cwd: repoRoot,
	stdio: 'inherit'
});

if (result.error) {
	console.error(`[unified-delivery guard] failed to execute: ${result.error.message}`);
	process.exit(1);
}

process.exit(result.status ?? 1);
