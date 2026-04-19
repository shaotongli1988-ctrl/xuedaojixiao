#!/usr/bin/env node

/**
 * 负责检测 performance 页面目录的同级命名冲突，避免 kebab/camel 变体并存。
 * 不负责修复冲突目录，也不扫描业务无关的全仓库目录。
 * 依赖 repo-consistency-lib 的 git 变更收集和目录遍历能力。
 * 维护重点：只对本次变更关联的目录做强阻断，避免用存量历史噪音打断无关提交。
 */

import {
	collectAncestorDirectories,
	failGuard,
	getChangedFiles,
	info,
	listChildDirectories,
	normalizeNameKey,
	parseArgs,
	walkDirectories
} from './repo-consistency-lib.mjs';
import { guardConfig } from './repo-consistency-config.mjs';

const guardName = 'directory-naming-conflicts';

function getRelevantDirectories(changedFiles, rootPath) {
	if (!changedFiles.length) {
		return {
			directories: new Set(walkDirectories(rootPath)),
			touchedDirectories: new Set()
		};
	}

	const relevant = new Set();
	const touched = new Set();
	for (const filePath of changedFiles) {
		if (!filePath.startsWith(`${rootPath}/`) && filePath !== rootPath) {
			continue;
		}
		for (const directoryPath of collectAncestorDirectories(filePath, rootPath)) {
			relevant.add(directoryPath);
			if (directoryPath !== rootPath) {
				touched.add(directoryPath);
			}
		}
	}
	return {
		directories: relevant,
		touchedDirectories: touched
	};
}

function run() {
	const args = parseArgs(process.argv.slice(2));
	const changedFiles = getChangedFiles(args);

	if (args.mode !== 'all' && !changedFiles.length) {
		info(guardName, '未发现待检查变更，跳过。');
		return;
	}

	const failures = [];
	let checkedParents = 0;

	for (const rootPath of guardConfig.namingRoots) {
		const { directories: relevantDirectories, touchedDirectories } = getRelevantDirectories(
			changedFiles,
			rootPath
		);
		if (!relevantDirectories.size) {
			continue;
		}

		for (const directoryPath of relevantDirectories) {
			const childDirectories = listChildDirectories(directoryPath);
			if (childDirectories.length < 2) {
				continue;
			}

			checkedParents += 1;
			const groups = new Map();
			for (const childDirectory of childDirectories) {
				const key = normalizeNameKey(childDirectory.name);
				if (!groups.has(key)) {
					groups.set(key, []);
				}
				groups.get(key).push(childDirectory.relativePath);
			}

			for (const [key, siblings] of groups) {
				if (siblings.length < 2) {
					continue;
				}
				if (
					args.mode !== 'all' &&
					![...touchedDirectories].some(
						touchedDirectory =>
							siblings.includes(touchedDirectory) ||
							siblings.some(sibling => touchedDirectory.startsWith(`${sibling}/`))
					)
				) {
					continue;
				}
				failures.push(
					`${directoryPath} 下存在命名归一化冲突（key=${key}）：${siblings.join(', ')}`
				);
			}
		}
	}

	if (!checkedParents) {
		info(guardName, '本次变更未触发命名冲突守卫。');
		return;
	}

	failGuard(guardName, failures);
	info(guardName, `通过，共检查 ${checkedParents} 个目录层级。`);
}

run();
