/**
 * 物资管理 service 契约测试。
 * 场景覆盖：资源路径、权限键和动作 URL 必须与新增的 material* 前端资源命名一致。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../src/modules/performance/service/', import.meta.url);

async function readService(name) {
	return readFile(new URL(name, root), 'utf8');
}

test('material catalog and stock services keep resource routes aligned', async () => {
	const [catalogSource, stockSource] = await Promise.all([
		readService('material-catalog.ts'),
		readService('material-stock.ts')
	]);

	assert.match(catalogSource, /super\('admin\/performance\/materialCatalog'\)/);
	assert.match(catalogSource, /page:\s*PERMISSIONS\.performance\.materialCatalog\.page/);
	assert.match(catalogSource, /info:\s*PERMISSIONS\.performance\.materialCatalog\.info/);
	assert.match(catalogSource, /add:\s*PERMISSIONS\.performance\.materialCatalog\.add/);
	assert.match(catalogSource, /update:\s*PERMISSIONS\.performance\.materialCatalog\.update/);
	assert.match(catalogSource, /delete:\s*PERMISSIONS\.performance\.materialCatalog\.delete/);

	assert.match(stockSource, /super\('admin\/performance\/materialStock'\)/);
	assert.match(stockSource, /page:\s*PERMISSIONS\.performance\.materialStock\.page/);
	assert.match(stockSource, /info:\s*PERMISSIONS\.performance\.materialStock\.info/);
	assert.equal(stockSource.includes('PERMISSIONS.performance.materialStock.add'), false);
});

test('material inbound service exposes minimal inbound lifecycle actions', async () => {
	const inboundSource = await readService('material-inbound.ts');

	assert.match(inboundSource, /super\('admin\/performance\/materialInbound'\)/);
	assert.match(inboundSource, /submit:\s*PERMISSIONS\.performance\.materialInbound\.submit/);
	assert.match(inboundSource, /receive:\s*PERMISSIONS\.performance\.materialInbound\.receive/);
	assert.match(inboundSource, /cancel:\s*PERMISSIONS\.performance\.materialInbound\.cancel/);
	assert.match(inboundSource, /url: '\/submit'/);
	assert.match(inboundSource, /url: '\/receive'/);
	assert.match(inboundSource, /url: '\/cancel'/);
});

test('material issue service exposes minimal issue lifecycle actions', async () => {
	const issueSource = await readService('material-issue.ts');

	assert.match(issueSource, /super\('admin\/performance\/materialIssue'\)/);
	assert.match(issueSource, /submit:\s*PERMISSIONS\.performance\.materialIssue\.submit/);
	assert.match(issueSource, /issue:\s*PERMISSIONS\.performance\.materialIssue\.issue/);
	assert.match(issueSource, /cancel:\s*PERMISSIONS\.performance\.materialIssue\.cancel/);
	assert.match(issueSource, /url: '\/submit'/);
	assert.match(issueSource, /url: '\/issue'/);
	assert.match(issueSource, /url: '\/cancel'/);
	assert.equal(issueSource.includes('PERMISSIONS.performance.materialIssue.return'), false);
	assert.equal(issueSource.includes("url: '/return'"), false);
});
