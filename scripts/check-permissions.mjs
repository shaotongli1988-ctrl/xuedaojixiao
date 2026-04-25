#!/usr/bin/env node
/**
 * Checks global admin permission artifacts and source drift.
 * This script validates generated files and bans new naked permission keys in source code.
 * It is not a database reconciler and does not verify role assignments.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { generatePermissions } from './generate-permissions.mjs';
import {
	resolveBasePermissionUsageAllowedFiles,
	resolveBasePermissionUsageIgnoredPathSegments,
	resolveBasePermissionUsageScanExtensions,
	resolveBasePermissionUsageScanRoots
} from '../cool-admin-midway/src/modules/base/domain/permissions/source.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const SCAN_DIRECTORIES = resolveBasePermissionUsageScanRoots(REPO_ROOT).map(
	directoryPath => path.join(REPO_ROOT, directoryPath)
);
const IGNORED_SEGMENTS = resolveBasePermissionUsageIgnoredPathSegments(REPO_ROOT);
const SCAN_EXTENSIONS = new Set(
	resolveBasePermissionUsageScanExtensions(REPO_ROOT)
);
const ALLOWED_FILES = new Set([
	...resolveBasePermissionUsageAllowedFiles(REPO_ROOT).map(filePath =>
		path.join(REPO_ROOT, filePath)
	)
]);

function shouldScanFile(filePath) {
	const extension = path.extname(filePath).toLowerCase();
	if (!SCAN_EXTENSIONS.has(extension)) {
		return false;
	}

	const normalizedPath = filePath.split(path.sep).join('/');

	if (IGNORED_SEGMENTS.some(segment => normalizedPath.includes(segment))) {
		return false;
	}

	return !ALLOWED_FILES.has(filePath);
}

function scanDirectory(directoryPath, permissionKeys, findings) {
	if (!fs.existsSync(directoryPath)) {
		return;
	}

	for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
		const entryPath = path.join(directoryPath, entry.name);

		if (entry.isDirectory()) {
			scanDirectory(entryPath, permissionKeys, findings);
			continue;
		}

		if (!shouldScanFile(entryPath)) {
			continue;
		}

		const content = fs.readFileSync(entryPath, 'utf8');
		const matchedPermissionKeys = permissionKeys.filter(permissionKey =>
			content.includes(permissionKey)
		);

		if (!matchedPermissionKeys.length) {
			continue;
		}

		findings.push({
			filePath: entryPath,
			matches: matchedPermissionKeys
		});
	}
}

function main() {
	const generationResult = generatePermissions({ check: true });

	if (generationResult.changedFiles.length) {
		console.error('Generated permission artifacts are stale:');
		for (const changedFile of generationResult.changedFiles) {
			console.error(`- ${path.relative(REPO_ROOT, changedFile)}`);
		}
		process.exitCode = 1;
		return;
	}

	const permissionKeys = [...generationResult.model.permissionKeys].sort((left, right) =>
		right.length - left.length || left.localeCompare(right)
	);
	const findings = [];

	for (const directoryPath of SCAN_DIRECTORIES) {
		scanDirectory(directoryPath, permissionKeys, findings);
	}

	if (findings.length) {
		console.error(
			'Found naked admin permission keys outside source-of-truth or generated files:'
		);
		for (const finding of findings) {
			console.error(`- ${path.relative(REPO_ROOT, finding.filePath)}`);
			for (const permissionKey of finding.matches) {
				console.error(`  - ${permissionKey}`);
			}
		}
		process.exitCode = 1;
		return;
	}

	console.log('Global admin permission artifacts and source usage are aligned.');
}

main();
