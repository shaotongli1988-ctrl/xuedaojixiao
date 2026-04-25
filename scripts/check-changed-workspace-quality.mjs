#!/usr/bin/env node

/**
 * 负责对指定 workspace 的本次改动文件执行只读型格式或 lint 校验。
 * 不负责修复代码风格问题，也不替代全量质量门禁或业务级测试/构建。
 * 依赖 git diff/worktree 状态、workspace 内已安装的 prettier/eslint 与仓库根目录结构。
 * 维护重点：只检查当前变更命中的人工维护文件，避免被历史生成物、vendor 目录或全仓格式债误阻断。
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const TOOL_CONFIG = {
	prettier: {
		command: ['corepack', 'pnpm', 'exec', 'prettier', '--check'],
		extensions: new Set([
			'.js',
			'.cjs',
			'.mjs',
			'.ts',
			'.tsx',
			'.vue',
			'.json',
			'.md',
			'.scss',
			'.css',
			'.yaml',
			'.yml'
		]),
		allowedExactFiles: new Set([
			'package.json',
			'pnpm-lock.yaml',
			'pnpm-workspace.yaml',
			'tsconfig.json',
			'tsconfig.app.json',
			'tsconfig.node.json',
			'vite.config.ts',
			'vite.config.js',
			'eslint.config.js',
			'postcss.config.js',
			'tailwind.config.js',
			'env.d.ts',
			'.prettierrc',
			'.prettierrc.json',
			'.eslintrc',
			'.eslintrc.js'
		])
	},
	eslint: {
		command: ['corepack', 'pnpm', 'exec', 'eslint'],
		extensions: new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.vue']),
		allowedExactFiles: new Set(['vite.config.ts', 'vite.config.js', 'eslint.config.js'])
	}
};

const IGNORED_SEGMENTS = new Set([
	'/build/',
	'/dist/',
	'/coverage/',
	'/generated/',
	'/uni_modules/',
	'/.hbuilderx/',
	'/.vscode/',
	'/.shared-deps/',
	'/docs/superpowers/specs/'
]);

const IGNORED_BASENAMES = new Set([
	'eps.d.ts',
	'eps.json',
	'eps.ssot.d.ts'
]);

function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

function fail(message) {
	console.error(`[changed-workspace-quality] FAIL: ${message}`);
	process.exit(1);
}

function tryRunGit(args) {
	try {
		return execFileSync('git', ['-C', repoRoot, '-c', 'core.quotePath=false', ...args], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trimEnd();
	} catch (error) {
		return '';
	}
}

function runGit(args) {
	try {
		return execFileSync('git', ['-C', repoRoot, '-c', 'core.quotePath=false', ...args], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		}).trimEnd();
	} catch (error) {
		const stderr = error.stderr?.toString().trim() || error.message;
		fail(`git ${args.join(' ')} 执行失败: ${stderr}`);
	}
}

function parseArgs(argv) {
	const args = {
		workspace: '',
		tool: '',
		files: []
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];
		if (current === '--workspace' && next) {
			args.workspace = normalizePath(next);
			index += 1;
			continue;
		}
		if (current === '--tool' && next) {
			args.tool = next;
			index += 1;
			continue;
		}
		if (current === '--file' && next) {
			args.files.push(normalizePath(next));
			index += 1;
			continue;
		}
		fail(`不支持的参数: ${current}`);
	}

	if (!args.workspace) {
		fail('缺少 --workspace');
	}
	if (!args.tool || !TOOL_CONFIG[args.tool]) {
		fail(`缺少或不支持的 --tool: ${args.tool || '(empty)'}`);
	}

	return args;
}

function getUpstreamRef() {
	return tryRunGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim();
}

function getCurrentBranchName() {
	return tryRunGit(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

function getPreferredRemoteName() {
	const currentBranch = getCurrentBranchName();
	const candidates = [
		currentBranch ? tryRunGit(['config', '--get', `branch.${currentBranch}.pushRemote`]).trim() : '',
		currentBranch ? tryRunGit(['config', '--get', `branch.${currentBranch}.remote`]).trim() : '',
		tryRunGit(['config', '--get', 'remote.pushDefault']).trim()
	].filter(Boolean);

	if (candidates.length > 0) {
		return candidates[0];
	}

	const remotes = tryRunGit(['remote'])
		.split('\n')
		.map(item => item.trim())
		.filter(Boolean);
	if (remotes.length === 1) {
		return remotes[0];
	}
	if (remotes.includes('origin')) {
		return 'origin';
	}
	if (remotes.includes('xuedaojixiao')) {
		return 'xuedaojixiao';
	}
	return remotes[0] || '';
}

function getDefaultRemoteHeadRef() {
	const preferredRemote = getPreferredRemoteName();
	if (preferredRemote) {
		const preferredHead = tryRunGit([
			'symbolic-ref',
			'--quiet',
			'--short',
			`refs/remotes/${preferredRemote}/HEAD`
		]).trim();
		if (preferredHead) {
			return preferredHead;
		}
	}

	const remoteHeadRefs = tryRunGit([
		'for-each-ref',
		'--format=%(refname:short)',
		'refs/remotes/*/HEAD'
	])
		.split('\n')
		.map(item => item.trim())
		.filter(Boolean);

	return remoteHeadRefs[0] || '';
}

