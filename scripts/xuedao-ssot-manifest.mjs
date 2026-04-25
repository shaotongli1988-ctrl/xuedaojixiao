/**
 * 负责加载 xuedao 仓库级 SSOT manifest，并把关键路径解析成脚本可复用的配置。
 * 不负责执行具体守卫、修改 manifest 文件或替代更细粒度的业务文档校验。
 * 依赖 contracts/ssot/xuedao-ssot-manifest.yaml 与当前仓库根目录结构。
 * 维护重点：仅支持当前仓库使用的受限 YAML 子集，新增复杂 YAML 语法时必须先扩展解析器。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const manifestRelativePath = 'contracts/ssot/xuedao-ssot-manifest.yaml';

function stripComment(line) {
	let inSingleQuote = false;
	let inDoubleQuote = false;

	for (let index = 0; index < line.length; index += 1) {
		const current = line[index];
		if (current === "'" && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
			continue;
		}
		if (current === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
			continue;
		}
		if (current === '#' && !inSingleQuote && !inDoubleQuote) {
			return line.slice(0, index);
		}
	}

	return line;
}

function parseScalar(rawValue) {
	const value = rawValue.trim();
	if (!value.length) {
		return '';
	}
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value);
	}
	return value;
}

function isContainerNode(value) {
	return Boolean(value) && typeof value === 'object';
}

function ensureContainer(parent, key, nextType) {
	const current = parent[key];
	if (current === undefined) {
		const created = nextType === 'array' ? [] : {};
		parent[key] = created;
		return created;
	}
	if (nextType === 'array' && Array.isArray(current)) {
		return current;
	}
	if (nextType === 'object' && isContainerNode(current) && !Array.isArray(current)) {
		return current;
	}
	throw new Error(`Manifest key ${key} has incompatible container type.`);
}

function parseRestrictedYaml(text) {
	const root = {};
	const stack = [{ indent: -1, container: root }];
	const rawLines = text.split(/\r?\n/);
	const lines = rawLines.map(stripComment);

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
		const currentLine = lines[lineIndex];
		if (!currentLine.trim()) {
			continue;
		}

		const indentMatch = currentLine.match(/^(\s*)/);
		const indent = indentMatch ? indentMatch[1].length : 0;
		const trimmed = currentLine.trim();

		while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
			stack.pop();
		}

		const currentFrame = stack[stack.length - 1];
		const currentContainer = currentFrame.container;

		if (trimmed.startsWith('- ')) {
			if (!Array.isArray(currentContainer)) {
				throw new Error(`Unexpected list item at indent ${indent}: ${trimmed}`);
			}
			currentContainer.push(parseScalar(trimmed.slice(2)));
			continue;
		}

		const separatorIndex = trimmed.indexOf(':');
		if (separatorIndex === -1) {
			throw new Error(`Unsupported manifest line: ${trimmed}`);
		}

		const key = trimmed.slice(0, separatorIndex).trim();
		const valuePart = trimmed.slice(separatorIndex + 1).trim();
		let nextMeaningfulLine = '';
		let nextIndent = -1;

		for (let nextIndex = lineIndex + 1; nextIndex < lines.length; nextIndex += 1) {
			if (!lines[nextIndex].trim()) {
				continue;
			}
			nextMeaningfulLine = lines[nextIndex].trim();
			const nextIndentMatch = lines[nextIndex].match(/^(\s*)/);
			nextIndent = nextIndentMatch ? nextIndentMatch[1].length : -1;
			break;
		}

		if (!valuePart.length) {
			const nextType =
				nextIndent > indent && nextMeaningfulLine.startsWith('- ') ? 'array' : 'object';
			const child = ensureContainer(currentContainer, key, nextType);
			stack.push({ indent, container: child });
			continue;
		}

		currentContainer[key] = parseScalar(valuePart);
	}

	return root;
}

function readManifestText() {
	return fs.readFileSync(path.join(repoRoot, manifestRelativePath), 'utf8');
}

let cachedManifest;

function normalizeToRepoRelative(targetPath) {
	return targetPath.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function resolveSsotManifestPath() {
	return path.join(repoRoot, manifestRelativePath);
}

export function loadXuedaoSsotManifest() {
	if (!cachedManifest) {
		cachedManifest = parseRestrictedYaml(readManifestText());
	}
	return cachedManifest;
}

export function getSsotArtifactRoot() {
	const manifest = loadXuedaoSsotManifest();
	return manifest.records?.artifactRoot || 'reports/delivery';
}

export function resolveSsotRepoPath(relativePath) {
	return path.join(repoRoot, relativePath);
}

export function extractCommandBackedPath(commandText) {
	const match = commandText.match(/(?:^|\s)(?:node|python3?)(?:\s+--?[^\s=]+(?:=[^\s]+)?)*\s+\.\/([^\s]+)/);
	return match ? normalizeToRepoRelative(match[1]) : '';
}
