#!/usr/bin/env node

/**
 * 负责按仓库级 SSOT 标准检查 xuedao 当前是否具备主源、运行时绑定、文档同步和交付证据闭环。
 * 不负责修改业务实现，也不替代更细粒度的 OpenAPI、RBAC、状态机等专项守卫。
 * 依赖仓库级 manifest、交付记录、README、自动化策略文档与当前 guard 入口。
 * 维护重点：P0/P1 只用于真实阻断项；证据类建议项应保持为 P2，避免误杀正常开发流。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	getSsotArtifactRoot,
	loadXuedaoSsotManifest,
	resolveSsotRepoPath
} from './xuedao-ssot-manifest.mjs';
import {
	collectManifestCoverageFailures,
	collectManifestFailures
} from './check-xuedao-ssot-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function parseArgs(argv) {
	const args = {
		strictReportArtifacts: false,
		reportMd: '',
		reportJson: ''
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];
		if (current === '--strict-report-artifacts') {
			args.strictReportArtifacts = true;
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
		if (current === '--all' || current === '--changed') {
			continue;
		}
		if (current === '--file') {
			index += 1;
			continue;
		}
		throw new Error(`Unsupported arg: ${current}`);
	}

	return args;
}

function resolveDefaultReportPath(fileName) {
	return resolveSsotRepoPath(`${getSsotArtifactRoot()}/${fileName}`);
}

function readText(relativePath) {
	return fs.readFileSync(resolveSsotRepoPath(relativePath), 'utf8');
}

function pathExists(relativePath) {
	return fs.existsSync(resolveSsotRepoPath(relativePath));
}

function normalizePath(value) {
	return value.replaceAll('\\', '/');
}

function createFinding(severity, scope, problem, requiredFix) {
	return { severity, scope, problem, requiredFix };
}

function summarize(findings) {
	return {
		P0: findings.filter(item => item.severity === 'P0'),
		P1: findings.filter(item => item.severity === 'P1'),
		P2: findings.filter(item => item.severity === 'P2')
	};
}

function requirePatterns(findings, scope, text, patterns, severity, requiredFix) {
	for (const pattern of patterns) {
		if (!pattern.regex.test(text)) {
			findings.push(createFinding(severity, scope, pattern.problem, requiredFix));
		}
	}
}

function checkSourceOfTruth(findings) {
	const manifestFailures = collectManifestFailures();
	for (const failure of manifestFailures) {
		findings.push(
			createFinding('P0', 'manifest', failure, '修复 manifest 声明路径或缺失文件后重新运行 conformance 校验。')
		);
	}
	const manifestCoverageFailures = collectManifestCoverageFailures();
	for (const failure of manifestCoverageFailures) {
		findings.push(
			createFinding(
				'P1',
				'manifest.sourceOfTruth',
				failure,
				'把缺失的 machine source 注册或结构字段补齐到 xuedao-ssot-manifest.yaml。'
			)
		);
	}

	const manifest = loadXuedaoSsotManifest();
	if (manifest.repository?.key !== 'xuedao') {
		findings.push(
			createFinding('P0', 'manifest.repository', 'repository.key 不是 xuedao。', '回写正确的仓库标识。')
		);
	}
	if (normalizePath(manifest.repository?.root || '') !== normalizePath(repoRoot)) {
		findings.push(
			createFinding(
				'P1',
				'manifest.repository',
				`repository.root 与当前仓库根目录不一致: ${manifest.repository?.root || '(empty)'}`,
				'把 repository.root 回写为当前仓库绝对路径。'
			)
		);
	}
}

function checkRuntimeBinding(findings) {
	const runRepoGuardScript = readText('scripts/run-repo-consistency-guards.mjs');
	const unifiedDeliveryScript = readText('scripts/check-unified-delivery.mjs');

	if (!runRepoGuardScript.includes("script: 'check-xuedao-ssot-manifest.mjs'")) {
		findings.push(
			createFinding('P1', 'scripts/run-repo-consistency-guards.mjs', '缺少 manifest 路径校验入口。', '先执行 check-xuedao-ssot-manifest 再继续后续守卫。')
		);
	}
	if (!runRepoGuardScript.includes("script: 'check-xuedao-ssot-conformance.mjs'")) {
		findings.push(
			createFinding('P1', 'scripts/run-repo-consistency-guards.mjs', '缺少 SSOT conformance 总校验入口。', '把 check-xuedao-ssot-conformance 接入聚合守卫。')
		);
	}
	if (!unifiedDeliveryScript.includes("import { getSsotArtifactRoot } from './xuedao-ssot-manifest.mjs';")) {
		findings.push(
			createFinding('P1', 'scripts/check-unified-delivery.mjs', '统一交付守卫未从 manifest 读取默认报告根目录。', '改为从 manifest 读取 artifactRoot。')
		);
	}
}

function checkDocumentation(findings) {
	const checks = [
		{
			file: 'README.md',
			patterns: [
				'check-xuedao-ssot-manifest.mjs',
				'check-xuedao-ssot-conformance.mjs',
				'check-performance-contract-closure.mjs',
				'contract-source.{json,mjs}',
				'xuedao-ssot-inventory.md',
				'reports/delivery'
			]
		},
		{
			file: 'contracts/README.md',
			patterns: [
				'check-xuedao-ssot-manifest.mjs',
				'check-xuedao-ssot-conformance.mjs',
				'check-environment-config-ssot.mjs',
				'check-database-schema-ssot.mjs',
				'check-performance-contract-closure.mjs',
				'xuedao-ssot-inventory.md',
				'xuedao-ssot-manifest.yaml',
				'performanceContractSource'
			]
		},
		{
			file: 'performance-management-system/docs/24-自动化测试策略与脚本规划.md',
			patterns: [
				'check-xuedao-ssot-manifest.mjs',
				'check-xuedao-ssot-conformance.mjs',
				'check-environment-config-ssot.mjs',
				'check-database-schema-ssot.mjs',
				'check-performance-contract-closure.mjs',
				'performanceContractSource',
				'run-repo-consistency-guards.mjs'
			]
		}
	];

	for (const check of checks) {
		const text = readText(check.file);
		for (const pattern of check.patterns) {
			if (!text.includes(pattern)) {
				findings.push(
					createFinding(
						'P1',
						check.file,
						`缺少 SSOT 运行态说明: ${pattern}`,
						'把当前守卫入口与执行方式回写到文档。'
					)
				);
			}
		}
	}
}

function checkPilotGovernanceGuards(findings) {
	const pilotGuards = [
		{
			scope: 'environmentConfig',
			command: [process.execPath, resolveSsotRepoPath('scripts/check-environment-config-ssot.mjs')],
			requiredFix: '补齐 environment-config catalog 或扫描范围说明后重新执行环境变量 SSOT 守卫。'
		},
		{
			scope: 'databaseSchema',
			command: [process.execPath, resolveSsotRepoPath('scripts/check-database-schema-ssot.mjs')],
			requiredFix: '补齐 database-schema catalog 中的 migration/entity ownership 后重新执行 schema SSOT 守卫。'
		},
		{
			scope: 'performanceContractClosure',
			command: [process.execPath, resolveSsotRepoPath('scripts/check-performance-contract-closure.mjs')],
			requiredFix:
				'补齐 performance contract-source registry、OpenAPI 覆盖或 generated 消费链后重新执行 performance contract closure 守卫。'
		}
	];

	for (const pilotGuard of pilotGuards) {
		const result = spawnSync(pilotGuard.command[0], pilotGuard.command.slice(1), {
			cwd: repoRoot,
			encoding: 'utf8'
		});

		if (result.status === 0) {
			continue;
		}

		const detail = (result.stderr || result.stdout || '').trim().split('\n')[0] || 'guard failed';
		findings.push(
			createFinding(
				'P2',
				`pilotGuard.${pilotGuard.scope}`,
				`report-only 治理守卫失败: ${detail}`,
				pilotGuard.requiredFix
			)
		);
	}
}

function parseYamlValue(text, key) {
	const match = text.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
	return match ? match[1] : '';
}

function checkRecordsAndEvidence(findings, strictReportArtifacts) {
	const changeRecordPath = 'contracts/ssot/records/change-record.yaml';
	const verificationRecordPath = 'contracts/ssot/records/verification-record.yaml';
	const changeTemplatePath = 'contracts/ssot/records/change-record.template.yaml';
	const verificationTemplatePath = 'contracts/ssot/records/verification-record.template.yaml';

	if (!pathExists(changeRecordPath)) {
		findings.push(
			createFinding('P1', changeRecordPath, '缺少仓库级 change record。', '补齐 change-record.yaml。')
		);
		return;
	}
	if (!pathExists(verificationRecordPath)) {
		findings.push(
			createFinding('P1', verificationRecordPath, '缺少仓库级 verification record。', '补齐 verification-record.yaml。')
		);
		return;
	}

	const changeRecordText = readText(changeRecordPath);
	const verificationRecordText = readText(verificationRecordPath);
	const changeTemplateText = readText(changeTemplatePath);
	const verificationTemplateText = readText(verificationTemplatePath);
	const changeId = parseYamlValue(changeRecordText, 'changeId');
	const verificationChangeId = parseYamlValue(verificationRecordText, 'changeId');

	if (!changeId || !verificationChangeId || changeId !== verificationChangeId) {
		findings.push(
			createFinding('P1', 'contracts/ssot/records', 'change record 与 verification record 的 changeId 不一致。', '统一两份记录的 changeId。')
		);
	}

	for (const requiredCommand of [
		'node ./scripts/check-xuedao-ssot-manifest.mjs',
		'node ./scripts/check-xuedao-ssot-conformance.mjs'
	]) {
		if (!changeRecordText.includes(requiredCommand)) {
			findings.push(
				createFinding('P1', changeRecordPath, `change record 缺少必需命令: ${requiredCommand}`, '把仓库级 SSOT 自检命令写入 requiredCommands。')
			);
		}
		if (!verificationRecordText.includes(requiredCommand)) {
			findings.push(
				createFinding('P1', verificationRecordPath, `verification record 缺少执行命令: ${requiredCommand}`, '把实际执行结果回写到 verification record。')
			);
		}
	}

	const changeRecordPatterns = [
		{ regex: /^requestedAt:\s*.+$/m, problem: 'change record 缺少 requestedAt。' },
		{ regex: /^targetRelease:\s*.+$/m, problem: 'change record 缺少 targetRelease。' },
		{ regex: /^classification:\s*$/m, problem: 'change record 缺少 classification 段。' },
		{ regex: /^\s{2}riskLevel:\s*.+$/m, problem: 'change record 缺少 classification.riskLevel。' },
		{ regex: /^\s{2}severityGate:\s*.+$/m, problem: 'change record 缺少 classification.severityGate。' },
		{ regex: /^\s{2}triggers:\s*(?:\[\])?$/m, problem: 'change record 缺少 classification.triggers。' },
		{ regex: /^\s{2}affectedModules:\s*(?:\[\])?$/m, problem: 'change record 缺少 scope.affectedModules。' },
		{ regex: /^\s{2}primaryDocs:\s*(?:\[\])?$/m, problem: 'change record 缺少 sourceOfTruth.primaryDocs。' },
		{ regex: /^\s{2}machineSourcesTouched:\s*(?:\[\])?$/m, problem: 'change record 缺少 sourceOfTruth.machineSourcesTouched。' },
		{ regex: /^\s{2}generatedConsumers:\s*(?:\[\])?$/m, problem: 'change record 缺少 sourceOfTruth.generatedConsumers。' },
		{ regex: /^impactSurface:\s*$/m, problem: 'change record 缺少 impactSurface 段。' },
		{ regex: /^acceptance:\s*$/m, problem: 'change record 缺少 acceptance 段。' },
		{ regex: /^deliveryEvidenceRequired:\s*(?:\[\])?$/m, problem: 'change record 缺少 deliveryEvidenceRequired。' },
		{ regex: /^releaseAndRollback:\s*$/m, problem: 'change record 缺少 releaseAndRollback 段。' },
		{ regex: /^waivers:\s*(?:\[\])?$/m, problem: 'change record 缺少 waivers。' }
	];
	const verificationRecordPatterns = [
		{ regex: /^executedAt:\s*.+$/m, problem: 'verification record 缺少 executedAt。' },
		{ regex: /^coverage:\s*$/m, problem: 'verification record 缺少 coverage 段。' },
		{ regex: /^\s{2}categories:\s*$/m, problem: 'verification record 缺少 coverage.categories。' },
		{ regex: /^\s{4}normalPath:\s*.+$/m, problem: 'verification record 缺少 coverage.categories.normalPath。' },
		{ regex: /^\s{4}permission:\s*.+$/m, problem: 'verification record 缺少 coverage.categories.permission。' },
		{ regex: /^\s{4}stateFlow:\s*.+$/m, problem: 'verification record 缺少 coverage.categories.stateFlow。' },
		{ regex: /^\s{4}contract:\s*.+$/m, problem: 'verification record 缺少 coverage.categories.contract。' },
		{ regex: /^\s{4}type:\s*.+$/m, problem: 'verification record 的 checks 缺少 type 字段。' },
		{ regex: /^\s{4}scope:\s*.+$/m, problem: 'verification record 的 checks 缺少 scope 字段。' },
		{ regex: /^findings:\s*$/m, problem: 'verification record 缺少 findings 段。' },
		{ regex: /^\s{2}blockers:\s*(?:\[\])?$/m, problem: 'verification record 缺少 findings.blockers。' },
		{ regex: /^\s{2}followUps:\s*(?:\[\])?$/m, problem: 'verification record 缺少 findings.followUps。' },
		{ regex: /^summary:\s*$/m, problem: 'verification record 缺少 summary 段。' }
	];

	requirePatterns(
		findings,
		changeRecordPath,
		changeRecordText,
		changeRecordPatterns,
		'P1',
		'按 strict-change 级结构补齐 change record。'
	);
	requirePatterns(
		findings,
		verificationRecordPath,
		verificationRecordText,
		verificationRecordPatterns,
		'P1',
		'按 strict-change 级结构补齐 verification record。'
	);
	requirePatterns(
		findings,
		changeTemplatePath,
		changeTemplateText,
		changeRecordPatterns,
		'P2',
		'同步补强 repo 自带的 change-record 模板，避免后续再次回退到弱结构。'
	);
	requirePatterns(
		findings,
		verificationTemplatePath,
		verificationTemplateText,
		verificationRecordPatterns,
		'P2',
		'同步补强 repo 自带的 verification-record 模板，避免后续再次回退到弱结构。'
	);

	const artifactRoot = getSsotArtifactRoot();
	if (!pathExists(artifactRoot)) {
		findings.push(
			createFinding('P1', artifactRoot, 'manifest 声明的 artifactRoot 不存在。', '创建 artifactRoot 目录或修正 manifest 配置。')
		);
		return;
	}

	const requiredArtifacts = [
		`${artifactRoot}/unified-delivery-batch.latest.md`,
		`${artifactRoot}/unified-delivery-batch.latest.json`
	];
	for (const artifact of requiredArtifacts) {
		if (!pathExists(artifact)) {
			findings.push(
				createFinding(
					strictReportArtifacts ? 'P1' : 'P2',
					artifact,
					'缺少最近一次统一交付报告产物。',
					'执行 check-unified-delivery 或在 CI 中补齐报告产物。'
				)
			);
		}
	}
}

function render(findings) {
	const grouped = summarize(findings);
	const blocking = grouped.P0.length + grouped.P1.length;
	const verdict = blocking > 0 ? 'FAIL' : grouped.P2.length > 0 ? 'WARN' : 'PASS';
	const lines = [
		`[xuedao-ssot-conformance] ${verdict}`,
		`- P0: ${grouped.P0.length}`,
		`- P1: ${grouped.P1.length}`,
		`- P2: ${grouped.P2.length}`
	];

	for (const severity of ['P0', 'P1', 'P2']) {
		for (const finding of grouped[severity]) {
			lines.push(`- [${severity}] ${finding.scope}: ${finding.problem}`);
			lines.push(`  fix: ${finding.requiredFix}`);
		}
	}

	return { verdict, blocking, text: lines.join('\n') };
}

function writeReports(reportMd, reportJson, result, findings) {
	if (reportMd) {
		fs.mkdirSync(path.dirname(reportMd), { recursive: true });
		fs.writeFileSync(`${reportMd}`, `${result.text}\n`, 'utf8');
	}
	if (reportJson) {
		fs.mkdirSync(path.dirname(reportJson), { recursive: true });
		fs.writeFileSync(
			`${reportJson}`,
			JSON.stringify(
				{
					verdict: result.verdict,
					p0: findings.filter(item => item.severity === 'P0'),
					p1: findings.filter(item => item.severity === 'P1'),
					p2: findings.filter(item => item.severity === 'P2')
				},
				null,
				2
			) + '\n',
			'utf8'
		);
	}
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const findings = [];

	checkSourceOfTruth(findings);
	checkRuntimeBinding(findings);
	checkDocumentation(findings);
	checkRecordsAndEvidence(findings, args.strictReportArtifacts);
	checkPilotGovernanceGuards(findings);

	const result = render(findings);
	const reportMd = path.resolve(args.reportMd || resolveDefaultReportPath('xuedao-ssot-conformance.latest.md'));
	const reportJson = path.resolve(
		args.reportJson || resolveDefaultReportPath('xuedao-ssot-conformance.latest.json')
	);
	writeReports(reportMd, reportJson, result, findings);
	console.log(result.text);
	return result.blocking > 0 ? 1 : 0;
}

process.exit(main());