function resolveDiffBase(upstreamRef) {
	if (upstreamRef) {
		return upstreamRef;
	}

	const remoteHeadRef = getDefaultRemoteHeadRef();
	if (remoteHeadRef) {
		const mergeBase = tryRunGit(['merge-base', 'HEAD', remoteHeadRef]).trim();
		if (mergeBase) {
			return mergeBase;
		}
	}

	const headParent = tryRunGit(['rev-parse', 'HEAD^']).trim();
	if (headParent) {
		return headParent;
	}

	return '';
}

function getPendingCommitFiles(diffBaseRef) {
	if (!diffBaseRef) {
		const output = tryRunGit(['diff-tree', '--no-commit-id', '--name-only', '-r', '--diff-filter=ACMR', 'HEAD']);
		return output ? output.split('\n').map(normalizePath).filter(Boolean) : [];
	}

	const output = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${diffBaseRef}..HEAD`]);
	return output ? output.split('\n').map(normalizePath).filter(Boolean) : [];
}

function parsePorcelainEntry(entry) {
	const status = entry.slice(0, 2);
	const payload = entry.slice(3);
	if (status[0] === 'R' || status[1] === 'R' || status[0] === 'C' || status[1] === 'C') {
		const segments = payload.split('\0').filter(Boolean);
		return segments.length > 1 ? normalizePath(segments[1]) : normalizePath(segments[0] || '');
	}
	return normalizePath(payload);
}

function getWorktreeFiles() {
	const output = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain=v1', '-z', '--untracked-files=all'], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});

	if (!output) {
		return [];
	}

	const rawEntries = output.split('\0').filter(Boolean);
	const files = [];

	for (let index = 0; index < rawEntries.length; index += 1) {
		const entry = rawEntries[index];
		const status = entry.slice(0, 2);
		if (status[0] === 'R' || status[1] === 'R' || status[0] === 'C' || status[1] === 'C') {
			const next = rawEntries[index + 1];
			files.push(next ? normalizePath(next) : parsePorcelainEntry(entry));
			index += 1;
			continue;
		}
		files.push(parsePorcelainEntry(entry));
	}

	return files.filter(Boolean);
}

function collectChangedFiles(fileOverrides) {
	if (fileOverrides.length > 0) {
		return [...new Set(fileOverrides)];
	}

	const upstreamRef = getUpstreamRef();
	const diffBaseRef = resolveDiffBase(upstreamRef);
	const pendingCommitFiles = getPendingCommitFiles(diffBaseRef);
	const worktreeFiles = getWorktreeFiles();
	return [...new Set([...pendingCommitFiles, ...worktreeFiles])];
}

function isIgnoredRelativePath(relativePath) {
	const normalized = `/${normalizePath(relativePath)}`;
	if (IGNORED_BASENAMES.has(path.basename(relativePath))) {
		return true;
	}
	for (const segment of IGNORED_SEGMENTS) {
		if (normalized.includes(segment)) {
			return true;
		}
	}
	return false;
}

function shouldIncludeFile(workspaceRelativePath, toolConfig) {
	if (!workspaceRelativePath || isIgnoredRelativePath(workspaceRelativePath)) {
		return false;
	}

	if (toolConfig.allowedExactFiles.has(workspaceRelativePath)) {
		return true;
	}

	const extension = path.extname(workspaceRelativePath);
	return toolConfig.extensions.has(extension);
}

function resolveCandidateFiles(workspace, tool, changedFiles) {
	const toolConfig = TOOL_CONFIG[tool];
	const workspacePrefix = `${workspace}/`;
	const files = [];

	for (const filePath of changedFiles) {
		if (filePath !== workspace && !filePath.startsWith(workspacePrefix)) {
			continue;
		}
		const workspaceRelativePath = filePath === workspace ? '' : filePath.slice(workspacePrefix.length);
		if (!shouldIncludeFile(workspaceRelativePath, toolConfig)) {
			continue;
		}
		const absolutePath = path.join(repoRoot, filePath);
		if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
			continue;
		}
		files.push(workspaceRelativePath);
	}

	return [...new Set(files)];
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const workspaceRoot = path.join(repoRoot, args.workspace);
	if (!fs.existsSync(workspaceRoot) || !fs.statSync(workspaceRoot).isDirectory()) {
		fail(`workspace 不存在: ${args.workspace}`);
	}

	const changedFiles = collectChangedFiles(args.files);
	const candidateFiles = resolveCandidateFiles(args.workspace, args.tool, changedFiles);
	if (candidateFiles.length === 0) {
		console.log(
			`[changed-workspace-quality] SKIP: ${args.workspace} 没有命中需要执行 ${args.tool} 的变更文件。`
		);
		return 0;
	}

	const toolConfig = TOOL_CONFIG[args.tool];
	const result = spawnSync(toolConfig.command[0], [...toolConfig.command.slice(1), ...candidateFiles], {
		cwd: workspaceRoot,
		stdio: 'inherit',
		encoding: 'utf8'
	});

	if (typeof result.status === 'number') {
		return result.status;
	}
	return result.error ? 1 : 0;
}

process.exit(main());
