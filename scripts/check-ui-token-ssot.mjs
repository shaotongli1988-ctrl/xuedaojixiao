#!/usr/bin/env node

/**
 * 负责校验仓库级 UI 设计系统主源登记、统一样式入口拓扑，以及变更文件是否绕开共享 token。
 * 不负责替代视觉评审、批量修复历史样式债或保证每个业务页都达到统一视觉质量。
 * 依赖 xuedao-ssot manifest、cool-admin-vue/src/styles/* 与显式传入的 changed file scope。
 * 维护重点：新增共享样式文件必须先登记到 manifest；业务 consumer 新增原始色值、rgb 或 gradient 时，必须先沉淀到共享 token/pattern 文件。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadXuedaoSsotManifest, resolveSsotRepoPath } from './xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const STYLE_FILE_PATTERN = /\.(?:css|scss|sass|less|styl|vue)$/i;
const RAW_STYLE_LITERAL_PATTERNS = [
	{
		label: 'hex color',
		regex: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
	},
	{
		label: 'rgb color',
		regex: /\brgba?\s*\(/g
	},
	{
		label: 'gradient',
		regex: /\b(?:linear|radial)-gradient\s*\(/g
	},
	{
		label: 'color-mix',
		regex: /\bcolor-mix\s*\(/g
	}
];

function normalizePath(value) {
	return String(value || '').replaceAll('\\', '/').trim();
}

function parseArgs(argv) {
	const args = {
		all: false,
		changedFiles: []
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

		throw new Error(`Unsupported arg: ${current}`);
	}

	args.changedFiles = [...new Set(args.changedFiles)];
	return args;
}

function toRepoRelative(targetPath) {
	const normalized = normalizePath(targetPath);
	if (!normalized) {
		return '';
	}
	const normalizedRoot = normalizePath(repoRoot);
	let candidate = normalized;
	if (normalized.startsWith(`${normalizedRoot}/`)) {
		candidate = normalized.slice(normalizedRoot.length + 1);
	}
	return candidate.replace(/^\.\//, '').replace(/\/+$/, '');
}

function pathExists(relativePath) {
	return fs.existsSync(resolveSsotRepoPath(relativePath));
}

function readText(relativePath) {
	return fs.readFileSync(resolveSsotRepoPath(relativePath), 'utf8');
}

function matchesScopedRoot(relativePath, roots) {
	return roots.some(root => relativePath === root || relativePath.startsWith(`${root}/`));
}

function collectDirectoryStyleFiles(relativePath, bucket) {
	const absolutePath = resolveSsotRepoPath(relativePath);
	const stats = fs.statSync(absolutePath);

	if (stats.isDirectory()) {
		for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
			collectDirectoryStyleFiles(`${relativePath}/${entry.name}`, bucket);
		}
		return;
	}

	if (STYLE_FILE_PATTERN.test(relativePath)) {
		bucket.add(toRepoRelative(relativePath));
	}
}

function collectRegisteredStyleFiles(paths) {
	const bucket = new Set();

	for (const relativePath of paths) {
		if (!relativePath || !pathExists(relativePath)) {
			continue;
		}

		collectDirectoryStyleFiles(relativePath, bucket);
	}

	return [...bucket];
}

function collectStyleBlocks(source, relativePath) {
	if (relativePath.endsWith('.vue')) {
		return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
	}
	return [source];
}

function buildLineMap(source) {
	const lineStarts = [0];
	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '\n') {
			lineStarts.push(index + 1);
		}
	}
	return lineStarts;
}

function locateLine(lineStarts, index) {
	let low = 0;
	let high = lineStarts.length - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (lineStarts[mid] <= index && (mid === lineStarts.length - 1 || lineStarts[mid + 1] > index)) {
			return mid + 1;
		}
		if (lineStarts[mid] > index) {
			high = mid - 1;
			continue;
		}
		low = mid + 1;
	}
	return 1;
}

function collectLiteralHits(source, relativePath) {
	const hits = [];
	const blocks = collectStyleBlocks(source, relativePath);

	for (const block of blocks) {
		const lineStarts = buildLineMap(block);
		for (const pattern of RAW_STYLE_LITERAL_PATTERNS) {
			for (const match of block.matchAll(pattern.regex)) {
				hits.push({
					label: pattern.label,
					line: locateLine(lineStarts, match.index ?? 0),
					snippet: match[0]
				});
			}
		}
	}

	return hits;
}

function validateManifestEntry(manifest) {
	const failures = [];
	const uiDesignSystem = manifest.sourceOfTruth?.uiDesignSystem;
	if (!uiDesignSystem || typeof uiDesignSystem !== 'object') {
		return {
			failures: ['缺少 sourceOfTruth.uiDesignSystem 注册。'],
			sourceFiles: [],
			generatedConsumers: []
		};
	}

	const sourceFiles = Array.isArray(uiDesignSystem.sourceFiles)
		? uiDesignSystem.sourceFiles.map(toRepoRelative).filter(Boolean)
		: [];
	const generatedConsumers = Array.isArray(uiDesignSystem.generatedConsumers)
		? uiDesignSystem.generatedConsumers.map(toRepoRelative).filter(Boolean)
		: [];
	const validators = Array.isArray(uiDesignSystem.validators) ? uiDesignSystem.validators : [];

	if (sourceFiles.length === 0) {
		failures.push('uiDesignSystem.sourceFiles 未配置。');
	}
	if (generatedConsumers.length === 0) {
		failures.push('uiDesignSystem.generatedConsumers 未配置。');
	}
	if (validators.length === 0) {
		failures.push('uiDesignSystem.validators 未配置。');
	}
	if (!validators.some(entry => String(entry).includes('check-ui-token-ssot.mjs'))) {
		failures.push('uiDesignSystem.validators 必须登记 check-ui-token-ssot.mjs。');
	}

	for (const requiredFile of [
		'cool-admin-vue/src/styles/index.scss',
		'cool-admin-vue/src/styles/tokens.foundation.scss',
		'cool-admin-vue/src/styles/tokens.semantic.scss',
		'cool-admin-vue/src/styles/adapters.element-plus.scss'
	]) {
		if (!sourceFiles.includes(requiredFile)) {
			failures.push(`uiDesignSystem.sourceFiles 缺少核心文件：${requiredFile}`);
		}
	}

	if (!sourceFiles.some(relativePath => /\/patterns\.[^/]+\.scss$/.test(relativePath))) {
		failures.push('uiDesignSystem.sourceFiles 至少要登记一个 patterns.*.scss 共享模式文件。');
	}

	for (const relativePath of [...sourceFiles, ...generatedConsumers]) {
		if (!pathExists(relativePath)) {
			failures.push(`uiDesignSystem 登记路径不存在：${relativePath}`);
		}
	}

	const indexFile = 'cool-admin-vue/src/styles/index.scss';
	if (pathExists(indexFile)) {
		const indexSource = readText(indexFile);
		for (const expectedUse of [
			/@use\s+['"]\.\/tokens\.foundation\.scss['"]\s+as\s+foundation\s*;/,
			/@use\s+['"]\.\/tokens\.semantic\.scss['"]\s+as\s+semantic\s*;/,
			/@use\s+['"]\.\/adapters\.element-plus\.scss['"]\s+as\s+adapter\s*;/
		]) {
			if (!expectedUse.test(indexSource)) {
				failures.push(`styles/index.scss 缺少统一入口依赖：${expectedUse}`);
			}
		}
	}

	return { failures, sourceFiles, generatedConsumers };
}

function collectScopedFiles(args, sourceFiles, generatedConsumers) {
	if (args.all) {
		return [...new Set([...collectRegisteredStyleFiles(sourceFiles), ...collectRegisteredStyleFiles(generatedConsumers)])];
	}

	const scopedFiles = args.changedFiles
		.map(toRepoRelative)
		.filter(relativePath => relativePath && STYLE_FILE_PATTERN.test(relativePath))
		.filter(relativePath => pathExists(relativePath))
		.filter(relativePath => matchesScopedRoot(relativePath, generatedConsumers));

	return [...new Set(scopedFiles)];
}

function runCheck(args) {
	const manifest = loadXuedaoSsotManifest();
	const { failures, sourceFiles, generatedConsumers } = validateManifestEntry(manifest);
	const sourceFileSet = new Set(sourceFiles);

	for (const relativePath of collectScopedFiles(args, sourceFiles, generatedConsumers)) {
		if (relativePath.startsWith('cool-admin-vue/src/styles/') && !sourceFileSet.has(relativePath)) {
			failures.push(`共享样式文件未登记到 uiDesignSystem.sourceFiles：${relativePath}`);
			continue;
		}

		if (sourceFileSet.has(relativePath)) {
			continue;
		}

		const literalHits = collectLiteralHits(readText(relativePath), relativePath);
		for (const hit of literalHits) {
			failures.push(
				`${relativePath}:${hit.line} 命中未收敛的 ${hit.label} 字面量 ${hit.snippet}，请先沉淀到共享 token/pattern 文件`
			);
		}
	}

	return {
		failures,
		sourceCount: sourceFiles.length,
		scopedFileCount: collectScopedFiles(args, sourceFiles, generatedConsumers).length
	};
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const result = runCheck(args);

	if (result.failures.length > 0) {
		console.error('[ui-token-ssot] FAIL');
		for (const failure of result.failures) {
			console.error(`- ${failure}`);
		}
		return 1;
	}

	console.log(
		`[ui-token-ssot] PASS (${result.sourceCount} source files, ${result.scopedFileCount} scoped style files)`
	);
	return 0;
}

process.exit(main());
