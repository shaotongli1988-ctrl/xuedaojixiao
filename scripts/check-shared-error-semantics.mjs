#!/usr/bin/env node

/**
 * 负责校验 base/user/dict 共享错误目录与当前运行时抛错文案是否一致。
 * 不负责修改运行时代码，也不替代更细粒度的异常码治理或前端错误处理校验。
 * 依赖三个 domain error catalog 和对应 runtime source 文件。
 * 维护重点：新增共享错误文案时，必须同时更新 catalog 与 runtime source 列表。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDir, '..');

function parseArgs(argv) {
	const args = {
		cwd: defaultRepoRoot
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];
		if (current === '--cwd' && next) {
			args.cwd = path.resolve(next);
			index += 1;
			continue;
		}
		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

function readText(root, relativePath) {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function extractQuotedValues(source) {
	return [...source.matchAll(/'([^']+)'|"([^"]+)"/g)].map(match => match[1] || match[2]);
}

function extractConstArray(source, constName) {
	const match = source.match(new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const;`));
	if (!match) {
		throw new Error(`无法解析 ${constName}`);
	}
	return extractQuotedValues(match[1]);
}

function extractCatalogMessages(source) {
	return [...source.matchAll(/defaultMessage:\s*(['"])(.*?)\1/g)].map(match => match[2]);
}

function extractCatalogCodes(source) {
	return [...source.matchAll(/code:\s*[^,\n]+/g)].map(match => match[0]);
}

function normalizeTemplatePlaceholders(message) {
	return message.replace(/\$\{([^}]+)\}/g, '{$1}');
}

function extractRuntimeMessages(source) {
	const messages = [];
	const pattern =
		/throw new (?:CoolCommException|Error)\(\s*(?:`([^`]+)`|(['"])(.*?)\2)/gs;
	for (const match of source.matchAll(pattern)) {
		const rawMessage = match[1] || match[3] || '';
		messages.push(normalizeTemplatePlaceholders(rawMessage));
	}
	return messages;
}

function duplicateValues(values) {
	const counts = new Map();
	for (const value of values) {
		counts.set(value, (counts.get(value) || 0) + 1);
	}
	return [...counts.entries()]
		.filter(([, count]) => count > 1)
		.map(([value]) => value);
}

function validateCatalog(root, moduleName, catalogPath, runtimeSourceConst) {
	const failures = [];
	const catalogSource = readText(root, catalogPath);
	const runtimeSources = extractConstArray(catalogSource, runtimeSourceConst);
	const catalogMessages = extractCatalogMessages(catalogSource);
	const messageSet = new Set(catalogMessages);

	for (const duplicate of duplicateValues(catalogMessages)) {
		failures.push(`${moduleName} catalog 存在重复 defaultMessage: ${duplicate}`);
	}

	for (const duplicate of duplicateValues(extractCatalogCodes(catalogSource))) {
		failures.push(`${moduleName} catalog 存在重复 code 声明: ${duplicate}`);
	}

	for (const runtimeSource of runtimeSources) {
		const absolutePath = path.join(root, 'cool-admin-midway', runtimeSource);
		if (!fs.existsSync(absolutePath)) {
			failures.push(`${moduleName} runtime source 不存在: ${runtimeSource}`);
			continue;
		}

		const runtimeMessages = extractRuntimeMessages(
			fs.readFileSync(absolutePath, 'utf8')
		);
		for (const runtimeMessage of runtimeMessages) {
			if (!messageSet.has(runtimeMessage)) {
				failures.push(
					`${moduleName} runtime message 未登记到 catalog: ${runtimeSource} -> ${runtimeMessage}`
				);
			}
		}
	}

	return failures;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const failures = [
		...validateCatalog(
			args.cwd,
			'base',
			'cool-admin-midway/src/modules/base/domain/errors/catalog.ts',
			'BASE_DOMAIN_ERROR_RUNTIME_SOURCES'
		),
		...validateCatalog(
			args.cwd,
			'user',
			'cool-admin-midway/src/modules/user/domain/errors/catalog.ts',
			'USER_DOMAIN_ERROR_RUNTIME_SOURCES'
		),
		...validateCatalog(
			args.cwd,
			'dict',
			'cool-admin-midway/src/modules/dict/domain/errors/catalog.ts',
			'DICT_DOMAIN_ERROR_RUNTIME_SOURCES'
		),
	];

	if (failures.length > 0) {
		console.error('[shared-error-semantics] FAIL');
		for (const failure of failures) {
			console.error(`- ${failure}`);
		}
		return 1;
	}

	console.log('[shared-error-semantics] PASS');
	return 0;
}

process.exit(main());
