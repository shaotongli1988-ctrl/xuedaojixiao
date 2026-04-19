/**
 * 行政协同共享 service 初始化环守卫测试。
 * 场景覆盖：共享 office-ledger service 必须绕开 /@/cool 顶层导出，
 * 并继续保持 bootstrap 对该共享 helper 的自动扫描排除，避免运行时循环初始化。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectRoot = new URL('..', import.meta.url);
const officeLedgerServicePath = new URL(
	'./src/modules/performance/service/office-ledger.ts',
	projectRoot
);
const bootstrapModulePath = new URL('./src/cool/bootstrap/module.ts', projectRoot);

test('frontend normal office ledger service imports BaseService from direct path', async () => {
	const source = await readFile(officeLedgerServicePath, 'utf8');
	assert.match(source, /from '\/@\/cool\/service\/base'/);
	assert.doesNotMatch(source, /from '\/@\/cool'/);
});

test('frontend boundary bootstrap excludes shared office ledger helper from eager service scan', async () => {
	const source = await readFile(bootstrapModulePath, 'utf8');
	assert.ok(source.includes("'!/src/{modules,plugins}/*/service/office-ledger.ts'"));
});
