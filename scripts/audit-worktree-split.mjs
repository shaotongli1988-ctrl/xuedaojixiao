#!/usr/bin/env node

/**
 * 负责把当前 git pending changes 按主题和风险分批，输出可执行的工作区拆分审计报告。
 * 不负责修改工作区、自动暂存文件或替代人工评审高风险批次的正确性判断。
 * 依赖当前仓库的 git 状态、reports/delivery 报告目录约定和仓库路径命名规范。
 * 维护重点：分类规则必须稳定可解释；新增高风险共享目录时要优先补到批次规则里。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getSsotArtifactRoot } from './xuedao-ssot-manifest.mjs';

function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

function parseArgs(argv) {
	const args = {
		cwd: process.cwd(),
		reportMd: '',
		reportJson: '',
		batchId: '',
		output: 'markdown'
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];
		if (current === '--cwd' && next) {
			args.cwd = path.resolve(next);
			index += 1;
			continue;
		}
		if (current === '--report-md' && next) {
			args.reportMd = path.resolve(next);
			index += 1;
			continue;
		}
		if (current === '--report-json' && next) {
			args.reportJson = path.resolve(next);
			index += 1;
			continue;
		}
		if (current === '--batch-id' && next) {
			args.batchId = next;
			index += 1;
			continue;
		}
		if (current === '--output' && next) {
			if (!['markdown', 'json', 'paths'].includes(next)) {
				throw new Error(`Unsupported output: ${next}`);
			}
			args.output = next;
			index += 1;
			continue;
		}
		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

function runGitStatus(cwd) {
	try {
		return execFileSync(
			'git',
			['-C', cwd, '-c', 'core.quotePath=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
			{
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'pipe']
			}
		);
	} catch (error) {
		const detail = error.stderr || error.stdout || error.message;
		throw new Error(`git status failed for ${cwd}: ${detail}`);
	}
}

function parseStatusEntries(output) {
	if (!output) {
		return [];
	}

	const rawEntries = output.split('\0').filter(Boolean);
	const entries = [];

	for (let index = 0; index < rawEntries.length; index += 1) {
		const rawEntry = rawEntries[index];
		const status = rawEntry.slice(0, 2);
		const stagedStatus = status[0];
		const worktreeStatus = status[1];
		const payload = rawEntry.slice(3);
		let relativePath = payload;
		let originalPath = '';

		if (['R', 'C'].includes(stagedStatus) || ['R', 'C'].includes(worktreeStatus)) {
			originalPath = normalizePath(payload);
			relativePath = normalizePath(rawEntries[index + 1] || payload);
			index += 1;
		} else {
			relativePath = normalizePath(payload);
		}

		const staged =
			stagedStatus !== ' ' && stagedStatus !== '?' && stagedStatus !== '!' && stagedStatus !== '';
		const unstaged =
			worktreeStatus !== ' ' && worktreeStatus !== '?' && worktreeStatus !== '!' && worktreeStatus !== '';

		entries.push({
			path: relativePath,
			originalPath,
			gitStatus: status,
			stagedStatus,
			worktreeStatus,
			staged,
			unstaged,
			untracked: status === '??'
		});
	}

	return entries;
}

const batchRules = [
	{
		id: 'cleanup-temp',
		title: '临时与缓存隔离',
		riskLevel: 'high',
		recommendedVerification: '提交前先清理，不进入正常实现批次。',
		matches(filePath) {
			return (
				/(^|\/)(__pycache__|\.pytest_cache|coverage|dist|tmp|temp)(\/|$)/.test(filePath) ||
				/(^|\/)\.superpowers(\/|$)/.test(filePath) ||
				/(^|\/)\.tmp[^/]*(\/|$)/.test(filePath) ||
				/\.pyc$/i.test(filePath) ||
				/\.log$/i.test(filePath)
			);
		}
	},
	{
		id: 'local-runtime-env',
		title: '本地运行时环境文件',
		riskLevel: 'medium',
		recommendedVerification:
			'不纳入仓库级 SSOT 交付批次；仅确认变量名仍受 environment-config catalog 治理，且不提交真实本地真值。',
		matches(filePath) {
			return filePath === 'cool-admin-vue/.env' || filePath.startsWith('cool-admin-vue/.env.');
		}
	},
	{
		id: 'governance-ssot',
		title: '仓库治理与 SSOT',
		riskLevel: 'high',
		recommendedVerification:
			'node ./scripts/check-xuedao-ssot-manifest.mjs && node ./scripts/check-xuedao-ssot-conformance.mjs',
		matches(filePath) {
			return (
				filePath === 'README.md' ||
				filePath.startsWith('contracts/') ||
				filePath.startsWith('scripts/') ||
				filePath.startsWith('.github/') ||
				filePath.startsWith('.githooks/')
			);
		}
	},
	{
		id: 'docs-evidence',
		title: '文档与交付证据',
		riskLevel: 'medium',
		recommendedVerification:
			'校对事实源与实现一致，必要时回写 verification record / delivery report。',
		matches(filePath) {
			return (
				filePath.startsWith('docs/') ||
				filePath.startsWith('cool-admin-vue/docs/') ||
				filePath.startsWith('performance-management-system/') ||
				filePath.startsWith('reports/')
			);
		}
	},
	{
		id: 'backend-base-user-dict',
		title: '后端基础权限与用户字典',
		riskLevel: 'high',
		recommendedVerification:
			'cd cool-admin-midway && npm run lint && npm run build && 相关 base/user/dict 定向测试',
		matches(filePath) {
			return (
				filePath.startsWith('cool-admin-midway/src/modules/base/') ||
				filePath.startsWith('cool-admin-midway/src/modules/user/') ||
				filePath.startsWith('cool-admin-midway/src/modules/dict/') ||
				filePath.startsWith('cool-admin-midway/src/domain-registry/') ||
				filePath.startsWith('cool-admin-midway/test/base/') ||
				filePath.startsWith('cool-admin-midway/test/user') ||
				filePath.startsWith('cool-admin-midway/test/dict/') ||
				filePath.startsWith('cool-admin-midway/test/domain-registry')
			);
		}
	},
	{
		id: 'backend-runtime-scripts',
		title: '后端运行态与脚本',
		riskLevel: 'high',
		recommendedVerification:
			'cd cool-admin-midway && npm run lint && npm run build，并补脚本最小真实执行证据。',
		matches(filePath) {
			return (
				filePath === 'cool-admin-midway/package.json' ||
				filePath === 'cool-admin-midway/.eslintrc.json' ||
				filePath === 'cool-admin-midway/src/entities.ts' ||
				filePath === 'cool-admin-midway/src/configuration.ts' ||
				filePath.startsWith('cool-admin-midway/src/config/') ||
				filePath.startsWith('cool-admin-midway/scripts/') ||
				filePath.startsWith('cool-admin-midway/src/modules/base/db/') ||
				filePath.startsWith('cool-admin-midway/src/modules/swagger/')
			);
		}
	},
	{
		id: 'backend-performance-shared',
		title: '绩效后端共享层',
		riskLevel: 'high',
		recommendedVerification:
			'cd cool-admin-midway && npm run build && 共享 domain/helper/service 定向回归测试。',
		matches(filePath) {
			return (
				filePath.startsWith('cool-admin-midway/src/modules/performance/domain/') ||
				/^cool-admin-midway\/src\/modules\/performance\/service\/(?:dashboard|teacher-channel-core|approval-flow|asset-domain|.*-helper)\.ts$/.test(
					filePath
				)
			);
		}
	},
	{
		id: 'backend-performance-themes',
		title: '绩效后端主题实现',
		riskLevel: 'medium',
		recommendedVerification:
			'cd cool-admin-midway && npm run build，并按主题执行定向 service/controller 测试。',
		matches(filePath) {
			return (
				filePath.startsWith('cool-admin-midway/src/modules/performance/') ||
				filePath.startsWith('cool-admin-midway/test/performance/')
			);
		}
	},
	{
		id: 'frontend-contract-base',
		title: '前端共享基础与契约层',
		riskLevel: 'high',
		recommendedVerification:
			'cd cool-admin-vue && corepack pnpm run type-check && corepack pnpm run build',
		matches(filePath) {
			return (
				filePath.startsWith('cool-admin-vue/build/') ||
				filePath === 'cool-admin-vue/package.json' ||
				filePath === 'cool-admin-vue/tsconfig.json' ||
				filePath.startsWith('cool-admin-vue/.env') ||
				filePath.startsWith('cool-admin-vue/src/modules/base/') ||
				filePath.startsWith('cool-admin-vue/src/modules/dict/') ||
				filePath.startsWith('cool-admin-vue/src/cool/') ||
				filePath.startsWith('cool-admin-vue/src/config/') ||
				filePath.startsWith('cool-admin-vue/src/plugins/upload/') ||
				filePath.startsWith('cool-admin-vue/src/router/') ||
				filePath.startsWith('cool-admin-vue/test/') ||
				filePath.startsWith('cool-admin-vue/src/modules/performance/generated/')
			);
		}
	},
	{
		id: 'frontend-performance-themes',
		title: '绩效前端主题实现',
		riskLevel: 'medium',
		recommendedVerification:
			'cd cool-admin-vue && corepack pnpm run type-check && corepack pnpm run build',
		matches(filePath) {
			return filePath.startsWith('cool-admin-vue/src/modules/performance/');
		}
	},
	{
		id: 'frontend-shell-mobile',
		title: '前端视觉壳层与移动端',
		riskLevel: 'medium',
		recommendedVerification:
			'cd cool-admin-vue && corepack pnpm run type-check && corepack pnpm run build；如命中 cool-uni，再跑对应 type-check。',
		matches(filePath) {
			return (
				filePath.startsWith('cool-admin-vue/src/styles/') ||
				filePath.startsWith('cool-admin-vue/src/theme/') ||
				filePath.startsWith('cool-admin-vue/src/assets/') ||
				filePath.startsWith('cool-admin-vue/src/layout/') ||
				filePath.startsWith('cool-admin-vue/src/plugins/theme/') ||
				filePath.startsWith('cool-admin-vue/src/modules/workbench/') ||
				filePath.startsWith('cool-uni/')
			);
		}
	}
];

function classifyPath(filePath) {
	for (const rule of batchRules) {
		if (rule.matches(filePath)) {
			return rule;
		}
	}
	return {
		id: 'uncategorized',
		title: '未归类项',
		riskLevel: 'high',
		recommendedVerification: '人工确认归属后再提交，必要时补分类规则。'
	};
}

function buildIsolation(entries) {
	const groups = [
		{
			kind: 'staged',
			title: '已暂存内容需先隔离',
			paths: entries.filter(entry => entry.staged).map(entry => entry.path)
		},
		{
			kind: 'temporary',
			title: '临时或缓存文件需先清理',
			paths: entries.filter(entry => classifyPath(entry.path).id === 'cleanup-temp').map(entry => entry.path)
		},
		{
			kind: 'untracked',
			title: '未跟踪文件需确认是否应纳入版本控制',
			paths: entries.filter(entry => entry.untracked).map(entry => entry.path)
		}
	];

	return groups
		.filter(group => group.paths.length > 0)
		.map(group => ({
			...group,
			fileCount: group.paths.length
		}));
}

function buildSuggestions(entries, batches, uncategorized) {
	const suggestions = [];
	if (entries.some(entry => entry.staged)) {
		suggestions.push('先处理已暂存文件，避免下一批提交误混未收敛内容。');
	}
	if (entries.some(entry => classifyPath(entry.path).id === 'cleanup-temp')) {
		suggestions.push('临时与缓存文件单独清理，不进入任何业务或治理提交。');
	}
	if (
		batches.some(batch => batch.id === 'backend-base-user-dict') &&
		batches.some(batch => batch.id === 'backend-performance-themes')
	) {
		suggestions.push('高风险基础权限层与绩效主题实现不要混成同一提交。');
	}
	if (
		batches.some(batch => batch.id === 'governance-ssot') &&
		(batches.some(batch => batch.id === 'backend-performance-themes') ||
			batches.some(batch => batch.id === 'frontend-performance-themes'))
	) {
		suggestions.push('治理 / SSOT 变更先独立提交，再提交业务主题实现。');
	}
	if (batches.some(batch => batch.id === 'frontend-shell-mobile')) {
		suggestions.push('视觉壳层与移动端改动拆到最后，避免掩盖主链 correctness 风险。');
	}
	if (uncategorized.length > 0) {
		suggestions.push('存在未归类文件，提交前需要人工定批或补脚本规则。');
	}
	return suggestions;
}

function createAudit(entries, cwd) {
	const files = entries.map(entry => {
		const batch = classifyPath(entry.path);
		return {
			path: entry.path,
			originalPath: entry.originalPath,
			gitStatus: entry.gitStatus,
			staged: entry.staged,
			unstaged: entry.unstaged,
			untracked: entry.untracked,
			batchId: batch.id,
			batchTitle: batch.title,
			riskLevel: batch.riskLevel,
			recommendedVerification: batch.recommendedVerification
		};
	});

	const batchMap = new Map();
	for (const file of files) {
		if (file.batchId === 'uncategorized') {
			continue;
		}
		const current =
			batchMap.get(file.batchId) || {
				id: file.batchId,
				title: file.batchTitle,
				riskLevel: file.riskLevel,
				recommendedVerification: file.recommendedVerification,
				fileCount: 0,
				paths: []
			};
		current.fileCount += 1;
		current.paths.push(file.path);
		batchMap.set(file.batchId, current);
	}

	const batches = [...batchMap.values()].sort((left, right) => {
		if (right.fileCount !== left.fileCount) {
			return right.fileCount - left.fileCount;
		}
		return left.id.localeCompare(right.id);
	});
	const uncategorized = files.filter(file => file.batchId === 'uncategorized');
	const isolation = buildIsolation(entries);
	const suggestions = buildSuggestions(entries, batches, uncategorized);

	return {
		verdict: files.length === 0 ? 'PASS' : 'WARN',
		cwd: normalizePath(cwd),
		generatedAt: new Date().toISOString(),
		totals: {
			files: files.length,
			staged: files.filter(file => file.staged).length,
			unstaged: files.filter(file => file.unstaged).length,
			untracked: files.filter(file => file.untracked).length,
			batches: batches.length
		},
		isolation,
		batches,
		uncategorized,
		suggestions,
		files
	};
}

function renderMarkdown(audit) {
	const lines = [
		`[worktree-split-audit] ${audit.verdict}`,
		'',
		`- cwd: ${audit.cwd}`,
		`- files: ${audit.totals.files}`,
		`- staged: ${audit.totals.staged}`,
		`- unstaged: ${audit.totals.unstaged}`,
		`- untracked: ${audit.totals.untracked}`,
		`- batches: ${audit.totals.batches}`
	];

	if (audit.isolation.length > 0) {
		lines.push('', '## Isolation');
		for (const group of audit.isolation) {
			lines.push(`- ${group.title}: ${group.fileCount}`);
			for (const entry of group.paths.slice(0, 8)) {
				lines.push(`  - ${entry}`);
			}
			if (group.paths.length > 8) {
				lines.push(`  - ... +${group.paths.length - 8} more`);
			}
		}
	}

	if (audit.batches.length > 0) {
		lines.push('', '## Suggested Batches');
		for (const batch of audit.batches) {
			lines.push(`- ${batch.id} | ${batch.title} | ${batch.riskLevel} | ${batch.fileCount}`);
			lines.push(`  - verify: ${batch.recommendedVerification}`);
			for (const entry of batch.paths.slice(0, 8)) {
				lines.push(`  - ${entry}`);
			}
			if (batch.paths.length > 8) {
				lines.push(`  - ... +${batch.paths.length - 8} more`);
			}
		}
	}

	if (audit.uncategorized.length > 0) {
		lines.push('', '## Uncategorized');
		for (const entry of audit.uncategorized.slice(0, 12)) {
			lines.push(`- ${entry.path} | ${entry.gitStatus}`);
		}
		if (audit.uncategorized.length > 12) {
			lines.push(`- ... +${audit.uncategorized.length - 12} more`);
		}
	}

	if (audit.suggestions.length > 0) {
		lines.push('', '## Suggestions');
		for (const suggestion of audit.suggestions) {
			lines.push(`- ${suggestion}`);
		}
	}

	return `${lines.join('\n')}\n`;
}

function renderBatchPaths(audit, batchId) {
	const batch = audit.batches.find(item => item.id === batchId);
	if (!batch) {
		throw new Error(`Unknown batch id: ${batchId}`);
	}
	return `${batch.paths.join('\n')}\n`;
}

function writeReport(filePath, content) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, 'utf8');
}

function resolveDefaultReportPath(cwd, fileName) {
	return path.join(cwd, getSsotArtifactRoot(), fileName);
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const audit = createAudit(parseStatusEntries(runGitStatus(args.cwd)), args.cwd);
	const reportMd = args.reportMd || resolveDefaultReportPath(args.cwd, 'worktree-split-audit.latest.md');
	const reportJson = args.reportJson || resolveDefaultReportPath(args.cwd, 'worktree-split-audit.latest.json');
	const markdown = renderMarkdown(audit);
	const json = `${JSON.stringify(audit, null, 2)}\n`;

	writeReport(reportMd, markdown);
	writeReport(reportJson, json);
	if (args.output === 'json') {
		process.stdout.write(json);
		return 0;
	}
	if (args.output === 'paths') {
		process.stdout.write(renderBatchPaths(audit, args.batchId));
		return 0;
	}
	process.stdout.write(markdown);
	return audit.verdict === 'PASS' ? 0 : 0;
}

process.exit(main());
