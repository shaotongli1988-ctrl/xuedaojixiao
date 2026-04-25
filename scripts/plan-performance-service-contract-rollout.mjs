#!/usr/bin/env node

/**
 * 盘点 cool-admin-vue performance service 的 runtime contract 收口状态。
 * 不负责直接改写业务代码或替代人工 review。
 * 维护重点：把剩余 service 按可自动化程度分层，给后续批量 contract rollout 提供稳定输入。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const performanceServiceDir = path.join(
	repoRoot,
	'cool-admin-vue/src/modules/performance/service'
);

const args = new Set(process.argv.slice(2));
const outputJson = args.has('--json');

function readFile(filePath) {
	return fs.readFileSync(filePath, 'utf8');
}

function collectServiceFiles() {
	return fs
		.readdirSync(performanceServiceDir)
		.filter(name => name.endsWith('.ts'))
		.filter(name => !name.endsWith('-contract.ts'))
		.filter(
			name =>
				![
					'access-context.ts',
					'role-fact.ts',
					'service-contract.ts',
					'workbench-snapshot-config.ts'
				].includes(name)
		)
		.map(name => ({
			name,
			absPath: path.join(performanceServiceDir, name),
			relPath: path.relative(repoRoot, path.join(performanceServiceDir, name))
		}))
		.sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeTypeExpression(typeExpression) {
	return typeExpression.replace(/\s+/g, ' ').trim();
}

function toKebabCase(value) {
	return value
		.replace(/\.ts$/, '')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/_/g, '-')
		.toLowerCase();
}

function pluralizeDecoderTarget(baseType) {
	if (baseType.endsWith('Row')) {
		return `${baseType}s`;
	}
	if (baseType.endsWith('Point')) {
		return `${baseType}s`;
	}
	if (baseType.endsWith('Stat')) {
		return `${baseType}s`;
	}
	if (baseType.endsWith('Item')) {
		return `${baseType}s`;
	}
	return `${baseType}List`;
}

function suggestDecoderName(typeExpression) {
	const normalized = normalizeTypeExpression(typeExpression);
	if (normalized.endsWith('[]')) {
		const baseType = normalized.slice(0, -2).trim();
		return `decode${pluralizeDecoderTarget(baseType)}`;
	}
	return `decode${normalized.replace(/[<>{}\s|,&?]/g, '')}`;
}

function collectTypeImports(source) {
	const imports = [];
	const importRegex = /import\s+type\s+{[\s\S]*?}\s+from\s+['"]([^'"]+)['"]/g;
	for (const match of source.matchAll(importRegex)) {
		imports.push(match[1]);
	}
	return imports;
}

function collectReturnTypes(source) {
	const returnTypes = [];
	const seen = new Set();
	const regex = /asPerformanceServicePromise<([\s\S]*?)>\s*\(/g;
	for (const match of source.matchAll(regex)) {
		const typeExpression = normalizeTypeExpression(match[1]);
		if (seen.has(typeExpression)) {
			continue;
		}
		seen.add(typeExpression);
		returnTypes.push({
			type: typeExpression,
			decoder: suggestDecoderName(typeExpression)
		});
	}
	return returnTypes;
}

function classifyService(fileName, source, typeImports, returnTypes) {
	let score = 0;
	const reasons = [];

	const classCount = (source.match(/\bclass\s+[A-Za-z0-9_]+/g) || []).length;
	if (classCount > 1) {
		score += 2;
		reasons.push('contains multiple service classes');
	}

	const foreignTypeImports = typeImports.filter(
		importPath => importPath !== '../types' && importPath !== '../../base/generated/permissions.generated'
	);
	if (
		foreignTypeImports.some(
			importPath => importPath === '../course-learning' || importPath === '../course-learning.types'
		)
	) {
		score += 2;
		reasons.push('depends on course-learning local type modules');
	} else if (foreignTypeImports.some(importPath => importPath.startsWith('../'))) {
		score += 1;
		reasons.push('depends on non-standard local type modules');
	}

	if (/\/admin\/performance\//.test(source)) {
		score += 1;
		reasons.push('calls cross-resource absolute performance endpoints');
	}

	if (/\bTRecord\b|\bTStats\b|<T[A-Za-z]/.test(source)) {
		score += 2;
		reasons.push('uses generic service shapes');
	}

	if (
		/asset-|material-|office-ledger|teacher|course-learning|course-practice|course-recite|course-exam/.test(
			fileName
		)
	) {
		score += 2;
		reasons.push('belongs to a historically custom or shared-heavy domain');
	}

	if (
		returnTypes.some(
			item =>
				item.type.includes('|') ||
				item.type.includes('{') ||
				item.type.includes('Record<string') ||
				item.type.includes('unknown')
		)
	) {
		score += 2;
		reasons.push('contains union or structural return types');
	}

	if (returnTypes.length > 6) {
		score += 1;
		reasons.push('has many decoded response shapes');
	}

	if (score <= 1) {
		return { tier: 'safe_auto', score, reasons };
	}
	if (score <= 3) {
		return { tier: 'scaffold_first', score, reasons };
	}
	return { tier: 'manual', score, reasons };
}

function analyzeService(file) {
	const source = readFile(file.absPath);
	const hasAsPerformanceServicePromise = source.includes('asPerformanceServicePromise<');
	const contractImportMatch = source.match(
		/from ['"]\.\/((?!service-contract)[^'"]+-contract)['"]/
	);
	const contractImport = contractImportMatch ? contractImportMatch[1] : null;
	const typeImports = collectTypeImports(source);
	const returnTypes = collectReturnTypes(source);
	const baseName = file.name.replace(/\.ts$/, '');
	const suggestedContractFile = `${toKebabCase(baseName)}-contract.ts`;

	if (!hasAsPerformanceServicePromise) {
		return {
			...file,
			hasAsPerformanceServicePromise,
			covered: Boolean(contractImport),
			contractImport,
			suggestedContractFile,
			typeImports,
			returnTypes: [],
			tier: 'skip',
			score: 0,
			reasons: ['does not use asPerformanceServicePromise']
		};
	}

	if (contractImport) {
		return {
			...file,
			hasAsPerformanceServicePromise,
			covered: true,
			contractImport,
			suggestedContractFile,
			typeImports,
			returnTypes,
			tier: 'covered',
			score: 0,
			reasons: ['already imports a shared contract module']
		};
	}

	const classification = classifyService(file.name, source, typeImports, returnTypes);

	return {
		...file,
		hasAsPerformanceServicePromise,
		covered: false,
		contractImport: null,
		suggestedContractFile,
		typeImports,
		returnTypes,
		...classification
	};
}

function formatServiceLine(item) {
	const decoders = item.returnTypes.map(entry => entry.decoder).join(', ');
	const reasonText = item.reasons.length ? ` | ${item.reasons.join('; ')}` : '';
	return `- ${item.relPath} -> ${item.suggestedContractFile} | ${decoders || 'no decoder suggestions'}${reasonText}`;
}

const analysis = collectServiceFiles().map(analyzeService);
const covered = analysis.filter(item => item.tier === 'covered');
const actionable = analysis.filter(item => !['covered', 'skip'].includes(item.tier));
const grouped = {
	safe_auto: actionable.filter(item => item.tier === 'safe_auto'),
	scaffold_first: actionable.filter(item => item.tier === 'scaffold_first'),
	manual: actionable.filter(item => item.tier === 'manual')
};

const report = {
	generatedAt: new Date().toISOString(),
	serviceRoot: path.relative(repoRoot, performanceServiceDir),
	totalServiceFiles: analysis.length,
	coveredCount: covered.length,
	remainingCount: actionable.length,
	groupedCounts: Object.fromEntries(
		Object.entries(grouped).map(([key, value]) => [key, value.length])
	),
	services: analysis.map(item => ({
		file: item.relPath,
		tier: item.tier,
		score: item.score,
		covered: item.covered,
		contractImport: item.contractImport,
		suggestedContractFile: item.suggestedContractFile,
		typeImports: item.typeImports,
		returnTypes: item.returnTypes,
		reasons: item.reasons
	}))
};

if (outputJson) {
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
	process.exit(0);
}

const lines = [
	'[performance-service-contract-rollout]',
	`- serviceRoot: ${report.serviceRoot}`,
	`- totalServiceFiles: ${report.totalServiceFiles}`,
	`- coveredCount: ${report.coveredCount}`,
	`- remainingCount: ${report.remainingCount}`,
	`- safe_auto: ${report.groupedCounts.safe_auto}`,
	`- scaffold_first: ${report.groupedCounts.scaffold_first}`,
	`- manual: ${report.groupedCounts.manual}`,
	'',
	'[safe_auto]',
	...(grouped.safe_auto.length ? grouped.safe_auto.map(formatServiceLine) : ['- none']),
	'',
	'[scaffold_first]',
	...(grouped.scaffold_first.length
		? grouped.scaffold_first.map(formatServiceLine)
		: ['- none']),
	'',
	'[manual]',
	...(grouped.manual.length ? grouped.manual.map(formatServiceLine) : ['- none'])
];

process.stdout.write(`${lines.join('\n')}\n`);
