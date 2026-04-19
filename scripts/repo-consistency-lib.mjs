/**
 * 负责仓库一致性守卫的公共能力，包括参数解析、git 变更收集、菜单扁平化和文本扫描。
 * 不负责定义具体守卫规则，也不直接决定某一类守卫的阻断语义。
 * 依赖 Node 内置模块、仓库根目录结构和 repo-consistency-config.mjs。
 * 维护重点：输出必须稳定可读，避免因为路径归一化或 git 状态解析差异导致误报。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { guardConfig } from './repo-consistency-config.mjs';

export const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, '..');

export function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

export function toRepoRelative(targetPath) {
	return normalizePath(path.relative(repoRoot, targetPath));
}

export function repoPath(relativePath) {
	return path.join(repoRoot, relativePath);
}

export function pathExists(relativePath) {
	return fs.existsSync(repoPath(relativePath));
}

export function readText(relativePath) {
	return fs.readFileSync(repoPath(relativePath), 'utf8');
}

export function readJson(relativePath) {
	return JSON.parse(readText(relativePath));
}

export function unique(values) {
	return [...new Set(values)];
}

export function info(guardName, message) {
	console.log(`[${guardName}] ${message}`);
}

export function failGuard(guardName, failures) {
	if (!failures.length) {
		return;
	}

	console.error(`\n[${guardName}] FAIL`);
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

export function parseArgs(argv) {
	const args = {
		mode: 'changed',
		files: []
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];

		if (current === '--all') {
			args.mode = 'all';
			continue;
		}

		if (current === '--changed') {
			args.mode = 'changed';
			continue;
		}

		if (current === '--file') {
			const next = argv[index + 1];
			if (!next) {
				throw new Error('`--file` 需要跟一个仓库相对路径。');
			}
			args.files.push(normalizePath(next));
			index += 1;
			continue;
		}

		throw new Error(`不支持的参数: ${current}`);
	}

	return args;
}

function runGit(args) {
	return execFileSync('git', ['-C', repoRoot, ...args], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	}).trimEnd();
}

function getUpstreamRef() {
	try {
		return runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim();
	} catch {
		return '';
	}
}

function getPendingCommitFiles(upstreamRef) {
	if (!upstreamRef) {
		return [];
	}

	const output = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${upstreamRef}..HEAD`]);
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
	const output = execFileSync(
		'git',
		['-C', repoRoot, 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
		{
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

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

export function getChangedFiles(args) {
	if (args.files.length) {
		return unique(args.files);
	}

	if (args.mode === 'all') {
		return [];
	}

	return unique([...getPendingCommitFiles(getUpstreamRef()), ...getWorktreeFiles()]);
}

export function isWithin(filePath, rootPath) {
	if (filePath === rootPath) {
		return true;
	}

	return filePath.startsWith(`${rootPath}/`);
}

export function includesAnyPath(filePaths, roots) {
	return filePaths.some(filePath => roots.some(rootPath => isWithin(filePath, rootPath)));
}

export function walkDirectories(rootRelativePath) {
	const startPath = repoPath(rootRelativePath);
	if (!fs.existsSync(startPath)) {
		return [];
	}

	const directories = [];

	function visit(currentRelativePath) {
		directories.push(currentRelativePath);

		for (const entry of fs.readdirSync(repoPath(currentRelativePath), { withFileTypes: true })) {
			if (!entry.isDirectory()) {
				continue;
			}
			visit(normalizePath(path.join(currentRelativePath, entry.name)));
		}
	}

	visit(rootRelativePath);
	return directories;
}

export function listChildDirectories(relativeDir) {
	if (!pathExists(relativeDir)) {
		return [];
	}

	return fs
		.readdirSync(repoPath(relativeDir), { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => ({
			name: entry.name,
			relativePath: normalizePath(path.join(relativeDir, entry.name))
		}));
}

export function normalizeNameKey(name) {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function collectAncestorDirectories(filePath, stopRoot) {
	const ancestors = [];
	let current = filePath;

	const statsPath = path.extname(current) ? path.dirname(current) : current;
	current = statsPath;

	while (current && isWithin(current, stopRoot)) {
		ancestors.push(current);
		if (current === stopRoot) {
			break;
		}
		current = normalizePath(path.dirname(current));
	}

	return ancestors;
}

export function flattenMenus(menuNodes) {
	const flatList = [];

	function visit(node, parent = null) {
		const currentNode = { ...node, parent };
		flatList.push(currentNode);
		for (const child of node.childMenus || []) {
			visit(child, currentNode);
		}
	}

	for (const menuNode of menuNodes) {
		visit(menuNode);
	}

	return flatList;
}

export function getPerformanceMenuSnapshot() {
	const flatMenus = flattenMenus(readJson(guardConfig.menuJsonPath));
	const pageMenus = flatMenus.filter(
		menu =>
			menu.type === 1 &&
			(typeof menu.router === 'string' &&
				(menu.router.startsWith('/performance/') || menu.router === '/data-center/dashboard'))
	);
	const permissionKeys = unique(
		flatMenus
			.filter(menu => typeof menu.perms === 'string' && menu.perms.includes(guardConfig.namespace))
			.flatMap(menu =>
				menu.perms
					.split(',')
					.map(permission => permission.trim())
					.filter(permission => permission.startsWith(guardConfig.namespace))
			)
	);

	return {
		flatMenus,
		pageMenus,
		permissionKeys
	};
}

export function parseMarkdownTableSection(documentText, sectionTitle) {
	const headingToken = `## ${sectionTitle}`;
	const startIndex = documentText.indexOf(headingToken);
	if (startIndex === -1) {
		return [];
	}

	const nextHeadingIndex = documentText.indexOf('\n## ', startIndex + headingToken.length);
	const sectionText =
		nextHeadingIndex === -1
			? documentText.slice(startIndex)
			: documentText.slice(startIndex, nextHeadingIndex);

	const rows = [];
	for (const line of sectionText.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed.startsWith('|')) {
			continue;
		}

		const cells = trimmed
			.split('|')
			.slice(1, -1)
			.map(cell => cell.trim().replace(/^`+|`+$/g, ''));

		if (!cells.length || cells.every(cell => /^-+$/.test(cell))) {
			continue;
		}

		rows.push(cells);
	}

	if (rows.length < 2) {
		return [];
	}

	const headers = rows[0];
	return rows.slice(1).map(cells => {
		const row = {};
		headers.forEach((header, index) => {
			row[header] = cells[index] || '';
		});
		return row;
	});
}

export function getRouteDocRows() {
	return parseMarkdownTableSection(readText(guardConfig.routeDocPath), '页面菜单映射');
}

export function collectPermissionLiterals(text) {
	return unique(text.match(/performance:[A-Za-z0-9]+:[A-Za-z0-9]+/g) || []);
}

function collectGeneratedPermissionHints(text) {
	const permissions = new Set();
	const officeLedgerActions = ['page', 'info', 'stats', 'add', 'update', 'delete'];
	const officeLedgerFactoryPatterns = [
		/createPerformanceOfficeLedgerService\(\s*['"`]([A-Za-z0-9]+)['"`]\s*\)/g,
		/createOfficeLedgerModuleMeta\(\s*['"`]([A-Za-z0-9]+)['"`]\s*\)/g
	];
	const officeLedgerControllerPatterns = [
		['pageByModule', 'page'],
		['infoByModule', 'info'],
		['statsByModule', 'stats'],
		['addByModule', 'add'],
		['updateByModule', 'update'],
		['deleteByModule', 'delete']
	];

	for (const pattern of officeLedgerFactoryPatterns) {
		for (const match of text.matchAll(pattern)) {
			const moduleKey = match[1];
			if (!moduleKey) {
				continue;
			}
			for (const action of officeLedgerActions) {
				permissions.add(`performance:${moduleKey}:${action}`);
			}
		}
	}

	for (const [methodName, action] of officeLedgerControllerPatterns) {
		const pattern = new RegExp(`${methodName}\\(\\s*['"\`]([A-Za-z0-9]+)['"\`]`, 'g');
		for (const match of text.matchAll(pattern)) {
			const moduleKey = match[1];
			if (!moduleKey) {
				continue;
			}
			permissions.add(`performance:${moduleKey}:${action}`);
		}
	}

	return permissions;
}

export function collectPermissionsFromCodebase() {
	const permissions = new Set();

	for (const root of guardConfig.permissionCodeRoots) {
		if (!pathExists(root)) {
			continue;
		}

		const stack = [root];
		while (stack.length) {
			const current = stack.pop();
			for (const entry of fs.readdirSync(repoPath(current), { withFileTypes: true })) {
				const relativeEntryPath = normalizePath(path.join(current, entry.name));
				if (entry.isDirectory()) {
					stack.push(relativeEntryPath);
					continue;
				}

				if (!/\.(ts|tsx|vue|js|mjs)$/.test(entry.name)) {
					continue;
				}

				for (const permission of collectPermissionLiterals(readText(relativeEntryPath))) {
					permissions.add(permission);
				}

				for (const permission of collectGeneratedPermissionHints(readText(relativeEntryPath))) {
					permissions.add(permission);
				}
			}
		}
	}

	return permissions;
}

export function deriveResourceHintsFromPath(filePath) {
	const fileName = path.basename(filePath, path.extname(filePath));
	const directoryName = path.basename(path.dirname(filePath));
	const candidates = [fileName, directoryName];

	const resourceHints = new Set();
	for (const candidate of candidates) {
		if (!candidate || candidate === 'index') {
			continue;
		}

		const compact = candidate.replace(/[^A-Za-z0-9]/g, '');
		if (!compact) {
			continue;
		}

		resourceHints.add(candidate);
		resourceHints.add(compact);
		resourceHints.add(
			compact.charAt(0).toLowerCase() + compact.slice(1)
		);
	}

	return resourceHints;
}

export function mapPermissionsByResource(permissionKeys) {
	const resourceMap = new Map();

	for (const permission of permissionKeys) {
		const segments = permission.split(':');
		if (segments.length !== 3) {
			continue;
		}

		const resource = segments[1];
		if (!resourceMap.has(resource)) {
			resourceMap.set(resource, new Set());
		}
		resourceMap.get(resource).add(permission);
	}

	return resourceMap;
}

export function getAffectedResourcesFromPaths(filePaths, permissionMap) {
	const resources = new Set();

	for (const filePath of filePaths) {
		const hints = deriveResourceHintsFromPath(filePath);
		for (const [resource] of permissionMap) {
			const normalizedResource = normalizeNameKey(resource);
			for (const hint of hints) {
				if (normalizeNameKey(hint) === normalizedResource) {
					resources.add(resource);
				}
			}
		}
	}

	return resources;
}

export function getRouteDocsByRoute() {
	return new Map(getRouteDocRows().map(row => [row['路由'], row]));
}

export function readChangedFileText(filePath) {
	if (!pathExists(filePath)) {
		return '';
	}

	return readText(filePath);
}
