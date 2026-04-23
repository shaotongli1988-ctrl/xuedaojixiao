#!/usr/bin/env node

/**
 * 负责验证 xuedao 仓库级 SSOT manifest 中声明的关键文件、目录和命令入口是否真实存在。
 * 不负责检查业务内容语义，也不替代各个子守卫的实现级验证。
 * 依赖 scripts/xuedao-ssot-manifest.mjs 与仓库内 contracts/scripts/reports 的实际落点。
 * 维护重点：只校验当前 manifest 覆盖的关键路径，新增字段后要同步扩展校验项。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
	extractCommandBackedPath,
	loadXuedaoSsotManifest,
	resolveSsotManifestPath,
	resolveSsotRepoPath
} from './xuedao-ssot-manifest.mjs';

function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

function isCommandText(value) {
	return typeof value === 'string' && /^(node|python3?)\s+\.\//.test(value.trim());
}

function assertRepoPathExists(failures, relativePath, label) {
	if (!relativePath) {
		failures.push(`${label} 未配置。`);
		return;
	}
	if (!fs.existsSync(resolveSsotRepoPath(relativePath))) {
		failures.push(`${label} 不存在: ${relativePath}`);
	}
}

function getRegisteredMachineSources(manifest) {
	return [
		{
			label: 'apiContract',
			entry: manifest.sourceOfTruth?.apiContract,
			requiredSourceFields: ['sourceFile'],
			requireGenerators: true
		},
		{
			label: 'permissionBits',
			entry: manifest.sourceOfTruth?.permissionBits,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'stateMachines',
			entry: manifest.sourceOfTruth?.stateMachines,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'userAuthSemantics',
			entry: manifest.sourceOfTruth?.userAuthSemantics,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'runtimeConfig',
			entry: manifest.sourceOfTruth?.runtimeConfig,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'mobileSharedContract',
			entry: manifest.sourceOfTruth?.mobileSharedContract,
			requiredSourceFields: ['sourceFile']
		},
		{
			label: 'businessDictionaries',
			entry: manifest.sourceOfTruth?.businessDictionaries,
			requiredSourceFields: ['sourceFile']
		},
		{
			label: 'dictBusinessCatalog',
			entry: manifest.sourceOfTruth?.dictBusinessCatalog,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'sharedErrorSemantics',
			entry: manifest.sourceOfTruth?.sharedErrorSemantics,
			requiredSourceFields: ['sourceFiles']
		},
		{
			label: 'errorCatalog',
			entry: manifest.sourceOfTruth?.errorCatalog,
			requiredSourceFields: ['sourceFile']
		}
	];
}

function collectSourceFiles(entry, requiredSourceFields) {
	const files = [];

	for (const field of requiredSourceFields) {
		const current = entry?.[field];
		if (Array.isArray(current)) {
			files.push(...current);
			continue;
		}
		if (typeof current === 'string' && current.trim()) {
			files.push(current);
		}
	}

	return files;
}

function assertScalarArrayConfigured(failures, entries, label) {
	if (!Array.isArray(entries) || entries.length === 0) {
		failures.push(`${label} 未配置。`);
		return false;
	}
	return true;
}

export function collectManifestCoverageFailures() {
	const manifest = loadXuedaoSsotManifest();
	const failures = [];

	for (const source of getRegisteredMachineSources(manifest)) {
		if (!source.entry || typeof source.entry !== 'object') {
			failures.push(`缺少必需 machine source 注册: ${source.label}`);
			continue;
		}

		if (collectSourceFiles(source.entry, source.requiredSourceFields).length === 0) {
			failures.push(`${source.label} 缺少 sourceFile/sourceFiles 声明。`);
		}
		if (!Array.isArray(source.entry.validators) || source.entry.validators.length === 0) {
			failures.push(`${source.label} 缺少 validators 声明。`);
		}
		if (!Array.isArray(source.entry.generatedConsumers) || source.entry.generatedConsumers.length === 0) {
			failures.push(`${source.label} 缺少 generatedConsumers 声明。`);
		}
		if (source.requireGenerators && (!Array.isArray(source.entry.generators) || source.entry.generators.length === 0)) {
			failures.push(`${source.label} 缺少 generators 声明。`);
		}
	}

	return failures;
}

export function collectManifestFailures() {
	const manifest = loadXuedaoSsotManifest();
	const failures = [];

	assertRepoPathExists(failures, 'contracts/ssot/xuedao-ssot-manifest.yaml', 'manifest 文件');
	for (const source of getRegisteredMachineSources(manifest)) {
		const sourceFiles = collectSourceFiles(source.entry, source.requiredSourceFields);
		for (const [index, sourceFile] of sourceFiles.entries()) {
			assertRepoPathExists(failures, sourceFile, `${source.label}.sourceFiles[${index}]`);
		}
		if (assertScalarArrayConfigured(failures, source.entry?.validators, `${source.label}.validators`)) {
			for (const entry of source.entry.validators) {
				const commandPath = extractCommandBackedPath(entry);
				if (!commandPath) {
					failures.push(`${source.label}.validators 存在无法解析的命令: ${entry}`);
					continue;
				}
				assertRepoPathExists(failures, commandPath, `${source.label}.validators -> ${commandPath}`);
			}
		}
		if (
			source.requireGenerators &&
			assertScalarArrayConfigured(failures, source.entry?.generators, `${source.label}.generators`)
		) {
			for (const entry of source.entry.generators) {
				const commandPath = extractCommandBackedPath(entry);
				if (!commandPath) {
					failures.push(`${source.label}.generators 存在无法解析的命令: ${entry}`);
					continue;
				}
				assertRepoPathExists(failures, commandPath, `${source.label}.generators -> ${commandPath}`);
			}
		}
		if (
			assertScalarArrayConfigured(
				failures,
				source.entry?.generatedConsumers,
				`${source.label}.generatedConsumers`
			)
		) {
			for (const consumerPath of source.entry.generatedConsumers) {
				assertRepoPathExists(
					failures,
					normalizePath(consumerPath),
					`${source.label}.generatedConsumers -> ${consumerPath}`
				);
			}
		}
	}

	for (const [label, entry] of [
		['repoConsistency.guardEntry', manifest.sourceOfTruth?.repoConsistency?.guardEntry],
		['localPushGate.gateEntry', manifest.sourceOfTruth?.localPushGate?.gateEntry],
		['localPushGate.hookFile', manifest.sourceOfTruth?.localPushGate?.hookFile],
		['records.changeTemplate', manifest.records?.changeTemplate],
		['records.verificationTemplate', manifest.records?.verificationTemplate],
		['records.artifactRoot', manifest.records?.artifactRoot]
	]) {
		if (isCommandText(entry)) {
			assertRepoPathExists(failures, extractCommandBackedPath(entry), label);
			continue;
		}
		assertRepoPathExists(failures, entry, label);
	}

	for (const [groupLabel, entries] of [['repoConsistency.subGuards', manifest.sourceOfTruth?.repoConsistency?.subGuards || []]]) {
		for (const entry of entries) {
			const commandPath = extractCommandBackedPath(entry);
			if (!commandPath) {
				failures.push(`${groupLabel} 存在无法解析的命令: ${entry}`);
				continue;
			}
			assertRepoPathExists(failures, commandPath, `${groupLabel} -> ${commandPath}`);
		}
	}

	return failures;
}

export function runManifestCheck() {
	const failures = [...collectManifestFailures(), ...collectManifestCoverageFailures()];

	if (failures.length) {
		console.error(
			`[xuedao-ssot-manifest] FAIL: ${path.relative(process.cwd(), resolveSsotManifestPath())}`
		);
		for (const failure of failures) {
			console.error(`- ${failure}`);
		}
		return 1;
	}

	console.log(
		`[xuedao-ssot-manifest] OK: ${path.relative(process.cwd(), resolveSsotManifestPath())} 已通过关键路径校验。`
	);
	return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
	process.exit(runManifestCheck());
}
