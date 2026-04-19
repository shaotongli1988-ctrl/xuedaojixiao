/**
 * Theme-23 goal-plan operations smoke verification.
 * This file verifies runtime scope, menu/permission registration, and the minimum live API path for department config, plan save, employee submit, auto-zero, overview, and report flow.
 * It does not reseed data, manage process lifecycle, or replace broader stage-2 smoke coverage.
 * Maintenance pitfall: keep assertions aligned with menu.json, seed-stage2-performance.mjs, frontend goals page copy, and goal-operations service contracts.
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
const requiredScopes = ['goal-plan-operations'];
const goalRoute = '/performance/goals';
const goalViewPath = 'modules/performance/views/goals/index.vue';
const goalPermissionKeys = [
	'performance:goal:page',
	'performance:goal:info',
	'performance:goal:add',
	'performance:goal:update',
	'performance:goal:delete',
	'performance:goal:progressUpdate',
	'performance:goal:opsManage',
	'performance:goal:export'
];

const users = [
	{
		username: 'hr_admin',
		menu: {
			routesPresent: [goalRoute],
			routesAbsent: [],
			permsPresent: [...goalPermissionKeys, 'performance:salary:page'],
			permsAbsent: []
		}
	},
	{
		username: 'manager_rd',
		menu: {
			routesPresent: [goalRoute],
			routesAbsent: [],
			permsPresent: [...goalPermissionKeys],
			permsAbsent: ['performance:salary:page']
		}
	},
	{
		username: 'employee_platform',
		menu: {
			routesPresent: [goalRoute],
			routesAbsent: [],
			permsPresent: [
				'performance:goal:page',
				'performance:goal:info',
				'performance:goal:update',
				'performance:goal:progressUpdate'
			],
			permsAbsent: [
				'performance:goal:add',
				'performance:goal:opsManage',
				'performance:goal:delete',
				'performance:goal:export'
			]
		}
	}
];

function md5(value) {
	return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
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

function formatResponse(body) {
	if (typeof body === 'string') {
		return body;
	}
	try {
		return JSON.stringify(body);
	} catch {
		return String(body);
	}
}

function resolveDefaultCacheDir() {
	for (const candidate of [
		path.join(projectRoot, 'dist/config/config.default.js'),
		path.join(projectRoot, 'src/config/config.default.ts')
	]) {
		if (!fs.existsSync(candidate)) {
			continue;
		}
		const content = fs.readFileSync(candidate, 'utf8');
		const matched = content.match(/keys:\s*['"`]([^'"`]+)['"`]/);
		if (matched?.[1]) {
			return path.join(os.homedir(), '.cool-admin', md5(matched[1]), 'cache');
		}
	}
	throw new Error('Unable to resolve local cache dir');
}

function buildOptions(argv = []) {
	const options = {
		baseUrl: process.env.THEME23_GOAL_PLAN_SMOKE_BASE_URL || process.env.STAGE2_SMOKE_BASE_URL || '',
		password: process.env.THEME23_GOAL_PLAN_SMOKE_PASSWORD || defaultPassword,
		cacheDir: process.env.THEME23_GOAL_PLAN_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
		planDate: process.env.THEME23_GOAL_PLAN_SMOKE_DATE || '',
		departmentId: Number(process.env.THEME23_GOAL_PLAN_SMOKE_DEPARTMENT_ID || 0) || null,
		employeeId: Number(process.env.THEME23_GOAL_PLAN_SMOKE_EMPLOYEE_ID || 0) || null
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
  --base-url, -u   Override backend base URL
  --password, -p   Override login password (default: ${defaultPassword})
  --cache-dir, -c  Override Cool cache directory
  --help, -h       Show this help message

Environment variables:
  THEME23_GOAL_PLAN_SMOKE_BASE_URL   Required backend base URL. Example: http://127.0.0.1:8129
  STAGE2_SMOKE_BASE_URL              Compatible fallback used by latest-reset-and-verify
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
			throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set THEME23_GOAL_PLAN_SMOKE_BASE_URL / STAGE2_SMOKE_BASE_URL.'
		);
	}

	options.baseUrl = options.baseUrl.replace(/\/+$/, '');
	return options;
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

	summary() {
		const stats = { PASS: 0, FAIL: 0, SKIP: 0 };
		for (const record of this.records) {
			stats[record.status] += 1;
		}
		return stats;
	}

	hasFailures() {
		return this.records.some(record => record.status === 'FAIL');
	}
}

async function requestJson(url, init = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal
		});
		const raw = await response.text();
		let body;
		try {
			body = raw ? JSON.parse(raw) : null;
		} catch {
			body = raw;
		}
		return {
			status: response.status,
			body
		};
	} finally {
		clearTimeout(timeout);
	}
}

function flattenMenuNodes(menus = [], output = []) {
	for (const menu of menus) {
		if (!menu || typeof menu !== 'object') {
			continue;
		}
		output.push(menu);
		flattenMenuNodes(menu.childMenus || [], output);
	}
	return output;
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

function collectMenuPerms(menus = []) {
	const perms = new Set();
	for (const node of flattenMenuNodes(menus)) {
		const values = String(node?.perms || '')
			.split(',')
			.map(item => item.trim())
			.filter(Boolean);
		for (const value of values) {
			perms.add(value);
		}
	}
	return perms;
}

function decodeTokenPayload(token) {
	const encoded = String(token || '').split('.')[1];
	if (!encoded) {
		return {};
	}
	return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

function createJsonHeaders(token) {
	return {
		Authorization: token,
		'Content-Type': 'application/json'
	};
}

async function readCaptchaValue(cacheDir, captchaId) {
	const key = `verify:img:${captchaId}`;
	const file = path.join(cacheDir, `diskstore-${md5(key)}.json`);
	for (let attempt = 0; attempt < 20; attempt += 1) {
		if (fs.existsSync(file)) {
			const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
			if (parsed?.key === key && parsed?.val) {
				return parsed.val;
			}
		}
		await sleep(100);
	}
	throw new Error(`Captcha cache file not found for ${captchaId}`);
}

async function fetchCaptchaAndLogin(reporter, options, username) {
	try {
		const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`, {
			headers: { 'x-requested-with': 'XMLHttpRequest' }
		});

		if (captchaResponse.body?.code !== successCode || !captchaResponse.body?.data?.captchaId) {
			reporter.fail(`${username} captcha`, formatResponse(captchaResponse.body));
			return null;
		}

		const captchaId = captchaResponse.body.data.captchaId;
		const captchaCode = await readCaptchaValue(options.cacheDir, captchaId);
		const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username,
				password: options.password,
				captchaId,
				verifyCode: captchaCode
			})
		});

		if (loginResponse.body?.code !== successCode || !loginResponse.body?.data?.token) {
			reporter.fail(`${username} login`, formatResponse(loginResponse.body));
			return null;
		}

		const token = loginResponse.body.data.token;
		const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
			headers: { Authorization: token }
		});

		if (personResponse.body?.code !== successCode || !personResponse.body?.data) {
			reporter.fail(`${username} person`, formatResponse(personResponse.body));
			return null;
		}

		reporter.pass(
			`${username} login`,
			`token acquired departmentId=${personResponse.body.data.departmentId || 'unknown'}`
		);

		return {
			token,
			payload: decodeTokenPayload(token),
			person: personResponse.body.data
		};
	} catch (error) {
		reporter.fail(`${username} login`, error.message);
		return null;
	}
}

function readMenuArtifacts() {
	const menuJsonPath = path.join(projectRoot, 'src/modules/base/menu.json');
	return {
		menuJsonPath,
		menuTree: JSON.parse(fs.readFileSync(menuJsonPath, 'utf8'))
	};
}

function assertStaticMenuRegistration(reporter) {
	const { menuJsonPath, menuTree } = readMenuArtifacts();
	const nodes = flattenMenuNodes(menuTree);
	const node = nodes.find(item => item?.router === goalRoute);
	const perms = collectMenuPerms(menuTree);
	const problems = [];

	if (!node) {
		problems.push(`missing route ${goalRoute}`);
	} else if (node.viewPath !== goalViewPath) {
		problems.push(`expected viewPath ${goalViewPath} got ${node.viewPath || 'empty'}`);
	}

	for (const perm of goalPermissionKeys) {
		if (!perms.has(perm)) {
			problems.push(`missing perm ${perm}`);
		}
	}

	if (problems.length) {
		reporter.fail('menu.json registration', `${menuJsonPath} ${problems.join('; ')}`);
		return;
	}

	reporter.pass('menu.json registration', `${menuJsonPath} contains goal-plan route and permission keys`);
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
		requiredScopes
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

async function verifyPermMenu(reporter, options, user, session) {
	const scope = `${user.username} permmenu`;
	const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
		headers: { Authorization: session.token }
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

function resolveUserId(session) {
	return Number(session?.payload?.userId || session?.person?.id || 0);
}

function resolveDepartmentId(session) {
	return Number(session?.person?.departmentId || session?.payload?.departmentId || 0);
}

async function getJson(options, token, pathName, query = {}) {
	const url = new URL(`${options.baseUrl}${pathName}`);
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.set(key, String(value));
		}
	}
	return requestJson(url.toString(), {
		headers: { Authorization: token }
	});
}

async function postJson(options, token, pathName, body) {
	return requestJson(`${options.baseUrl}${pathName}`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify(body)
	});
}

function expectSuccess(reporter, scope, response, detailBuilder) {
	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}
	const detail = typeof detailBuilder === 'function' ? detailBuilder(response.body?.data) : detailBuilder;
	reporter.pass(scope, detail || 'success');
	return response.body?.data || null;
}

function expectDenied(reporter, scope, response) {
	if (response.body?.code === successCode) {
		reporter.fail(scope, 'expected denial but request succeeded');
		return false;
	}
	reporter.pass(scope, `denied as expected: ${formatResponse(response.body)}`);
	return true;
}

function assertPlanIdsIncluded(scope, reporter, rows, ids) {
	const actualIds = new Set((rows || []).map(item => Number(item.id)));
	const missingIds = ids.filter(id => !actualIds.has(Number(id)));
	if (missingIds.length) {
		reporter.fail(scope, `missing plan ids ${missingIds.join(', ')}`);
		return false;
	}
	reporter.pass(scope, `plans=${rows.length} includes ${ids.join(', ')}`);
	return true;
}

async function verifyGoalPlanWorkflow(reporter, options, sessions, runtimeMeta) {
	if (!sessions.manager_rd || !sessions.employee_platform || !sessions.hr_admin) {
		reporter.skip('goal-plan workflow', 'skipped because manager_rd / employee_platform / hr_admin login failed');
		return;
	}

	const seedMeta = runtimeMeta?.seedMeta || {};
	const planDate = options.planDate || seedMeta.goalPlanSmokeDate || '2026-04-19';
	const departmentId =
		options.departmentId ||
		Number(seedMeta.goalPlanDepartmentId || 0) ||
		resolveDepartmentId(sessions.manager_rd);
	const employeeId =
		options.employeeId ||
		Number(seedMeta.goalPlanEmployeeUserId || 0) ||
		resolveUserId(sessions.employee_platform);
	const managerUserId = Number(seedMeta.goalPlanManagerUserId || 0) || resolveUserId(sessions.manager_rd);
	const uniqueId = Date.now();

	if (!departmentId || !employeeId || !managerUserId) {
		reporter.fail(
			'goal-plan workflow bootstrap',
			`missing ids departmentId=${departmentId} employeeId=${employeeId} managerUserId=${managerUserId}`
		);
		return;
	}

	const configResponse = await getJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsDepartmentConfig',
		{ departmentId }
	);
	const config = expectSuccess(reporter, 'manager_rd opsDepartmentConfig', configResponse, data => {
		return `assign=${data.assignTime} submit=${data.submitDeadline} report=${data.reportSendTime}`;
	});
	if (!config) {
		return;
	}

	const saveConfigResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsDepartmentConfigSave',
		{
			departmentId,
			assignTime: '09:20',
			submitDeadline: '18:05',
			reportSendTime: '18:40',
			reportPushMode: 'system_and_group',
			reportPushTarget: `goal-plan-stage2-group-${uniqueId}`
		}
	);
	const savedConfig = expectSuccess(reporter, 'manager_rd opsDepartmentConfigSave', saveConfigResponse, data => {
		return `pushTarget=${data.reportPushTarget}`;
	});
	if (!savedConfig) {
		return;
	}

	if (String(savedConfig.reportPushTarget || '') !== `goal-plan-stage2-group-${uniqueId}`) {
		reporter.fail('manager_rd opsDepartmentConfigSave assert', 'reportPushTarget mismatch');
		return;
	}

	const deniedConfigResponse = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsDepartmentConfigSave',
		{
			departmentId,
			assignTime: '09:30',
			submitDeadline: '18:10',
			reportSendTime: '18:45',
			reportPushMode: 'system_only',
			reportPushTarget: 'employee-denied'
		}
	);
	expectDenied(reporter, 'employee_platform opsDepartmentConfigSave', deniedConfigResponse);

	const publicPlanResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanSave',
		{
			departmentId,
			employeeId,
			periodType: 'day',
			planDate,
			periodStartDate: planDate,
			periodEndDate: planDate,
			sourceType: 'public',
			title: `主题23公共目标-${uniqueId}`,
			description: 'stage2 smoke public day plan',
			targetValue: 10,
			unit: '单'
		}
	);
	const publicPlan = expectSuccess(reporter, 'manager_rd opsPlanSave public day', publicPlanResponse, data => {
		return `id=${data.id} employeeId=${data.employeeId}`;
	});
	if (!publicPlan?.id) {
		return;
	}

	const personalPlanResponse = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsPlanSave',
		{
			employeeId,
			periodType: 'day',
			planDate,
			periodStartDate: planDate,
			periodEndDate: planDate,
			sourceType: 'personal',
			title: `主题23个人补充目标-${uniqueId}`,
			description: 'stage2 smoke personal day plan',
			targetValue: 5,
			unit: '单'
		}
	);
	const personalPlan = expectSuccess(reporter, 'employee_platform opsPlanSave personal day', personalPlanResponse, data => {
		return `id=${data.id} source=${data.sourceType}`;
	});
	if (!personalPlan?.id) {
		return;
	}

	const managerPendingPlanResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanSave',
		{
			departmentId,
			employeeId: managerUserId,
			periodType: 'day',
			planDate,
			periodStartDate: planDate,
			periodEndDate: planDate,
			sourceType: 'public',
			title: `主题23补零目标-${uniqueId}`,
			description: 'stage2 smoke auto-zero plan',
			targetValue: 8,
			unit: '单'
		}
	);
	const managerPendingPlan = expectSuccess(reporter, 'manager_rd opsPlanSave auto-zero day', managerPendingPlanResponse, data => {
		return `id=${data.id} employeeId=${data.employeeId}`;
	});
	if (!managerPendingPlan?.id) {
		return;
	}

	const weekPlanResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanSave',
		{
			departmentId,
			employeeId,
			periodType: 'week',
			periodStartDate: planDate,
			periodEndDate: planDate,
			sourceType: 'public',
			title: `主题23周目标-${uniqueId}`,
			description: 'stage2 smoke week plan',
			targetValue: 50,
			unit: '单'
		}
	);
	const weekPlan = expectSuccess(reporter, 'manager_rd opsPlanSave week', weekPlanResponse, data => `id=${data.id}`);
	if (!weekPlan?.id) {
		return;
	}

	const monthPlanResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanSave',
		{
			departmentId,
			employeeId,
			periodType: 'month',
			periodStartDate: planDate,
			periodEndDate: planDate,
			sourceType: 'public',
			title: `主题23月目标-${uniqueId}`,
			description: 'stage2 smoke month plan',
			targetValue: 200,
			unit: '单'
		}
	);
	const monthPlan = expectSuccess(reporter, 'manager_rd opsPlanSave month', monthPlanResponse, data => `id=${data.id}`);
	if (!monthPlan?.id) {
		return;
	}

	const managerDayPageResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanPage',
		{
			page: 1,
			size: 50,
			periodType: 'day',
			planDate,
			departmentId
		}
	);
	const managerDayPage = expectSuccess(reporter, 'manager_rd opsPlanPage day', managerDayPageResponse, data => {
		return `total=${data.pagination?.total || 0}`;
	});
	if (!managerDayPage) {
		return;
	}
	assertPlanIdsIncluded(
		'manager_rd opsPlanPage day assert',
		reporter,
		managerDayPage.list || [],
		[publicPlan.id, personalPlan.id, managerPendingPlan.id]
	);

	const managerWeekPageResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanPage',
		{
			page: 1,
			size: 20,
			periodType: 'week',
			departmentId
		}
	);
	const managerWeekPage = expectSuccess(reporter, 'manager_rd opsPlanPage week', managerWeekPageResponse, data => {
		return `total=${data.pagination?.total || 0}`;
	});
	if (!managerWeekPage) {
		return;
	}
	assertPlanIdsIncluded('manager_rd opsPlanPage week assert', reporter, managerWeekPage.list || [], [weekPlan.id]);

	const publicPlanInfoResponse = await getJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanInfo',
		{
			id: publicPlan.id
		}
	);
	const publicPlanInfo = expectSuccess(
		reporter,
		'manager_rd opsPlanInfo public day',
		publicPlanInfoResponse,
		data => `id=${data.id} source=${data.sourceType} employeeId=${data.employeeId}`
	);
	if (
		!publicPlanInfo ||
		Number(publicPlanInfo.id) !== Number(publicPlan.id) ||
		String(publicPlanInfo.sourceType) !== 'public'
	) {
		reporter.fail('manager_rd opsPlanInfo public day assert', formatResponse(publicPlanInfo));
		return;
	}
	reporter.pass(
		'manager_rd opsPlanInfo public day assert',
		'detail endpoint returned the saved public day plan'
	);

	const monthPlanDeleteResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanDelete',
		{
			ids: [Number(monthPlan.id)]
		}
	);
	if (monthPlanDeleteResponse.body?.code !== successCode) {
		reporter.fail('manager_rd opsPlanDelete month', formatResponse(monthPlanDeleteResponse.body));
		return;
	}
	reporter.pass('manager_rd opsPlanDelete month', 'month plan deleted');

	const monthPlanInfoAfterDeleteResponse = await getJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsPlanInfo',
		{
			id: monthPlan.id
		}
	);
	if (monthPlanInfoAfterDeleteResponse.body?.code === successCode) {
		reporter.fail(
			'manager_rd opsPlanDelete month assert',
			'deleted month plan is still accessible through opsPlanInfo'
		);
		return;
	}
	reporter.pass(
		'manager_rd opsPlanDelete month assert',
		'deleted month plan can no longer be queried'
	);

	const employeeDayPageResponse = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsPlanPage',
		{
			page: 1,
			size: 50,
			periodType: 'day',
			planDate
		}
	);
	const employeeDayPage = expectSuccess(reporter, 'employee_platform opsPlanPage day', employeeDayPageResponse, data => {
		return `total=${data.pagination?.total || 0}`;
	});
	if (!employeeDayPage) {
		return;
	}
	assertPlanIdsIncluded(
		'employee_platform opsPlanPage day assert',
		reporter,
		employeeDayPage.list || [],
		[publicPlan.id, personalPlan.id]
	);
	reporter.pass(
		'employee_platform opsPlanPage scope',
		'employee list contains own public/personal plans; department visibility follows current scoped contract'
	);

	const employeeSubmitResponse = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsDailySubmit',
		{
			planDate,
			departmentId,
			items: [
				{
					planId: Number(publicPlan.id),
					actualValue: 8
				},
				{
					planId: Number(personalPlan.id),
					actualValue: 3
				}
			]
		}
	);
	const employeeSubmitOverview = expectSuccess(reporter, 'employee_platform opsDailySubmit', employeeSubmitResponse, data => {
		return `rows=${data.rows?.length || 0}`;
	});
	if (!employeeSubmitOverview) {
		return;
	}

	const managerOverviewResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsOverview',
		{
			planDate,
			departmentId
		}
	);
	const managerOverview = expectSuccess(reporter, 'manager_rd opsOverview', managerOverviewResponse, data => {
		return `rows=${data.rows?.length || 0} completion=${data.departmentSummary?.completionRate || 0}`;
	});
	if (!managerOverview) {
		return;
	}

	const employeeRow = (managerOverview.rows || []).find(item => Number(item.employeeId) === Number(employeeId));
	if (
		!employeeRow ||
		Number(employeeRow.publicActualValue) !== 8 ||
		Number(employeeRow.personalActualValue) !== 3 ||
		Number(employeeRow.totalActualValue) !== 11
	) {
		reporter.fail('manager_rd opsOverview split assert', JSON.stringify(employeeRow || null));
		return;
	}
	reporter.pass('manager_rd opsOverview split assert', 'public/personal contribution split matched 8/3');

	const employeeOverviewResponse = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsOverview',
		{
			planDate,
			departmentId
		}
	);
	const employeeOverview = expectSuccess(reporter, 'employee_platform opsOverview', employeeOverviewResponse, data => {
		return `rows=${data.rows?.length || 0}`;
	});
	if (!employeeOverview) {
		return;
	}

	const employeeOverviewRow = (employeeOverview.rows || []).find(
		item => Number(item.employeeId) === Number(employeeId)
	);
	if (
		!employeeOverviewRow ||
		Number(employeeOverviewRow.publicActualValue) !== 8 ||
		Number(employeeOverviewRow.personalActualValue) !== 3
	) {
		reporter.fail('employee_platform opsOverview scope', formatResponse(employeeOverview.rows || []));
		return;
	}
	reporter.pass(
		'employee_platform opsOverview scope',
		'overview contains own contribution split; department leaderboard visibility is allowed'
	);

	const finalizeResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsDailyFinalize',
		{
			planDate,
			departmentId
		}
	);
	const finalizeResult = expectSuccess(reporter, 'manager_rd opsDailyFinalize', finalizeResponse, data => {
		return `autoZeroCount=${data.autoZeroCount}`;
	});
	if (!finalizeResult) {
		return;
	}

	if (Number(finalizeResult.autoZeroCount) < 1) {
		reporter.fail('manager_rd opsDailyFinalize assert', 'expected at least one auto-zero plan');
		return;
	}
	reporter.pass('manager_rd opsDailyFinalize assert', 'auto-zero covered remaining manager plan');

	const reportGenerateResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsReportGenerate',
		{
			planDate,
			departmentId
		}
	);
	const generatedReport = expectSuccess(reporter, 'manager_rd opsReportGenerate', reportGenerateResponse, data => {
		return `status=${data.status}`;
	});
	if (!generatedReport?.summary) {
		reporter.fail('manager_rd opsReportGenerate summary', formatResponse(generatedReport));
		return;
	}

	if (
		Number(generatedReport.summary.departmentSummary.totalActualValue) !== 11 ||
		!Array.isArray(generatedReport.summary.autoZeroEmployees) ||
		generatedReport.summary.autoZeroEmployees.length < 1
	) {
		reporter.fail(
			'manager_rd opsReportGenerate summary',
			formatResponse(generatedReport.summary)
		);
		return;
	}
	reporter.pass('manager_rd opsReportGenerate summary', 'report summary retained totals and auto-zero employees');

	const reportInfoResponse = await getJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsReportInfo',
		{
			departmentId,
			reportDate: planDate
		}
	);
	const reportInfo = expectSuccess(reporter, 'manager_rd opsReportInfo', reportInfoResponse, data => {
		return `status=${data.status}`;
	});
	if (!reportInfo?.summary || String(reportInfo.status) !== 'generated') {
		reporter.fail('manager_rd opsReportInfo assert', formatResponse(reportInfo));
		return;
	}
	reporter.pass(
		'manager_rd opsReportInfo assert',
		'report detail endpoint returned generated summary payload'
	);

	const employeeDeniedReportStatus = await postJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsReportStatusUpdate',
		{
			departmentId,
			reportDate: planDate,
			status: 'sent',
			remark: 'employee should be denied'
		}
	);
	expectDenied(reporter, 'employee_platform opsReportStatusUpdate', employeeDeniedReportStatus);

	const delayedResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsReportStatusUpdate',
		{
			departmentId,
			reportDate: planDate,
			status: 'delayed',
			remark: 'smoke delayed once'
		}
	);
	const delayedReport = expectSuccess(reporter, 'manager_rd opsReportStatusUpdate delayed', delayedResponse, data => {
		return `status=${data.status}`;
	});
	if (!delayedReport || delayedReport.status !== 'delayed') {
		reporter.fail('manager_rd opsReportStatusUpdate delayed assert', formatResponse(delayedReport));
		return;
	}
	reporter.pass('manager_rd opsReportStatusUpdate delayed assert', 'status switched to delayed');

	const sentResponse = await postJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsReportStatusUpdate',
		{
			departmentId,
			reportDate: planDate,
			status: 'sent',
			remark: 'smoke sent'
		}
	);
	const sentReport = expectSuccess(reporter, 'manager_rd opsReportStatusUpdate sent', sentResponse, data => {
		return `status=${data.status} sentAt=${data.sentAt || 'empty'}`;
	});
	if (!sentReport || sentReport.status !== 'sent' || !sentReport.sentAt) {
		reporter.fail('manager_rd opsReportStatusUpdate sent assert', formatResponse(sentReport));
		return;
	}
	reporter.pass('manager_rd opsReportStatusUpdate sent assert', 'status switched to sent with sentAt');
}

async function verifyAccessProfiles(reporter, options, sessions) {
	if (!sessions.manager_rd || !sessions.employee_platform) {
		reporter.skip('opsAccessProfile', 'skipped because manager_rd / employee_platform login failed');
		return;
	}

	const managerDepartmentId = resolveDepartmentId(sessions.manager_rd);
	const managerResponse = await getJson(
		options,
		sessions.manager_rd.token,
		'/admin/performance/goal/opsAccessProfile',
		{
			departmentId: managerDepartmentId
		}
	);
	const managerProfile = expectSuccess(
		reporter,
		'manager_rd opsAccessProfile',
		managerResponse,
		data =>
			`canManageDepartment=${data.canManageDepartment} manageable=${(data.manageableDepartmentIds || []).join(',')}`
	);
	if (
		!managerProfile ||
		managerProfile.canManageDepartment !== true ||
		managerProfile.isHr !== false
	) {
		reporter.fail(
			'manager_rd opsAccessProfile assert',
			formatResponse(managerProfile || managerResponse.body)
		);
		return;
	}
	reporter.pass(
		'manager_rd opsAccessProfile assert',
		'manager keeps department ops access while remaining non-HR'
	);

	const employeeDepartmentId = resolveDepartmentId(sessions.employee_platform);
	const employeeResponse = await getJson(
		options,
		sessions.employee_platform.token,
		'/admin/performance/goal/opsAccessProfile',
		{
			departmentId: employeeDepartmentId
		}
	);
	const employeeProfile = expectSuccess(
		reporter,
		'employee_platform opsAccessProfile',
		employeeResponse,
		data =>
			`canManageDepartment=${data.canManageDepartment} canMaintainPersonalPlan=${data.canMaintainPersonalPlan}`
	);
	if (
		!employeeProfile ||
		employeeProfile.canManageDepartment !== false ||
		employeeProfile.canMaintainPersonalPlan !== true
	) {
		reporter.fail(
			'employee_platform opsAccessProfile assert',
			formatResponse(employeeProfile || employeeResponse.body)
		);
		return;
	}
	reporter.pass(
		'employee_platform opsAccessProfile assert',
		'employee keeps personal maintenance access without department ops access'
	);
}

async function run() {
	const reporter = new Reporter();
	const options = buildOptions(process.argv.slice(2));
	const sessions = {};

	console.log('Theme 23 goal-plan smoke');
	console.log(`Base URL: ${options.baseUrl}`);
	console.log(`Cache Dir: ${options.cacheDir}`);

	const runtimeMeta = await verifyRuntimePreflight(reporter, options);
	if (!runtimeMeta) {
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}

	if (!fs.existsSync(options.cacheDir)) {
		reporter.fail('bootstrap', `cache directory does not exist: ${options.cacheDir}`);
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}

	assertStaticMenuRegistration(reporter);

	for (const user of users) {
		sessions[user.username] = await fetchCaptchaAndLogin(reporter, options, user.username);
		if (!sessions[user.username]) {
			reporter.skip(`${user.username} permmenu`, 'skipped because login failed');
			continue;
		}
		await verifyPermMenu(reporter, options, user, sessions[user.username]);
	}

	await verifyAccessProfiles(reporter, options, sessions);
	await verifyGoalPlanWorkflow(reporter, options, sessions, runtimeMeta);

	printSummary(reporter);
	if (reporter.hasFailures()) {
		process.exitCode = 1;
	}
}

await run();
