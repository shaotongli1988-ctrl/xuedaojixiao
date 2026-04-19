#!/usr/bin/env node

/**
 * 负责根据本次代码/脚本变更强制检查高价值唯一事实源是否同步回写。
 * 不负责校正文档正文内容，也不替代更细粒度的契约对账守卫。
 * 依赖 repo-consistency-config.mjs 中定义的高价值文档与匹配规则。
 * 维护重点：只在代码或自动化面变化时阻断，文档单改不反向触发无关失败。
 */

import {
	failGuard,
	getChangedFiles,
	info,
	parseArgs,
	readChangedFileText
} from './repo-consistency-lib.mjs';
import { guardConfig } from './repo-consistency-config.mjs';

const guardName = 'doc-contract-writeback';

function run() {
	const args = parseArgs(process.argv.slice(2));
	const changedFiles = getChangedFiles(args);

	if (args.mode !== 'all' && !changedFiles.length) {
		info(guardName, '未发现待检查变更，跳过。');
		return;
	}

	const changedFileSet = new Set(changedFiles);
	const triggeredRules = [];

	for (const rule of guardConfig.docWritebackRules) {
		const matchedFiles = changedFiles.filter(filePath =>
			rule.matches(filePath, readChangedFileText(filePath))
		);
		if (!matchedFiles.length) {
			continue;
		}

		triggeredRules.push({
			rule,
			matchedFiles
		});
	}

	if (!triggeredRules.length) {
		info(guardName, '本次变更未触发高价值文档回写守卫。');
		return;
	}

	const failures = [];

	for (const { rule, matchedFiles } of triggeredRules) {
		if (changedFileSet.has(rule.requiredDoc)) {
			continue;
		}

		failures.push(
			`${rule.description} 缺少文档回写：${rule.requiredDoc}。触发文件：${matchedFiles.join(', ')}`
		);
	}

	failGuard(guardName, failures);
	info(guardName, `通过，共命中 ${triggeredRules.length} 条高价值文档回写规则。`);
}

run();
