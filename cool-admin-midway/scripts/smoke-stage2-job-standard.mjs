/**
 * Theme-17 job-standard smoke verification.
 * This file validates menu visibility, permission keys, and minimum API smoke for jobStandard.
 * It does not seed business data, patch runtime config, or replace broader stage-2 smoke scripts.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, and theme-17 frozen contracts.
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
const theme17RequiredScopes = ['theme17-job-standard'];
const keywordAll = '联调-主题17';
const keywordManagerVisible = '联调-主题17平台职位标准';
const keywordManagerHidden = '联调-主题17销售职位标准';

const expectedUsers = [
	{
		username: 'hr_admin',
		menu: {
			routesPresent: ['/performance/job-standard'],
			routesAbsent: [],
			permsPresent: [
				'performance:jobStandard:page',
				'performance:jobStandard:info',
				'performance:jobStandard:add',
				'performance:jobStandard:update',
				'performance:jobStandard:setStatus'
			],
			permsAbsent: []
		}
	},
	{
		username: 'manager_rd',
		menu: {
			routesPresent: ['/performance/job-standard'],
			routesAbsent: [],
			permsPresent: ['performance:jobStandard:page', 'performance:jobStandard:info'],
			permsAbsent: [
				'performance:jobStandard:add',
				'performance:jobStandard:update',
				'performance:jobStandard:setStatus'
			]
		}
	},
	{
		username: 'employee_platform',
		menu: {
			routesPresent: [],
			routesAbsent: ['/performance/job-standard'],
			permsPresent: [],
			permsAbsent: [
				'performance:jobStandard:page',
				'performance:jobStandard:info',
				'performance:jobStandard:add',
				'performance:jobStandard:update',
				'performance:jobStandard:setStatus'
			]
		}
	}
];

function parseArgs(argv) {
	const options = {
		baseUrl: process.env.THEME17_SMOKE_BASE_URL || '',
		password: process.env.THEME17_SMOKE_PASSWORD || defaultPassword,
		cacheDir: process.env.THEME17_SMOKE_CACHE_DIR || resolveDefaultCacheDir()
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
  THEME17_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8062
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
		throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set THEME17_SMOKE_BASE_URL.'
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

	if (!Array.isArray(deniedMessageIncludes) || deniedMessageIncludes.length === 0) {
		return null;
	}

	const message = String(response.body?.message || '');
	const matched = deniedMessageIncludes.every(fragment => message.includes(fragment));
	if (!matched) {
		return `expected message to include "${deniedMessageIncludes.join(' + ')}", got "${message}"`;
	}
	return null;
}

function assertNoForbiddenFields(record) {
	const forbiddenKeys = [
		'resumeText',
		'candidatePhone',
		'candidateEmail',
		'interviewComment',
		'interviewComments',
		'hiringDecision',
		'salaryRange',
		'attachments',
		'attachmentList',
		'designSchema',
		'questionBankConfig'
	];

	for (const key of forbiddenKeys) {
		if (Object.prototype.hasOwnProperty.call(record || {}, key)) {
			return `forbidden field returned: ${key}`;
		}
	}

	return null;
}

function createJsonHeaders(token) {
	return {
		Authorization: token,
		'Content-Type': 'application/json'
	};
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
		expectedPort: resolveExpectedPort(options.baseUrl),
		requiredScopes: theme17RequiredScopes
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

async function fetchJobStandardPage(options, token, keyword) {
	return requestJson(`${options.baseUrl}/admin/performance/jobStandard/page`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			page: 1,
			size: 20,
			keyword
		})
	});
}

async function verifyJobStandardPage(reporter, options, username, token, keyword, expectation) {
	const scope = `${username} jobStandard:page`;
	const response = await fetchJobStandardPage(options, token, keyword);

	if (!expectation.expectSuccess) {
		const deniedProblem = validateDeniedResponse(response, expectation.deniedMessageIncludes);
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

	const total = totalFromPage(response.body);
	const list = listItems(response.body);
	reporter.pass(scope, `keyword=${keyword} total=${total} list=${list.length}`);
	return list;
}

async function verifyJobStandardInfo(reporter, options, username, token, id, expectation) {
	const scope = `${username} jobStandard:info#${id}`;
	const response = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/info?id=${id}`,
		{
			headers: { Authorization: token }
		}
	);

	if (!expectation.expectSuccess) {
		const deniedProblem = validateDeniedResponse(response, expectation.deniedMessageIncludes);
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

	const record = response.body?.data || {};
	const forbiddenProblem = assertNoForbiddenFields(record);
	if (forbiddenProblem) {
		reporter.fail(scope, forbiddenProblem);
		return null;
	}

	reporter.pass(scope, `status=${record.status} department=${record.targetDepartmentName || record.targetDepartmentId}`);
	return record;
}

async function verifyDeniedMutation(
	reporter,
	options,
	username,
	token,
	action,
	payload,
	deniedMessageIncludes
) {
	const scope = `${username} jobStandard:${action}`;
	const response = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/${action}`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify(payload)
		}
	);

	const deniedProblem = validateDeniedResponse(response, deniedMessageIncludes);
	if (deniedProblem) {
		reporter.fail(scope, deniedProblem);
		return false;
	}

	reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
	return true;
}

async function verifyHrMainFlow(reporter, options, token, targetDepartmentId) {
	const uniqueName = `联调-主题17新增职位标准-${Date.now()}`;
	const basePayload = {
		positionName: uniqueName,
		targetDepartmentId,
		jobLevel: 'P7',
		profileSummary: '主题17 smoke 新增岗位画像摘要',
		requirementSummary: '主题17 smoke 新增任职要求摘要',
		skillTagList: ['Node.js', 'TypeScript', 'Midway'],
		interviewTemplateSummary: '主题17 smoke 面试模板摘要'
	};

	const addResponse = await requestJson(`${options.baseUrl}/admin/performance/jobStandard/add`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify(basePayload)
	});

	if (addResponse.body?.code !== successCode) {
		reporter.fail('hr_admin jobStandard:add', formatResponse(addResponse.body));
		return null;
	}

	const created = addResponse.body?.data || {};
	const createdId = Number(created.id || 0);
	if (!createdId) {
		reporter.fail('hr_admin jobStandard:add', 'add succeeded without id');
		return null;
	}

	reporter.pass('hr_admin jobStandard:add', `id=${createdId} status=${created.status}`);

	const updateResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/update`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdId,
				...basePayload,
				jobLevel: 'P8',
				profileSummary: '主题17 smoke 更新后的岗位画像摘要',
				requirementSummary: '主题17 smoke 更新后的任职要求摘要',
				skillTagList: ['Node.js', 'TypeScript', '联调'],
				interviewTemplateSummary: '主题17 smoke 更新后的面试模板摘要'
			})
		}
	);

	if (updateResponse.body?.code !== successCode) {
		reporter.fail('hr_admin jobStandard:update', formatResponse(updateResponse.body));
		return null;
	}

	reporter.pass(
		'hr_admin jobStandard:update',
		`status=${updateResponse.body?.data?.status} level=${updateResponse.body?.data?.jobLevel}`
	);

	const activeResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/setStatus`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdId,
				status: 'active'
			})
		}
	);

	if (activeResponse.body?.code !== successCode) {
		reporter.fail('hr_admin jobStandard:setStatus#active', formatResponse(activeResponse.body));
		return null;
	}

	const activeRecord = activeResponse.body?.data || {};
	reporter.pass('hr_admin jobStandard:setStatus#active', `status=${activeRecord.status}`);

	const inactiveResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/setStatus`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdId,
				status: 'inactive'
			})
		}
	);

	if (inactiveResponse.body?.code !== successCode) {
		reporter.fail('hr_admin jobStandard:setStatus#inactive', formatResponse(inactiveResponse.body));
		return null;
	}

	const inactiveRecord = inactiveResponse.body?.data || {};
	const compatibilityFields = [
		'positionName',
		'jobLevel',
		'profileSummary',
		'requirementSummary',
		'interviewTemplateSummary'
	];
	for (const field of compatibilityFields) {
		if (inactiveRecord[field] !== activeRecord[field]) {
			reporter.fail(
				'hr_admin jobStandard:setStatus#inactive',
				`inactive changed ${field} unexpectedly`
			);
			return null;
		}
	}

	if (
		JSON.stringify(inactiveRecord.skillTagList || []) !==
		JSON.stringify(activeRecord.skillTagList || [])
	) {
		reporter.fail('hr_admin jobStandard:setStatus#inactive', 'inactive changed skillTagList unexpectedly');
		return null;
	}

	reporter.pass(
		'hr_admin jobStandard:setStatus#inactive',
		'status switched to inactive without mutating summary fields'
	);

	const reactivateResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/setStatus`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: createdId,
				status: 'active'
			})
		}
	);

	if (reactivateResponse.body?.code !== successCode) {
		reporter.fail('hr_admin jobStandard:setStatus#reactivate', formatResponse(reactivateResponse.body));
		return null;
	}

	reporter.pass(
		'hr_admin jobStandard:setStatus#reactivate',
		`status=${reactivateResponse.body?.data?.status}`
	);

	const finalInfo = await verifyJobStandardInfo(
		reporter,
		options,
		'hr_admin',
		token,
		createdId,
		{ expectSuccess: true }
	);

	if (!finalInfo) {
		return null;
	}

	return {
		createdId,
		createdRecord: finalInfo
	};
}

async function run() {
	const reporter = new Reporter();
	const options = parseArgs(process.argv.slice(2));

	console.log('Theme-17 job-standard smoke check');
	console.log(`Base URL: ${options.baseUrl}`);
	console.log(`Cache Dir: ${options.cacheDir}`);

	const runtimeReady = await verifyRuntimePreflight(reporter, options);
	if (!runtimeReady) {
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}

	if (!fs.existsSync(options.cacheDir)) {
		reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
	}

	const sessions = new Map();

	for (const user of expectedUsers) {
		const session = await fetchCaptchaAndLogin(reporter, options, user.username);
		if (!session?.token) {
			reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
			continue;
		}

		sessions.set(user.username, session);
		await verifyPermMenu(reporter, options, user, session.token);
	}

	const hrToken = sessions.get('hr_admin')?.token;
	const managerToken = sessions.get('manager_rd')?.token;
	const employeeToken = sessions.get('employee_platform')?.token;

	if (hrToken) {
		const hrList = await verifyJobStandardPage(
			reporter,
			options,
			'hr_admin',
			hrToken,
			keywordAll,
			{ expectSuccess: true }
		);

		const hiddenList = await verifyJobStandardPage(
			reporter,
			options,
			'hr_admin',
			hrToken,
			keywordManagerHidden,
			{ expectSuccess: true }
		);
		const visibleSeedList = await verifyJobStandardPage(
			reporter,
			options,
			'hr_admin',
			hrToken,
			keywordManagerVisible,
			{ expectSuccess: true }
		);

		const hiddenTarget = Array.isArray(hiddenList) ? hiddenList[0] : null;
		const fallbackDepartmentId =
			Number(
				(Array.isArray(visibleSeedList) && visibleSeedList[0]?.targetDepartmentId) ||
				(Array.isArray(hrList) && hrList[0]?.targetDepartmentId) ||
				(Array.isArray(hiddenList) && hiddenList[0]?.targetDepartmentId) ||
				0
			) || null;
		if (!fallbackDepartmentId) {
			reporter.fail('hr_admin jobStandard:add', 'no seeded departmentId available for add smoke');
			printSummary(reporter);
			process.exitCode = 1;
			return;
		}

		const hrMainFlow = await verifyHrMainFlow(
			reporter,
			options,
			hrToken,
			fallbackDepartmentId
		);

		if (managerToken) {
			const managerVisibleList = await verifyJobStandardPage(
				reporter,
				options,
				'manager_rd',
				managerToken,
				keywordManagerVisible,
				{ expectSuccess: true }
			);

			const managerHiddenList = await verifyJobStandardPage(
				reporter,
				options,
				'manager_rd',
				managerToken,
				keywordManagerHidden,
				{ expectSuccess: true }
			);

			if (Array.isArray(managerHiddenList) && managerHiddenList.length === 0) {
				reporter.pass('manager_rd jobStandard:page scope', 'out-of-scope sales record hidden as expected');
			} else {
				reporter.fail('manager_rd jobStandard:page scope', 'out-of-scope sales record unexpectedly visible');
			}

			const visibleTarget =
				hrMainFlow?.createdId ||
				(Array.isArray(managerVisibleList) && managerVisibleList[0]?.id) ||
				(Array.isArray(hrList) && hrList[0]?.id);

			if (visibleTarget) {
				await verifyJobStandardInfo(reporter, options, 'manager_rd', managerToken, Number(visibleTarget), {
					expectSuccess: true
				});
				await verifyDeniedMutation(
					reporter,
					options,
					'manager_rd',
					managerToken,
					'add',
					{
						positionName: '经理越权新增职位标准',
						targetDepartmentId: fallbackDepartmentId
					},
					['无权限']
				);
				await verifyDeniedMutation(
					reporter,
					options,
					'manager_rd',
					managerToken,
					'update',
					{
						id: Number(visibleTarget),
						positionName: '经理越权修改',
						targetDepartmentId: 5
					},
					['无权限']
				);
				await verifyDeniedMutation(
					reporter,
					options,
					'manager_rd',
					managerToken,
					'setStatus',
					{
						id: Number(visibleTarget),
						status: 'inactive'
					},
					['无权限']
				);
			} else {
				reporter.fail('manager_rd jobStandard:info', 'no visible target found');
			}

			if (hiddenTarget?.id) {
				await verifyJobStandardInfo(
					reporter,
					options,
					'manager_rd',
					managerToken,
					Number(hiddenTarget.id),
					{
						expectSuccess: false,
						deniedMessageIncludes: ['无权']
					}
				);
			} else {
				reporter.fail('manager_rd jobStandard:info scope', 'no hidden sales target found');
			}
		}
	}

	if (employeeToken) {
		await verifyJobStandardPage(
			reporter,
			options,
			'employee_platform',
			employeeToken,
			keywordAll,
			{
				expectSuccess: false,
				deniedMessageIncludes: ['无权限']
			}
		);
	}

	printSummary(reporter);
	process.exitCode = reporter.hasFailures() ? 1 : 0;
}

run().catch(error => {
	console.error(`[FATAL] ${error.message}`);
	process.exitCode = 1;
});
