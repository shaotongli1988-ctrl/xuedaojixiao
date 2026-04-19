/**
 * Theme-21 office-knowledge smoke verification.
 * This file validates runtime scope, menu visibility, permission keys, and minimum API smoke for documentCenter and knowledgeBase.
 * It does not seed business data, patch runtime config, or replace broader stage-2 smoke scripts.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, and theme-21 frozen contracts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
	resolveExpectedPort,
	resolveProjectGitHash,
	resolveProjectSourceHash,
	validateStage2RuntimeMeta
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const successCode = 1000;
const theme21RequiredScopes = ['theme21-office-knowledge'];
const seedDocumentKeyword = '联调-主题21-入职制度清单';
const seedKnowledgeKeyword = '联调-主题21-入职资料归档规范';
const seedSearchKeyword = '主题21';
const seedQaKeyword = '联调-主题21-';

const expectedUsers = [
	{
		username: 'hr_admin',
		menu: {
			routesPresent: ['/performance/office/document-center', '/performance/office/knowledge-base'],
			routesAbsent: [],
			permsPresent: [
				'performance:documentCenter:page',
				'performance:documentCenter:info',
				'performance:documentCenter:stats',
				'performance:documentCenter:add',
				'performance:documentCenter:update',
				'performance:documentCenter:delete',
				'performance:knowledgeBase:page',
				'performance:knowledgeBase:stats',
				'performance:knowledgeBase:add',
				'performance:knowledgeBase:update',
				'performance:knowledgeBase:delete',
				'performance:knowledgeBase:graph',
				'performance:knowledgeBase:search',
				'performance:knowledgeBase:qaList',
				'performance:knowledgeBase:qaAdd'
			],
			permsAbsent: []
		}
	},
	{
		username: 'manager_rd',
		menu: {
			routesPresent: [],
			routesAbsent: ['/performance/office/document-center', '/performance/office/knowledge-base'],
			permsPresent: [],
			permsAbsent: [
				'performance:documentCenter:page',
				'performance:documentCenter:info',
				'performance:documentCenter:stats',
				'performance:documentCenter:add',
				'performance:documentCenter:update',
				'performance:documentCenter:delete',
				'performance:knowledgeBase:page',
				'performance:knowledgeBase:stats',
				'performance:knowledgeBase:add',
				'performance:knowledgeBase:update',
				'performance:knowledgeBase:delete',
				'performance:knowledgeBase:graph',
				'performance:knowledgeBase:search',
				'performance:knowledgeBase:qaList',
				'performance:knowledgeBase:qaAdd'
			]
		}
	},
	{
		username: 'employee_platform',
		menu: {
			routesPresent: [],
			routesAbsent: ['/performance/office/document-center', '/performance/office/knowledge-base'],
			permsPresent: [],
			permsAbsent: [
				'performance:documentCenter:page',
				'performance:documentCenter:info',
				'performance:documentCenter:stats',
				'performance:documentCenter:add',
				'performance:documentCenter:update',
				'performance:documentCenter:delete',
				'performance:knowledgeBase:page',
				'performance:knowledgeBase:stats',
				'performance:knowledgeBase:add',
				'performance:knowledgeBase:update',
				'performance:knowledgeBase:delete',
				'performance:knowledgeBase:graph',
				'performance:knowledgeBase:search',
				'performance:knowledgeBase:qaList',
				'performance:knowledgeBase:qaAdd'
			]
		}
	}
];

function parseArgs(argv) {
	const options = {
		baseUrl: process.env.THEME21_SMOKE_BASE_URL || '',
		password: process.env.THEME21_SMOKE_PASSWORD || defaultPassword,
		cacheDir: process.env.THEME21_SMOKE_CACHE_DIR || resolveDefaultCacheDir()
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];

		if ((current === '--base-url' || current === '-u') && next) {
			options.baseUrl = next;
			index += 1;
			continue;
		}

		if ((current === '--password' || current === '-p') && next) {
			options.password = next;
			index += 1;
			continue;
		}

		if ((current === '--cache-dir' || current === '-c') && next) {
			options.cacheDir = next;
			index += 1;
			continue;
		}

		if (current === '--help' || current === '-h') {
			console.log(`Usage: node ${path.relative(process.cwd(), fileURLToPath(import.meta.url))} [options]

Options:
  --base-url, -u       Override backend base URL
  --password, -p       Override login password (default: ${defaultPassword})
  --cache-dir, -c      Override Cool cache directory
  --help, -h           Show this help message

Environment variables:
  THEME21_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
		throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set THEME21_SMOKE_BASE_URL.'
		);
	}

	options.baseUrl = options.baseUrl.replace(/\/+$/, '');
	return options;
}

function resolveDefaultCacheDir() {
	const keyCandidates = [
		path.join(projectRoot, 'dist/config/config.default.js'),
		path.join(projectRoot, 'src/config/config.default.ts')
	];

	for (const candidate of keyCandidates) {
		if (!fs.existsSync(candidate)) {
			continue;
		}
		const content = fs.readFileSync(candidate, 'utf8');
		const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
		if (matched?.[1]) {
			return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
		}
	}

	throw new Error(
		'Unable to resolve cache directory from dist/config/config.default.js or src/config/config.default.ts'
	);
}

function md5(value) {
	return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

class Reporter {
	constructor() {
		this.records = [];
	}

	pass(scope, detail) {
		this.records.push({ status: 'PASS', scope, detail });
		console.log(`[PASS] ${scope} - ${detail}`);
	}

	fail(scope, detail) {
		this.records.push({ status: 'FAIL', scope, detail });
		console.log(`[FAIL] ${scope} - ${detail}`);
	}

	skip(scope, detail) {
		this.records.push({ status: 'SKIP', scope, detail });
		console.log(`[SKIP] ${scope} - ${detail}`);
	}

	hasFailures() {
		return this.records.some(record => record.status === 'FAIL');
	}

	summary() {
		const stats = { PASS: 0, FAIL: 0, SKIP: 0 };
		for (const record of this.records) {
			stats[record.status] += 1;
		}
		return stats;
	}
}

function printSummary(reporter) {
	const stats = reporter.summary();
	console.log('');
	console.log('Summary');
	console.log(`PASS: ${stats.PASS}`);
	console.log(`FAIL: ${stats.FAIL}`);
	console.log(`SKIP: ${stats.SKIP}`);
	console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

async function requestJson(url, init = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal
		});
		const rawText = await response.text();
		let body;
		try {
			body = rawText ? JSON.parse(rawText) : null;
		} catch (error) {
			body = null;
		}
		return {
			status: response.status,
			ok: response.ok,
			body,
			rawText
		};
	} finally {
		clearTimeout(timeout);
	}
}

function formatResponse(body) {
	if (!body || typeof body !== 'object') {
		return 'empty response';
	}
	const code = body.code ?? 'unknown';
	const message = body.message ?? JSON.stringify(body);
	return `code=${code} message=${message}`;
}

function cacheFilePath(cacheDir, key) {
	return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

async function readCaptchaValue(cacheDir, captchaId) {
	const key = `verify:img:${captchaId}`;
	const targetFile = cacheFilePath(cacheDir, key);

	for (let attempt = 0; attempt < 20; attempt += 1) {
		if (fs.existsSync(targetFile)) {
			const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
			if (parsed?.key === key && parsed?.val) {
				return parsed.val;
			}
		}
		await sleep(100);
	}

	throw new Error(`Captcha cache file not found for ${captchaId} under ${cacheDir}`);
}

function flattenMenuRouters(menus = [], output = new Set()) {
	for (const menu of menus) {
		if (menu?.router) {
			output.add(menu.router);
		}
		flattenMenuRouters(menu?.childMenus || [], output);
	}
	return output;
}

function listItems(responseBody) {
	return responseBody?.data?.list || [];
}

function totalFromPage(responseBody) {
	return responseBody?.data?.pagination?.total ?? responseBody?.data?.total ?? 0;
}

function createJsonHeaders(token) {
	return {
		Authorization: token,
		'Content-Type': 'application/json'
	};
}

function validateDeniedResponse(response, deniedMessageIncludes = []) {
	if (response.body?.code === successCode) {
		return 'expected denied response but request succeeded';
	}

	if (!deniedMessageIncludes.length) {
		return null;
	}

	const message = String(response.body?.message || '');
	const matched = deniedMessageIncludes.every(fragment => message.includes(fragment));
	if (!matched) {
		return `expected message to include "${deniedMessageIncludes.join(' + ')}", got "${message}"`;
	}
	return null;
}

async function verifyRuntimePreflight(reporter, options) {
	const response = await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`);

	if (response.body?.code !== successCode) {
		reporter.fail('runtimeMeta', formatResponse(response.body));
		return false;
	}

	const runtimeMeta = response.body?.data;
	const problems = validateStage2RuntimeMeta(runtimeMeta, {
		expectedGitHash: resolveProjectGitHash(projectRoot),
		expectedSourceHash: resolveProjectSourceHash(projectRoot),
		requiredScopes: theme21RequiredScopes
	});

	if (problems.length) {
		reporter.fail('runtimeMeta', problems.join('; '));
		return false;
	}

	reporter.pass(
		'runtimeMeta',
		`git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version}`
	);
	return true;
}

async function fetchCaptchaAndLogin(reporter, options, username) {
	const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
	if (captchaResponse.body?.code !== successCode) {
		reporter.fail(`${username} captcha`, formatResponse(captchaResponse.body));
		return null;
	}

	const captchaId = captchaResponse.body?.data?.captchaId;
	if (!captchaId) {
		reporter.fail(`${username} captcha`, 'missing captchaId');
		return null;
	}

	try {
		const verifyCode = await readCaptchaValue(options.cacheDir, captchaId);
		const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username,
				password: options.password,
				captchaId,
				verifyCode
			})
		});

		if (loginResponse.body?.code !== successCode) {
			reporter.fail(`${username} login`, formatResponse(loginResponse.body));
			return null;
		}

		const token = loginResponse.body?.data?.token;
		if (!token) {
			reporter.fail(`${username} login`, 'login succeeded without token');
			return null;
		}

		reporter.pass(`${username} login`, 'token acquired');
		return { token };
	} catch (error) {
		reporter.fail(`${username} login`, error.message);
		return null;
	}
}

async function verifyPermMenu(reporter, options, user, token) {
	const scope = `${user.username} permmenu`;
	const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
		headers: { Authorization: token }
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return false;
	}

	const routers = flattenMenuRouters(response.body?.data?.menus || []);
	const perms = new Set(response.body?.data?.perms || []);
	const problems = [];

	for (const route of user.menu.routesPresent) {
		if (!routers.has(route)) {
			problems.push(`missing route ${route}`);
		}
	}

	for (const route of user.menu.routesAbsent) {
		if (routers.has(route)) {
			problems.push(`unexpected route ${route}`);
		}
	}

	for (const perm of user.menu.permsPresent) {
		if (!perms.has(perm)) {
			problems.push(`missing perm ${perm}`);
		}
	}

	for (const perm of user.menu.permsAbsent) {
		if (perms.has(perm)) {
			problems.push(`unexpected perm ${perm}`);
		}
	}

	if (problems.length) {
		reporter.fail(scope, problems.join('; '));
		return false;
	}

	reporter.pass(scope, `routes=${routers.size} perms=${perms.size}`);
	return true;
}

async function verifyDeniedPages(reporter, options, username, token) {
	const checks = [
		{
			scope: `${username} documentCenter:page`,
			url: `${options.baseUrl}/admin/performance/documentCenter/page`,
			body: { page: 1, size: 10 },
			message: ['无权限']
		},
		{
			scope: `${username} knowledgeBase:page`,
			url: `${options.baseUrl}/admin/performance/knowledgeBase/page`,
			body: { page: 1, size: 10 },
			message: ['无权限']
		}
	];

	for (const item of checks) {
		const response = await requestJson(item.url, {
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify(item.body)
		});
		const deniedProblem = validateDeniedResponse(response, item.message);
		if (deniedProblem) {
			reporter.fail(item.scope, deniedProblem);
			return false;
		}
		reporter.pass(item.scope, `denied as expected: ${formatResponse(response.body)}`);
	}

	return true;
}

function assertMissingForbiddenFields(record, forbiddenKeys) {
	for (const key of forbiddenKeys) {
		if (Object.prototype.hasOwnProperty.call(record || {}, key)) {
			return `forbidden field returned: ${key}`;
		}
	}
	return null;
}

async function verifyHrDocumentFlow(reporter, options, token) {
	const pageResponse = await requestJson(`${options.baseUrl}/admin/performance/documentCenter/page`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			page: 1,
			size: 20,
			keyword: seedDocumentKeyword
		})
	});

	if (pageResponse.body?.code !== successCode) {
		reporter.fail('hr_admin documentCenter:page', formatResponse(pageResponse.body));
		return null;
	}

	const documentRows = listItems(pageResponse.body);
	const seedDocument = documentRows.find(item => item.fileNo === 'PMS-DOC-21-POLICY-001');
	if (!seedDocument?.id) {
		reporter.fail('hr_admin documentCenter:page', 'seed document missing');
		return null;
	}
	reporter.pass(
		'hr_admin documentCenter:page',
		`total=${totalFromPage(pageResponse.body)} seed=${seedDocument.fileNo}`
	);

	const infoResponse = await requestJson(
		`${options.baseUrl}/admin/performance/documentCenter/info?id=${seedDocument.id}`,
		{
			headers: { Authorization: token }
		}
	);
	if (infoResponse.body?.code !== successCode) {
		reporter.fail('hr_admin documentCenter:info', formatResponse(infoResponse.body));
		return null;
	}

	const forbiddenProblem = assertMissingForbiddenFields(infoResponse.body?.data, [
		'storagePath',
		'storageCredential',
		'downloadUrl',
		'fileBinary',
		'fileContent'
	]);
	if (forbiddenProblem) {
		reporter.fail('hr_admin documentCenter:info', forbiddenProblem);
		return null;
	}
	reporter.pass('hr_admin documentCenter:info', `status=${infoResponse.body?.data?.status}`);

	const statsResponse = await requestJson(
		`${options.baseUrl}/admin/performance/documentCenter/stats?keyword=${encodeURIComponent(seedSearchKeyword)}`,
		{
			headers: { Authorization: token }
		}
	);
	if (statsResponse.body?.code !== successCode) {
		reporter.fail('hr_admin documentCenter:stats', formatResponse(statsResponse.body));
		return null;
	}
	reporter.pass(
		'hr_admin documentCenter:stats',
		`total=${statsResponse.body?.data?.total} published=${statsResponse.body?.data?.publishedCount}`
	);

	const uniqueFileNo = `PMS-DOC-21-SMOKE-${Date.now()}`;
	const addPayload = {
		fileNo: uniqueFileNo,
		fileName: '主题21烟测新增文件',
		category: 'policy',
		fileType: 'pdf',
		storage: 'cloud',
		confidentiality: 'internal',
		ownerName: '主题21烟测',
		department: '行政部',
		status: 'draft',
		version: 'V1.0',
		sizeMb: 1.5,
		tags: ['主题21', 'smoke']
	};
	const addResponse = await requestJson(`${options.baseUrl}/admin/performance/documentCenter/add`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify(addPayload)
	});
	if (addResponse.body?.code !== successCode || !addResponse.body?.data?.id) {
		reporter.fail('hr_admin documentCenter:add', formatResponse(addResponse.body));
		return null;
	}
	const createdId = Number(addResponse.body.data.id);
	reporter.pass('hr_admin documentCenter:add', `id=${createdId}`);

	const updateResponse = await requestJson(
		`${options.baseUrl}/admin/performance/documentCenter/update`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdId,
				...addPayload,
				fileName: '主题21烟测更新文件',
				status: 'review'
			})
		}
	);
	if (updateResponse.body?.code !== successCode) {
		reporter.fail('hr_admin documentCenter:update', formatResponse(updateResponse.body));
		return null;
	}
	reporter.pass(
		'hr_admin documentCenter:update',
		`status=${updateResponse.body?.data?.status} name=${updateResponse.body?.data?.fileName}`
	);

	const deleteResponse = await requestJson(
		`${options.baseUrl}/admin/performance/documentCenter/delete`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({ ids: [createdId] })
		}
	);
	if (deleteResponse.body?.code !== successCode) {
		reporter.fail('hr_admin documentCenter:delete', formatResponse(deleteResponse.body));
		return null;
	}
	reporter.pass('hr_admin documentCenter:delete', `id=${createdId}`);

	return seedDocument.id;
}

async function verifyHrKnowledgeFlow(reporter, options, token, seedDocumentId) {
	const pageResponse = await requestJson(`${options.baseUrl}/admin/performance/knowledgeBase/page`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			page: 1,
			size: 20,
			keyword: seedKnowledgeKeyword
		})
	});

	if (pageResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:page', formatResponse(pageResponse.body));
		return null;
	}

	const knowledgeRows = listItems(pageResponse.body);
	const seedKnowledge = knowledgeRows.find(item => item.kbNo === 'PMS-KB-21-ONBOARDING-001');
	if (!seedKnowledge?.id) {
		reporter.fail('hr_admin knowledgeBase:page', 'seed knowledge missing');
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:page',
		`total=${totalFromPage(pageResponse.body)} seed=${seedKnowledge.kbNo}`
	);

	const statsResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/stats?keyword=${encodeURIComponent(seedSearchKeyword)}`,
		{
			headers: { Authorization: token }
		}
	);
	if (statsResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:stats', formatResponse(statsResponse.body));
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:stats',
		`total=${statsResponse.body?.data?.total} published=${statsResponse.body?.data?.publishedCount}`
	);

	const graphResponse = await requestJson(`${options.baseUrl}/admin/performance/knowledgeBase/graph`, {
		headers: { Authorization: token }
	});
	if (graphResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:graph', formatResponse(graphResponse.body));
		return null;
	}
	const categories = new Set((graphResponse.body?.data?.nodes || []).map(item => item.category));
	const expectedCategories = ['knowledge', 'category', 'tag', 'file'];
	const missingCategories = expectedCategories.filter(item => !categories.has(item));
	if (missingCategories.length) {
		reporter.fail('hr_admin knowledgeBase:graph', `missing categories ${missingCategories.join(',')}`);
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:graph',
		`nodes=${graphResponse.body?.data?.nodes?.length || 0} links=${graphResponse.body?.data?.links?.length || 0}`
	);

	const searchResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/search?keyword=${encodeURIComponent(seedSearchKeyword)}`,
		{
			headers: { Authorization: token }
		}
	);
	if (searchResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:search', formatResponse(searchResponse.body));
		return null;
	}
	const searchData = searchResponse.body?.data || {};
	if (!Array.isArray(searchData.knowledge) || !Array.isArray(searchData.files) || !Array.isArray(searchData.qas)) {
		reporter.fail('hr_admin knowledgeBase:search', 'search payload shape invalid');
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:search',
		`knowledge=${searchData.knowledge.length} files=${searchData.files.length} qas=${searchData.qas.length}`
	);

	const qaListResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/qaList?keyword=${encodeURIComponent(seedQaKeyword)}`,
		{
			headers: { Authorization: token }
		}
	);
	if (qaListResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:qaList', formatResponse(qaListResponse.body));
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:qaList',
		`rows=${qaListResponse.body?.data?.length || 0}`
	);

	const uniqueKbNo = `PMS-KB-21-SMOKE-${Date.now()}`;
	const addResponse = await requestJson(`${options.baseUrl}/admin/performance/knowledgeBase/add`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			kbNo: uniqueKbNo,
			title: '主题21烟测新增知识',
			category: '烟测知识',
			summary: '主题21烟测新增知识摘要',
			ownerName: '主题21烟测',
			status: 'draft',
			tags: ['主题21', 'smoke'],
			relatedFileIds: [seedDocumentId],
			relatedTopics: ['烟测主题'],
			importance: 77
		})
	});
	if (addResponse.body?.code !== successCode || !addResponse.body?.data?.id) {
		reporter.fail('hr_admin knowledgeBase:add', formatResponse(addResponse.body));
		return null;
	}
	const createdKnowledgeId = Number(addResponse.body.data.id);
	reporter.pass('hr_admin knowledgeBase:add', `id=${createdKnowledgeId}`);

	const updateResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/update`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdKnowledgeId,
				kbNo: uniqueKbNo,
				title: '主题21烟测更新知识',
				category: '烟测知识',
				summary: '主题21烟测更新摘要',
				ownerName: '主题21烟测',
				status: 'published',
				tags: ['主题21', 'smoke', 'updated'],
				relatedFileIds: [seedDocumentId],
				relatedTopics: ['烟测主题'],
				importance: 80
			})
		}
	);
	if (updateResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:update', formatResponse(updateResponse.body));
		return null;
	}
	reporter.pass(
		'hr_admin knowledgeBase:update',
		`status=${updateResponse.body?.data?.status} title=${updateResponse.body?.data?.title}`
	);

	const qaAddResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/qaAdd`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				question: `主题21烟测问题-${Date.now()}`,
				answer: '主题21烟测答案',
				relatedKnowledgeIds: [createdKnowledgeId],
				relatedFileIds: [seedDocumentId]
			})
		}
	);
	if (qaAddResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:qaAdd', formatResponse(qaAddResponse.body));
		return null;
	}
	reporter.pass('hr_admin knowledgeBase:qaAdd', `id=${qaAddResponse.body?.data?.id}`);

	const deleteResponse = await requestJson(
		`${options.baseUrl}/admin/performance/knowledgeBase/delete`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({ ids: [createdKnowledgeId] })
		}
	);
	if (deleteResponse.body?.code !== successCode) {
		reporter.fail('hr_admin knowledgeBase:delete', formatResponse(deleteResponse.body));
		return null;
	}
	reporter.pass('hr_admin knowledgeBase:delete', `id=${createdKnowledgeId}`);

	return seedKnowledge.id;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const reporter = new Reporter();

	try {
		if (!(await verifyRuntimePreflight(reporter, options))) {
			printSummary(reporter);
			process.exit(1);
		}

		const sessions = new Map();

		for (const user of expectedUsers) {
			const session = await fetchCaptchaAndLogin(reporter, options, user.username);
			if (!session) {
				printSummary(reporter);
				process.exit(1);
			}
			sessions.set(user.username, session);
			await verifyPermMenu(reporter, options, user, session.token);
		}

		for (const username of ['manager_rd', 'employee_platform']) {
			await verifyDeniedPages(reporter, options, username, sessions.get(username).token);
		}

		const hrToken = sessions.get('hr_admin').token;
		const seedDocumentId = await verifyHrDocumentFlow(reporter, options, hrToken);
		if (seedDocumentId) {
			await verifyHrKnowledgeFlow(reporter, options, hrToken, seedDocumentId);
		}

		printSummary(reporter);
		process.exit(reporter.hasFailures() ? 1 : 0);
	} catch (error) {
		reporter.fail('fatal', error.message);
		printSummary(reporter);
		process.exit(1);
	}
}

await main();
