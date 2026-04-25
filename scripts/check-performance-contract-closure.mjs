#!/usr/bin/env node

/**
 * Verifies performance contract producer/consumer closure against the backend registry source.
 * It only checks module coverage, generated artifact ownership, and shadow-contract drift; it does not rewrite artifacts.
 * Key dependencies are the performance contract-source registry, repository OpenAPI, generated consumer outputs, and adapter files.
 * Maintenance invariant: producer coverage and generated consumer targets must be registered before adding or moving contract files.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
	loadPerformanceContractSourceConfig,
	PERFORMANCE_CONTROLLER_ROOT,
	PERFORMANCE_WEB_SERVICE_ROOT,
} from '../cool-admin-midway/src/modules/performance/domain/registry/contract-source.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const openapiPath = path.join(repoRoot, 'contracts/openapi/xuedao.openapi.json');

function pathExists(relativePath) {
	return fs.existsSync(path.join(repoRoot, relativePath));
}

function listPerformanceModulePaths(spec, moduleRoot) {
	return Object.keys(spec.paths || {}).filter(route =>
		route.startsWith(`/admin/performance/${moduleRoot}`)
	);
}

function resolvePerformanceRouteRoot(moduleRoot) {
	return moduleRoot === 'approvalFlow' ? 'approval-flow' : moduleRoot;
}

function toKebabCase(value) {
	return String(value)
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase();
}

function createFinding(scope, problem, requiredFix) {
	return { scope, problem, requiredFix };
}

function requireFile(findings, relativePath, scope, requiredFix) {
	if (!pathExists(relativePath)) {
		findings.push(
			createFinding(scope, `缺少文件: ${relativePath}`, requiredFix)
		);
	}
}

function hasRegisteredControllerFile(contractSource, moduleRoot) {
	const registeredControllers = new Set([
		...contractSource.producer.manualModules.map(item => item.controllerFile),
		...contractSource.producer.serviceModules.map(item => item.controllerFile),
	]);
	const candidates = [`${moduleRoot}.ts`, `${toKebabCase(moduleRoot)}.ts`];
	return candidates.some(file => registeredControllers.has(file));
}

function checkServiceCapablePublishOnlyModules(findings, contractSource) {
	for (const moduleRoot of contractSource.producer.publishOnlyModules) {
		const matchedTarget = contractSource.consumers.webTargets.find(
			target =>
				target.moduleRoots.includes(moduleRoot) &&
				target.servicePaths.length > 0
		);
		if (!matchedTarget || !matchedTarget.servicePaths.every(pathExists)) {
			continue;
		}
		if (hasRegisteredControllerFile(contractSource, moduleRoot)) {
			continue;
		}

		const controllerCandidates = [
			`${PERFORMANCE_CONTROLLER_ROOT}/${moduleRoot}.ts`,
			`${PERFORMANCE_CONTROLLER_ROOT}/${toKebabCase(moduleRoot)}.ts`
		];
		if (!controllerCandidates.some(pathExists)) {
			continue;
		}

		findings.push(
			createFinding(
				`producer.${moduleRoot}`,
				`service-capable 模块仍停留在 publishOnlyModules: ${moduleRoot}`,
				'把该模块迁移到 serviceModules，并登记 controllerFile/serviceFile；只有共享 consumer 或无稳定 service wrapper 的模块才允许保留 publishOnly。'
			)
		);
	}
}

function checkProducerCoverage(findings, contractSource, spec) {
	const registeredProducerModules = new Set([
		...contractSource.producer.publishOnlyModules,
		...contractSource.producer.manualModules.map(item => item.moduleRoot),
		...contractSource.producer.serviceModules.map(item => item.moduleRoot),
	]);

	for (const moduleRoot of registeredProducerModules) {
		const routeRoot = resolvePerformanceRouteRoot(moduleRoot);
		if (!listPerformanceModulePaths(spec, routeRoot).length) {
			findings.push(
				createFinding(
					`producer.${moduleRoot}`,
					`OpenAPI 中缺少 /admin/performance/${routeRoot} 路由覆盖。`,
					'先同步 controller/service 与 contracts/openapi/xuedao.openapi.json，再运行 contract closure 守卫。'
				)
			);
		}
	}

	for (const manualModule of contractSource.producer.manualModules) {
		requireFile(
			findings,
			`${PERFORMANCE_CONTROLLER_ROOT}/${manualModule.controllerFile}`,
			`producer.${manualModule.moduleRoot}`,
			'补齐 registry 中声明的 manual controller 文件，或从 contract-source.json 移除无效登记。'
		);
	}

	for (const serviceModule of contractSource.producer.serviceModules) {
		requireFile(
			findings,
			`${PERFORMANCE_CONTROLLER_ROOT}/${serviceModule.controllerFile}`,
			`producer.${serviceModule.moduleRoot}`,
			'补齐 registry 中声明的 controller 文件，或更新 controllerFile 映射。'
		);
		requireFile(
			findings,
			`${PERFORMANCE_WEB_SERVICE_ROOT}/${serviceModule.serviceFile}`,
			`producer.${serviceModule.moduleRoot}`,
			'补齐 registry 中声明的 web service 文件，或更新 serviceFile 映射。'
		);
	}

	checkServiceCapablePublishOnlyModules(findings, contractSource);
}

function checkConsumerTargets(findings, contractSource) {
	const registeredModuleSpecificAdapterFiles = new Set();

	for (const target of contractSource.consumers.webTargets) {
		for (const servicePath of target.servicePaths) {
			requireFile(
				findings,
				servicePath,
				`consumer.web.${target.targetKey}`,
				'补齐 web service 文件，或把该 target 从 contract-source.json 中移除。'
			);
		}
		for (const adapterPath of target.contractAdapterPaths || []) {
			registeredModuleSpecificAdapterFiles.add(adapterPath);
			requireFile(
				findings,
				adapterPath,
				`consumer.web.${target.targetKey}`,
				'补齐 module-specific contract adapter，或从 target 配置移除无效 adapter。'
			);
		}
		requireFile(
			findings,
			target.generatedPath,
			`consumer.web.${target.targetKey}`,
			'先运行 openapi-contract-sync.mjs --write 生成缺失的 web generated 文件。'
		);
	}

	for (const supportPath of contractSource.consumers.webSupportFiles) {
		requireFile(
			findings,
			supportPath,
			'consumer.web.support',
			'补齐 web shared contract support 文件，或从 contract-source.json support 列表移除。'
		);
	}

	for (const target of contractSource.consumers.uniTargets) {
		for (const servicePath of target.servicePaths) {
			requireFile(
				findings,
				servicePath,
				`consumer.uni.${target.targetKey}`,
				'补齐 uni service 文件，或把该 target 从 contract-source.json 中移除。'
			);
		}
		requireFile(
			findings,
			target.generatedPath,
			`consumer.uni.${target.targetKey}`,
			'先运行 openapi-contract-sync.mjs --write 生成缺失的 uni generated 文件。'
		);
		requireFile(
			findings,
			target.typeWrapperPath,
			`consumer.uni.${target.targetKey}`,
			'补齐 uni types wrapper 文件，或从 contract-source.json 中移除该 target。'
		);
	}

	return registeredModuleSpecificAdapterFiles;
}

function checkWebContractAdapters(findings, contractSource, registeredModuleSpecificAdapterFiles) {
	const adapterDir = path.join(repoRoot, PERFORMANCE_WEB_SERVICE_ROOT);
	const allContractFiles = fs
		.readdirSync(adapterDir)
		.filter(name => name.endsWith('-contract.ts'))
		.map(name => `${PERFORMANCE_WEB_SERVICE_ROOT}/${name}`)
		.sort();
	const allowedContractFiles = new Set([
		...contractSource.consumers.webSupportFiles,
		...registeredModuleSpecificAdapterFiles,
	]);

	for (const contractFile of allContractFiles) {
		if (!allowedContractFiles.has(contractFile)) {
			findings.push(
				createFinding(
					'consumer.web.contractAdapters',
					`未登记的 contract adapter 文件: ${contractFile}`,
					'把 contract adapter 加入 contract-source.json target/support 清单，或删除废弃影子文件。'
				)
			);
		}
	}

	for (const contractFile of registeredModuleSpecificAdapterFiles) {
		const text = fs.readFileSync(path.join(repoRoot, contractFile), 'utf8');
		const exportTypeMatch = text.match(
			/^\s*export\s+(?:interface|type)\s+([A-Za-z0-9_]+)\b/m
		);
		if (exportTypeMatch) {
			findings.push(
				createFinding(
					contractFile,
					`module-specific contract adapter 导出了本地类型符号 ${exportTypeMatch[1]}。`,
					'保持 adapter 为 decoder-only；请求/响应/状态类型统一从 ../types 或 generated 链消费。'
				)
			);
		}
	}
}

function checkUniTypeWrappers(findings, contractSource) {
	for (const target of contractSource.consumers.uniTargets) {
		const wrapperPath = path.join(repoRoot, target.typeWrapperPath);
		if (!fs.existsSync(wrapperPath)) {
			continue;
		}
		const text = fs.readFileSync(wrapperPath, 'utf8');
		const expectedImportToken = `performance-${target.targetKey}.generated`;
		if (!text.includes(expectedImportToken)) {
			findings.push(
				createFinding(
					target.typeWrapperPath,
					`uni types wrapper 未引用对应 generated 文件: ${expectedImportToken}`,
					'保持 cool-uni types wrapper 只做 generated-derived 转发，不要改回独立主源。'
				)
			);
		}
		const localInterfaceMatch = text.match(
			/^\s*export\s+interface\s+([A-Za-z0-9]+(?:Record|PageResult|Summary))\b/m
		);
		if (localInterfaceMatch) {
			findings.push(
				createFinding(
					target.typeWrapperPath,
					`uni types wrapper 定义了本地 interface ${localInterfaceMatch[1]}。`,
					'改为 type alias 或 generated-derived 包装，避免再次手写实体主源。'
				)
			);
		}
	}
}

function main() {
	const spec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
	const contractSource = loadPerformanceContractSourceConfig(repoRoot);
	const findings = [];

	checkProducerCoverage(findings, contractSource, spec);
	const registeredModuleSpecificAdapterFiles = checkConsumerTargets(
		findings,
		contractSource
	);
	checkWebContractAdapters(
		findings,
		contractSource,
		registeredModuleSpecificAdapterFiles
	);
	checkUniTypeWrappers(findings, contractSource);

	if (findings.length > 0) {
		for (const finding of findings) {
			console.error(
				`[performance-contract-closure] ${finding.scope}: ${finding.problem}\n  fix: ${finding.requiredFix}`
			);
		}
		process.exit(1);
	}

	console.log('[performance-contract-closure] PASS');
}

main();
