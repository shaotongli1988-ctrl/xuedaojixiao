/**
 * 负责统一调用仓库内 RBAC 对齐守卫，供本地 gate、CI 和发布门禁复用。
 * 不负责定义 RBAC 规则本身，也不替代业务测试或权限生成校验。
 * 依赖同目录下的 `rbac_alignment_guard.py` 与本机 `python3`。
 * 维护重点：phase、force 和报告输出语义要稳定，避免本地/CI 判断分叉。
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function parseArgs(argv) {
	const args = {
		phase: 'batch',
		force: false,
		reportMd: '',
		reportJson: '',
		task: '',
		failOn: '',
		changedFiles: []
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

		if (current === '--all' || current === '--changed') {
			continue;
		}

		if (current === '--force') {
			args.force = true;
			continue;
		}

		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

const args = parseArgs(process.argv.slice(2));
const command = [
	path.join(scriptDir, 'rbac_alignment_guard.py'),
	'--phase',
	args.phase,
	'--cwd',
	repoRoot
];

if (args.force) {
	command.push('--force');
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

for (const changedFile of args.changedFiles) {
	command.push('--changed-file', changedFile);
}

const result = spawnSync('python3', command, {
	cwd: repoRoot,
	stdio: 'inherit'
});

if (result.error) {
	console.error(`[rbac guard] failed to execute: ${result.error.message}`);
	process.exit(1);
}

process.exit(result.status ?? 1);
