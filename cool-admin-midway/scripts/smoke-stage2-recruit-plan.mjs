/**
 * Theme-16 recruit-plan smoke verification.
 * This file validates menu visibility, permission keys, and minimum API smoke for recruitPlan.
 * It does not replace broader stage-2 smoke scripts or add extra fixture coupling beyond theme16 frozen contracts.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, and theme-16 frozen contracts.
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
const theme16RequiredScopes = ['theme16-recruit-plan'];

const expectedUsers = [
	{
		username: 'hr_admin',
		routePresent: ['/performance/recruitment-center', '/performance/recruit-plan'],
		routeAbsent: [],
		permsPresent: [
			'performance:recruitPlan:page',
			'performance:recruitPlan:info',
			'performance:recruitPlan:add',
			'performance:recruitPlan:update',
			'performance:recruitPlan:delete',
			'performance:recruitPlan:import',
			'performance:recruitPlan:export',
			'performance:recruitPlan:submit',
			'performance:recruitPlan:close',
			'performance:recruitPlan:void',
			'performance:recruitPlan:reopen'
		],
		permsAbsent: []
	},
	{
		username: 'manager_rd',
		routePresent: ['/performance/recruitment-center', '/performance/recruit-plan'],
		routeAbsent: [],
		permsPresent: [
			'performance:recruitPlan:page',
			'performance:recruitPlan:info',
			'performance:recruitPlan:add',
			'performance:recruitPlan:update',
			'performance:recruitPlan:delete',
			'performance:recruitPlan:import',
			'performance:recruitPlan:submit',
			'performance:recruitPlan:close',
			'performance:recruitPlan:void',
			'performance:recruitPlan:reopen'
		],
		permsAbsent: ['performance:recruitPlan:export']
	},
	{
		username: 'employee_platform',
		routePresent: [],
		routeAbsent: ['/performance/recruitment-center', '/performance/recruit-plan'],
		permsPresent: [],
		permsAbsent: [
			'performance:recruitPlan:page',
			'performance:recruitPlan:info',
			'performance:recruitPlan:add',
			'performance:recruitPlan:update',
			'performance:recruitPlan:delete',
			'performance:recruitPlan:import',
			'performance:recruitPlan:export',
			'performance:recruitPlan:submit',
			'performance:recruitPlan:close',
			'performance:recruitPlan:void',
			'performance:recruitPlan:reopen'
		]
	}
];

function parseArgs(argv) {
	const options = {
		baseUrl: process.env.THEME16_SMOKE_BASE_URL || '',
		password: process.env.THEME16_SMOKE_PASSWORD || defaultPassword,
		cacheDir: process.env.THEME16_SMOKE_CACHE_DIR || resolveDefaultCacheDir()
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
  THEME16_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
		throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set THEME16_SMOKE_BASE_URL.'
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
			body = rawText;
		}
		return {
			status: response.status,
			ok: response.ok,
			body
		};
	} finally {
		clearTimeout(timeout);
	}
}

function formatResponse(body) {
	if (!body) {
		return 'empty response';
	}
	if (typeof body === 'string') {
		return body;
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

function totalFromPage(responseBody) {
	return (
		responseBody?.data?.pagination?.total ??
		responseBody?.data?.total ??
		responseBody?.data?.list?.length ??
		0
	);
}

function listItems(responseBody) {
	return responseBody?.data?.list || [];
}

function validateDeniedResponse(response, deniedMessageIncludes = []) {
	if (response.body?.code === successCode) {
		return 'expected denied response but request succeeded';
	}

	const message = String(response.body?.message || '');
	const matched = deniedMessageIncludes.every(fragment => message.includes(fragment));
	if (!matched) {
		return `expected message to include "${deniedMessageIncludes.join(' + ')}", got "${message}"`;
	}
	return null;
}

function decodeTokenPayload(token) {
	const encoded = String(token || '').split('.')[1];
	if (!encoded) {
		return {};
	}

	return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

async function verifyRuntimePreflight(reporter, options) {
	const response = await requestJson(`${options.baseUrl}/admin/base/open/runtimeMeta`);

	if (response.body?.code !== successCode) {
		reporter.fail('runtimeMeta', formatResponse(response.body));
		return null;
	}

	const runtimeMeta = response.body?.data;
	const problems = validateStage2RuntimeMeta(runtimeMeta, {
		expectedGitHash: resolveProjectGitHash(projectRoot),
		expectedSourceHash: resolveProjectSourceHash(projectRoot),
		expectedPort: resolveExpectedPort(options.baseUrl),
		requiredScopes: theme16RequiredScopes
	});

	if (problems.length) {
		reporter.fail('runtimeMeta', problems.join('; '));
		return null;
	}

	reporter.pass(
		'runtimeMeta',
		`git=${runtimeMeta.gitHash} port=${runtimeMeta.port} seed=${runtimeMeta.seedMeta.version}`
	);
	return runtimeMeta;
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

	reporter.pass(`${username} captcha`, `captchaId=${captchaId}`);

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

		const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
			headers: { Authorization: token }
		});
		if (personResponse.body?.code !== successCode) {
			reporter.fail(`${username} person`, formatResponse(personResponse.body));
			return null;
		}

		reporter.pass(
			`${username} login`,
			`token acquired departmentId=${personResponse.body?.data?.departmentId ?? 'unknown'}`
		);
		return {
			token,
			payload: decodeTokenPayload(token),
			person: personResponse.body?.data || {}
		};
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

	for (const route of user.routePresent) {
		if (!routers.has(route)) {
			problems.push(`missing route ${route}`);
		}
	}

	for (const route of user.routeAbsent) {
		if (routers.has(route)) {
			problems.push(`unexpected route ${route}`);
		}
	}

	for (const perm of user.permsPresent) {
		if (!perms.has(perm)) {
			problems.push(`missing perm ${perm}`);
		}
	}

	for (const perm of user.permsAbsent) {
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

function buildPlanPayload(session, title, departmentId) {
	return {
		title,
		targetDepartmentId: departmentId,
		positionName: '平台工程师',
		headcount: 2,
		startDate: '2026-04-20',
		endDate: '2026-05-31',
		recruiterId: Number(session.payload.userId || 0) || undefined,
		requirementSummary: `${title}-需求摘要`
	};
}

function resolveDepartmentId(session) {
	return Number(session?.person?.departmentId || session?.payload?.departmentId || 0);
}

function resolveImportFileId(runtimeMeta) {
	const fileId = Number(runtimeMeta?.seedMeta?.recruitPlanImportSpaceId || 0);
	return Number.isInteger(fileId) && fileId > 0 ? fileId : null;
}

async function addPlan(reporter, options, session, username, title, departmentId) {
	const scope = `${username} recruitPlan:add`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/add`, {
		method: 'POST',
		headers: {
			Authorization: session.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(buildPlanPayload(session, title, departmentId))
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	if (record?.status !== 'draft') {
		reporter.fail(scope, `expected draft got ${record?.status ?? 'empty'}`);
		return null;
	}
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function verifyPageByKeyword(reporter, options, session, username, keyword, expectSuccess) {
	const scope = `${username} recruitPlan:page`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/page`, {
		method: 'POST',
		headers: {
			Authorization: session.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			page: 1,
			size: 20,
			keyword
		})
	});

	if (!expectSuccess) {
		const deniedProblem = validateDeniedResponse(response, ['无权限']);
		if (deniedProblem) {
			reporter.fail(scope, deniedProblem);
			return null;
		}
		reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
		return null;
	}

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	reporter.pass(scope, `total=${totalFromPage(response.body)} list=${listItems(response.body).length}`);
	return listItems(response.body);
}

async function verifyInfo(reporter, options, token, username, id, expectSuccess, deniedParts = ['无权']) {
	const scope = `${username} recruitPlan:info`;
	const response = await requestJson(
		`${options.baseUrl}/admin/performance/recruitPlan/info?id=${id}`,
		{
			headers: { Authorization: token }
		}
	);

	if (!expectSuccess) {
		const deniedProblem = validateDeniedResponse(response, deniedParts);
		if (deniedProblem) {
			reporter.fail(scope, deniedProblem);
			return null;
		}
		reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
		return null;
	}

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function updatePlan(reporter, options, session, username, record, departmentId) {
	const scope = `${username} recruitPlan:update`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/update`, {
		method: 'POST',
		headers: {
			Authorization: session.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			...buildPlanPayload(session, `${record.title}-更新`, departmentId),
			id: record.id,
			headcount: 3,
			endDate: '2026-06-15'
		})
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	reporter.pass(scope, `id=${response.body?.data?.id} status=${response.body?.data?.status}`);
	return response.body?.data;
}

async function submitPlan(reporter, options, token, username, id) {
	const scope = `${username} recruitPlan:submit`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/submit`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	if (record?.status !== 'active') {
		reporter.fail(scope, `expected active got ${record?.status ?? 'empty'}`);
		return null;
	}
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function closePlan(reporter, options, token, username, id) {
	const scope = `${username} recruitPlan:close`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/close`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	if (record?.status !== 'closed') {
		reporter.fail(scope, `expected closed got ${record?.status ?? 'empty'}`);
		return null;
	}
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function deletePlan(reporter, options, token, username, id) {
	const scope = `${username} recruitPlan:delete`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/delete`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	if (response.body?.data?.deleted !== true) {
		reporter.fail(scope, `expected deleted=true got ${response.body?.data?.deleted}`);
		return null;
	}
	reporter.pass(scope, `id=${response.body?.data?.id} deleted=${response.body?.data?.deleted}`);
	return response.body?.data;
}

async function importPlans(reporter, options, session, username, fileId, rows) {
	const scope = `${username} recruitPlan:import`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/import`, {
		method: 'POST',
		headers: {
			Authorization: session.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ fileId, rows })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const result = response.body?.data;
	if (Number(result?.importedCount) !== rows.length) {
		reporter.fail(
			scope,
			`expected importedCount=${rows.length} got ${result?.importedCount ?? 'empty'}`
		);
		return null;
	}
	reporter.pass(
		scope,
		`fileId=${result.fileId} imported=${result.importedCount} skipped=${result.skippedCount}`
	);
	return result;
}

async function exportPlans(reporter, options, token, username, query = {}, expectSuccess = true) {
	const scope = `${username} recruitPlan:export`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/export`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	});

	if (!expectSuccess) {
		const deniedProblem = validateDeniedResponse(response, ['无权限']);
		if (deniedProblem) {
			reporter.fail(scope, deniedProblem);
			return null;
		}
		reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
		return null;
	}

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const records = Array.isArray(response.body?.data) ? response.body.data : [];
	reporter.pass(scope, `exported=${records.length}`);
	return records;
}

async function voidPlan(reporter, options, token, username, id) {
	const scope = `${username} recruitPlan:void`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/void`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	if (record?.status !== 'voided') {
		reporter.fail(scope, `expected voided got ${record?.status ?? 'empty'}`);
		return null;
	}
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function reopenPlan(reporter, options, token, username, id) {
	const scope = `${username} recruitPlan:reopen`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/reopen`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ id })
	});

	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}

	const record = response.body?.data;
	if (record?.status !== 'active') {
		reporter.fail(scope, `expected active got ${record?.status ?? 'empty'}`);
		return null;
	}
	reporter.pass(scope, `id=${record.id} status=${record.status}`);
	return record;
}

async function verifyActionDenied(
	reporter,
	options,
	token,
	scope,
	endpoint,
	payload,
	deniedParts
) {
	const response = await requestJson(`${options.baseUrl}${endpoint}`, {
		method: 'POST',
		headers: {
			Authorization: token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const deniedProblem = validateDeniedResponse(response, deniedParts);
	if (deniedProblem) {
		reporter.fail(scope, deniedProblem);
		return;
	}

	reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
}

async function verifyAddDenied(reporter, options, session, username) {
	const scope = `${username} recruitPlan:add`;
	const response = await requestJson(`${options.baseUrl}/admin/performance/recruitPlan/add`, {
		method: 'POST',
		headers: {
			Authorization: session.token,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			title: '主题16-员工越权创建',
			targetDepartmentId: resolveDepartmentId(session) || 1,
			positionName: '员工越权岗位',
			headcount: 1,
			startDate: '2026-04-20',
			endDate: '2026-05-31'
		})
	});

	const deniedProblem = validateDeniedResponse(response, ['无权限']);
	if (deniedProblem) {
		reporter.fail(scope, deniedProblem);
		return;
	}

	reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
}

async function run() {
	const reporter = new Reporter();
	const options = parseArgs(process.argv.slice(2));

	console.log('Theme-16 recruit-plan smoke check');
	console.log(`Base URL: ${options.baseUrl}`);
	console.log(`Cache Dir: ${options.cacheDir}`);

	const runtimeMeta = await verifyRuntimePreflight(reporter, options);
	if (!runtimeMeta) {
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const recruitPlanImportSpaceId = resolveImportFileId(runtimeMeta);

	if (!fs.existsSync(options.cacheDir)) {
		reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
	}
	if (!recruitPlanImportSpaceId) {
		reporter.fail('bootstrap', 'runtimeMeta.seedMeta.recruitPlanImportSpaceId missing');
	}

	const sessions = {};

	for (const user of expectedUsers) {
		const session = await fetchCaptchaAndLogin(reporter, options, user.username);
		if (!session?.token) {
			reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
			continue;
		}

		sessions[user.username] = session;
		await verifyPermMenu(reporter, options, user, session.token);
	}

	const hrSession = sessions.hr_admin;
	const managerSession = sessions.manager_rd;
	const employeeSession = sessions.employee_platform;

	if (hrSession) {
		const hrTitle = `主题16-HR草稿联调-${Date.now()}`;
		const hrDepartmentId = resolveDepartmentId(hrSession);
		const hrPlan = await addPlan(
			reporter,
			options,
			hrSession,
			'hr_admin',
			hrTitle,
			hrDepartmentId
		);

		if (hrPlan?.id) {
			await verifyPageByKeyword(reporter, options, hrSession, 'hr_admin', hrTitle, true);
			await verifyInfo(reporter, options, hrSession.token, 'hr_admin', hrPlan.id, true);
			const updated = await updatePlan(
				reporter,
				options,
				hrSession,
				'hr_admin',
				hrPlan,
				hrDepartmentId
			);
			await exportPlans(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				{ keyword: hrTitle }
			);
			if (recruitPlanImportSpaceId) {
				await importPlans(reporter, options, hrSession, 'hr_admin', recruitPlanImportSpaceId, [
					{
						...buildPlanPayload(
							hrSession,
							`主题16-HR导入联调-${Date.now()}`,
							hrDepartmentId
						),
						headcount: 1
					},
				]);
			}
			await deletePlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				updated?.id || hrPlan.id
			);
		}
	}

	if (hrSession) {
		const hrStateTitle = `主题16-HR状态联调-${Date.now()}`;
		const hrDepartmentId = resolveDepartmentId(hrSession);
		const hrStatePlan = await addPlan(
			reporter,
			options,
			hrSession,
			'hr_admin',
			hrStateTitle,
			hrDepartmentId
		);

		if (hrStatePlan?.id) {
			await verifyActionDenied(
				reporter,
				options,
				hrSession.token,
				'hr_admin recruitPlan:close(draft-denied)',
				'/admin/performance/recruitPlan/close',
				{ id: hrStatePlan.id },
				['当前状态不允许关闭']
			);
			await verifyActionDenied(
				reporter,
				options,
				hrSession.token,
				'hr_admin recruitPlan:void(draft-denied)',
				'/admin/performance/recruitPlan/void',
				{ id: hrStatePlan.id },
				['当前状态不允许作废']
			);
			const submitted = await submitPlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				hrStatePlan.id
			);
			await verifyActionDenied(
				reporter,
				options,
				hrSession.token,
				'hr_admin recruitPlan:delete(active-denied)',
				'/admin/performance/recruitPlan/delete',
				{ id: hrStatePlan.id },
				['当前状态不允许删除']
			);
			const voided = await voidPlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				submitted?.id || hrStatePlan.id
			);
			const reopenedFromVoided = await reopenPlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				voided?.id || hrStatePlan.id
			);
			const closed = await closePlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				reopenedFromVoided?.id || hrStatePlan.id
			);
			await reopenPlan(
				reporter,
				options,
				hrSession.token,
				'hr_admin',
				closed?.id || hrStatePlan.id
			);
			if (managerSession) {
				await verifyInfo(
					reporter,
					options,
					managerSession.token,
					'manager_rd-out-of-scope',
					hrStatePlan.id,
					false,
					['无权查看该招聘计划']
				);
			}
		}
	}

	if (managerSession) {
		const managerTitle = `主题16-经理联调-${Date.now()}`;
		const managerDepartmentId = resolveDepartmentId(managerSession);
		const managerPlan = await addPlan(
			reporter,
			options,
			managerSession,
			'manager_rd',
			managerTitle,
			managerDepartmentId
		);

		if (managerPlan?.id) {
			await verifyPageByKeyword(
				reporter,
				options,
				managerSession,
				'manager_rd',
				managerTitle,
				true
			);
			await verifyInfo(reporter, options, managerSession.token, 'manager_rd', managerPlan.id, true);
			const updated = await updatePlan(
				reporter,
				options,
				managerSession,
				'manager_rd',
				managerPlan,
				managerDepartmentId
			);
			const submitted = await submitPlan(
				reporter,
				options,
				managerSession.token,
				'manager_rd',
				updated?.id || managerPlan.id
			);
			await exportPlans(
				reporter,
				options,
				managerSession.token,
				'manager_rd',
				{ keyword: managerTitle },
				false
			);
			const closed = await closePlan(
				reporter,
				options,
				managerSession.token,
				'manager_rd',
				submitted?.id || managerPlan.id
			);
			await reopenPlan(
				reporter,
				options,
				managerSession.token,
				'manager_rd',
				closed?.id || managerPlan.id
			);
		}
	}

	if (employeeSession) {
		await verifyPageByKeyword(
			reporter,
			options,
			employeeSession,
			'employee_platform',
			'主题16-员工越权',
			false
		);
		await verifyAddDenied(reporter, options, employeeSession, 'employee_platform');
	}

	printSummary(reporter);
	process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
	console.error(`[FATAL] ${error.message}`);
	process.exitCode = 1;
});
