/**
 * Recruitment chain smoke verification.
 * This file validates the minimum live API chain across jobStandard, recruitPlan, resumePool, interview, hiring, and optional talentAsset conversion.
 * It does not clean up created business data, mutate runtime config, or replace the broader per-theme smoke scripts.
 * Maintenance pitfall: keep endpoint paths, required perms, and linked-field assertions aligned with seed-stage2-performance.mjs and the frozen recruitment-domain contracts.
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
	validateStage2RuntimeMeta,
} from './stage2-runtime-meta.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const defaultPassword = '123456';
const defaultUsername = 'hr_admin';
const successCode = 1000;
const requiredScopes = [
	'theme12-talentAsset',
	'theme15-resumePool',
	'theme16-recruit-plan',
	'theme17-job-standard',
	'theme18-hiring',
];
const requiredRoutes = [
	'/performance/recruitment-center',
	'/performance/job-standard',
	'/performance/recruit-plan',
	'/performance/resumePool',
	'/performance/interview',
	'/performance/hiring',
];
const requiredPerms = [
	'performance:jobStandard:add',
	'performance:recruitPlan:add',
	'performance:resumePool:add',
	'performance:resumePool:createInterview',
	'performance:hiring:add',
];

function md5(value) {
	return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
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

function flattenMenuRouters(menus = [], output = new Set()) {
	for (const menu of menus) {
		if (menu?.router) {
			output.add(menu.router);
		}
		flattenMenuRouters(menu?.childMenus || [], output);
	}
	return output;
}

function listItems(body) {
	return Array.isArray(body?.data?.list) ? body.data.list : [];
}

function totalFromPage(body) {
	return Number(body?.data?.pagination?.total || 0);
}

function resolveDefaultCacheDir() {
	for (const candidate of [
		path.join(projectRoot, 'dist/config/config.default.js'),
		path.join(projectRoot, 'src/config/config.default.ts'),
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

	throw new Error(
		'Unable to resolve cache directory from dist/config/config.default.js or src/config/config.default.ts'
	);
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

function printSummary(reporter) {
	const stats = reporter.summary();
	console.log('');
	console.log('Summary');
	console.log(`PASS: ${stats.PASS}`);
	console.log(`FAIL: ${stats.FAIL}`);
	console.log(`SKIP: ${stats.SKIP}`);
	console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function parseOptionalNumber(value) {
	if (value === undefined || value === null || value === '') {
		return null;
	}
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseArgs(argv) {
	const options = {
		baseUrl: process.env.RECRUITMENT_CHAIN_SMOKE_BASE_URL || '',
		password: process.env.RECRUITMENT_CHAIN_SMOKE_PASSWORD || defaultPassword,
		cacheDir: process.env.RECRUITMENT_CHAIN_SMOKE_CACHE_DIR || resolveDefaultCacheDir(),
		username: process.env.RECRUITMENT_CHAIN_SMOKE_USERNAME || defaultUsername,
		departmentId: parseOptionalNumber(process.env.RECRUITMENT_CHAIN_SMOKE_DEPARTMENT_ID),
		skipConvert:
			process.env.RECRUITMENT_CHAIN_SMOKE_SKIP_CONVERT === '1' ||
			process.env.RECRUITMENT_CHAIN_SMOKE_SKIP_CONVERT === 'true',
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

		if (current === '--username' && next) {
			options.username = next;
			index += 1;
			continue;
		}

		if (current === '--department-id' && next) {
			options.departmentId = parseOptionalNumber(next);
			index += 1;
			continue;
		}

		if (current === '--skip-convert') {
			options.skipConvert = true;
			continue;
		}

		if (current === '--help' || current === '-h') {
			console.log(`Usage: node ${path.relative(process.cwd(), fileURLToPath(import.meta.url))} [options]

Options:
  --base-url, -u       Override backend base URL
  --password, -p       Override login password (default: ${defaultPassword})
  --cache-dir, -c      Override Cool cache directory
  --username           Override login username (default: ${defaultUsername})
  --department-id      Optional target department ID override
  --skip-convert       Skip optional convertToTalentAsset verification
  --help, -h           Show this help message

Environment variables:
  RECRUITMENT_CHAIN_SMOKE_BASE_URL        Required backend base URL. Example: http://127.0.0.1:8062
  RECRUITMENT_CHAIN_SMOKE_PASSWORD        Optional login password
  RECRUITMENT_CHAIN_SMOKE_CACHE_DIR       Optional Cool cache directory
  RECRUITMENT_CHAIN_SMOKE_USERNAME        Optional login username
  RECRUITMENT_CHAIN_SMOKE_DEPARTMENT_ID   Optional target department ID override
  RECRUITMENT_CHAIN_SMOKE_SKIP_CONVERT    Set to 1/true to skip convertToTalentAsset
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
		throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set RECRUITMENT_CHAIN_SMOKE_BASE_URL.'
		);
	}

	options.baseUrl = options.baseUrl.replace(/\/+$/, '');
	return options;
}

async function requestJson(url, init = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal,
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
			body,
		};
	} finally {
		clearTimeout(timeout);
	}
}

async function authJson(options, token, method, urlPath, body) {
	return requestJson(`${options.baseUrl}${urlPath}`, {
		method,
		headers: {
			Authorization: token,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
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
		requiredScopes,
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

function cacheFilePath(cacheDir, key) {
	return path.join(cacheDir, `diskstore-${md5(key)}.json`);
}

async function readCaptchaValue(cacheDir, captchaId) {
	const key = `verify:img:${captchaId}`;
	const file = cacheFilePath(cacheDir, key);
	for (let attempt = 0; attempt < 20; attempt += 1) {
		if (fs.existsSync(file)) {
			const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
			if (parsed?.key === key && parsed?.val) {
				return parsed.val;
			}
		}
		await sleep(100);
	}
	throw new Error(`Captcha cache file not found for ${captchaId} under ${cacheDir}`);
}

async function fetchCaptchaAndLogin(reporter, options) {
	const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
	const captchaId = captchaResponse.body?.data?.captchaId;

	if (captchaResponse.body?.code !== successCode || !captchaId) {
		reporter.fail(`${options.username} captcha`, formatResponse(captchaResponse.body));
		return null;
	}

	reporter.pass(`${options.username} captcha`, `captchaId=${captchaId}`);

	try {
		const verifyCode = await readCaptchaValue(options.cacheDir, captchaId);
		const loginResponse = await requestJson(`${options.baseUrl}/admin/base/open/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: options.username,
				password: options.password,
				captchaId,
				verifyCode,
			}),
		});

		if (loginResponse.body?.code !== successCode) {
			reporter.fail(`${options.username} login`, formatResponse(loginResponse.body));
			return null;
		}

		const token = loginResponse.body?.data?.token;
		if (!token) {
			reporter.fail(`${options.username} login`, 'login succeeded without token');
			return null;
		}

		reporter.pass(`${options.username} login`, 'token acquired');
		return { token };
	} catch (error) {
		reporter.fail(`${options.username} login`, error.message);
		return null;
	}
}

async function verifyPermMenu(reporter, options, token) {
	const response = await requestJson(`${options.baseUrl}/admin/base/comm/permmenu`, {
		headers: { Authorization: token },
	});

	if (response.body?.code !== successCode) {
		reporter.fail(`${options.username} permmenu`, formatResponse(response.body));
		return null;
	}

	const routers = flattenMenuRouters(response.body?.data?.menus || []);
	const perms = new Set(response.body?.data?.perms || []);
	const problems = [];

	for (const route of requiredRoutes) {
		if (!routers.has(route)) {
			problems.push(`missing route ${route}`);
		}
	}

	for (const perm of requiredPerms) {
		if (!perms.has(perm)) {
			problems.push(`missing perm ${perm}`);
		}
	}

	if (problems.length) {
		reporter.fail(`${options.username} permmenu`, problems.join('; '));
		return null;
	}

	reporter.pass(`${options.username} permmenu`, `routes=${routers.size} perms=${perms.size}`);
	return {
		routers,
		perms,
	};
}

async function expectSuccess(reporter, scope, response) {
	if (response.body?.code !== successCode) {
		reporter.fail(scope, formatResponse(response.body));
		return null;
	}
	return response.body?.data;
}

function formatDate(date) {
	const pad = value => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildDateRange() {
	const start = new Date();
	const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
	return {
		startDate: formatDate(start),
		endDate: formatDate(end),
	};
}

function buildUniqueLabel() {
	const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
	const random = crypto.randomBytes(3).toString('hex');
	return `联调-招聘主链-${stamp}-${random}`;
}

async function fetchPageData(reporter, options, token, urlPath, payload, scope) {
	const response = await authJson(options, token, 'POST', urlPath, payload);
	const data = await expectSuccess(reporter, scope, response);
	if (!data) {
		return [];
	}
	const list = Array.isArray(data.list) ? data.list : [];
	reporter.pass(scope, `total=${totalFromPage(response.body)} list=${list.length}`);
	return list;
}

async function fetchInfoData(reporter, options, token, urlPath, id, scope) {
	const response = await requestJson(`${options.baseUrl}${urlPath}?id=${Number(id)}`, {
		headers: { Authorization: token },
	});
	return expectSuccess(reporter, scope, response);
}

async function postData(reporter, options, token, urlPath, payload, scope) {
	const response = await authJson(options, token, 'POST', urlPath, payload);
	const data = await expectSuccess(reporter, scope, response);
	if (data) {
		reporter.pass(scope, `id=${data.id ?? data.interviewId ?? data.talentAssetId ?? 'n/a'}`);
	}
	return data;
}

async function resolveDepartmentContext(reporter, options, token) {
	if (options.departmentId) {
		reporter.pass('resolveDepartment', `using override departmentId=${options.departmentId}`);
		return {
			targetDepartmentId: options.departmentId,
			targetDepartmentName: '',
		};
	}

	const candidates = [
		{
			urlPath: '/admin/performance/recruitPlan/page',
			payload: { page: 1, size: 5 },
			scope: 'seed recruitPlan:page',
			pick: item => ({
				targetDepartmentId: Number(item.targetDepartmentId || 0),
				targetDepartmentName: item.targetDepartmentName || '',
			}),
		},
		{
			urlPath: '/admin/performance/jobStandard/page',
			payload: { page: 1, size: 5 },
			scope: 'seed jobStandard:page',
			pick: item => ({
				targetDepartmentId: Number(item.targetDepartmentId || 0),
				targetDepartmentName: item.targetDepartmentName || '',
			}),
		},
		{
			urlPath: '/admin/performance/resumePool/page',
			payload: { page: 1, size: 5 },
			scope: 'seed resumePool:page',
			pick: item => ({
				targetDepartmentId: Number(item.targetDepartmentId || 0),
				targetDepartmentName: item.targetDepartmentName || '',
			}),
		},
	];

	for (const candidate of candidates) {
		const list = await fetchPageData(
			reporter,
			options,
			token,
			candidate.urlPath,
			candidate.payload,
			candidate.scope
		);
		const matched = list
			.map(candidate.pick)
			.find(item => Number.isInteger(item.targetDepartmentId) && item.targetDepartmentId > 0);
		if (matched) {
			reporter.pass(
				'resolveDepartment',
				`departmentId=${matched.targetDepartmentId} name=${matched.targetDepartmentName || '-'}`
			);
			return matched;
		}
	}

	reporter.fail('resolveDepartment', 'unable to derive targetDepartmentId from seeded pages');
	return null;
}

function assertCondition(reporter, scope, condition, successDetail, failDetail) {
	if (condition) {
		reporter.pass(scope, successDetail);
		return true;
	}
	reporter.fail(scope, failDetail);
	return false;
}

async function runChain(reporter, options, token, perms) {
	const department = await resolveDepartmentContext(reporter, options, token);
	if (!department) {
		return;
	}

	const unique = buildUniqueLabel();
	const positionName = `${unique}-岗位`;
	const { startDate, endDate } = buildDateRange();

	const jobStandard = await postData(
		reporter,
		options,
		token,
		'/admin/performance/jobStandard/add',
		{
			positionName,
			targetDepartmentId: department.targetDepartmentId,
			jobLevel: 'P4',
			profileSummary: `${unique} 画像摘要`,
			requirementSummary: `${unique} 岗位要求`,
			skillTagList: ['招聘链', 'Smoke'],
			interviewTemplateSummary: `${unique} 面试模板`,
		},
		'jobStandard:add'
	);
	if (!jobStandard?.id) {
		return;
	}

	assertCondition(
		reporter,
		'jobStandard:verify',
		Number(jobStandard.targetDepartmentId) === Number(department.targetDepartmentId) &&
			String(jobStandard.positionName || '') === positionName,
		`jobStandardId=${jobStandard.id} department=${jobStandard.targetDepartmentId}`,
		`unexpected jobStandard payload ${JSON.stringify({
			id: jobStandard.id,
			targetDepartmentId: jobStandard.targetDepartmentId,
			positionName: jobStandard.positionName,
		})}`
	);

	const recruitPlan = await postData(
		reporter,
		options,
		token,
		'/admin/performance/recruitPlan/add',
		{
			title: `${unique}-计划`,
			targetDepartmentId: department.targetDepartmentId,
			positionName,
			headcount: 1,
			startDate,
			endDate,
			requirementSummary: `${unique} 招聘计划要求`,
			jobStandardId: Number(jobStandard.id),
		},
		'recruitPlan:add'
	);
	if (!recruitPlan?.id) {
		return;
	}

	assertCondition(
		reporter,
		'recruitPlan:verify',
		Number(recruitPlan.jobStandardId) === Number(jobStandard.id) &&
			Number(recruitPlan.targetDepartmentId) === Number(department.targetDepartmentId),
		`recruitPlanId=${recruitPlan.id} jobStandardId=${recruitPlan.jobStandardId}`,
		`unexpected recruitPlan link ${JSON.stringify({
			id: recruitPlan.id,
			jobStandardId: recruitPlan.jobStandardId,
			targetDepartmentId: recruitPlan.targetDepartmentId,
		})}`
	);

	const candidateName = `${unique}-候选人`;
	const resume = await postData(
		reporter,
		options,
		token,
		'/admin/performance/resumePool/add',
		{
			candidateName,
			targetDepartmentId: department.targetDepartmentId,
			targetPosition: positionName,
			phone: `139${Date.now().toString().slice(-8)}`,
			email: `${unique.toLowerCase().replace(/[^a-z0-9]+/g, '')}@example.com`,
			resumeText: `${unique} 简历全文，用于招聘主链 smoke 验证。`,
			sourceType: 'manual',
			sourceRemark: 'recruitment-chain-smoke',
			recruitPlanId: Number(recruitPlan.id),
			jobStandardId: Number(jobStandard.id),
		},
		'resumePool:add'
	);
	if (!resume?.id) {
		return;
	}

	assertCondition(
		reporter,
		'resumePool:verify',
		Number(resume.recruitPlanId) === Number(recruitPlan.id) &&
			Number(resume.jobStandardId) === Number(jobStandard.id) &&
			String(resume.status || '') === 'new',
		`resumeId=${resume.id} status=${resume.status}`,
		`unexpected resume link ${JSON.stringify({
			id: resume.id,
			recruitPlanId: resume.recruitPlanId,
			jobStandardId: resume.jobStandardId,
			status: resume.status,
		})}`
	);

	const createInterviewResult = await postData(
		reporter,
		options,
		token,
		'/admin/performance/resumePool/createInterview',
		{ id: Number(resume.id) },
		'resumePool:createInterview'
	);
	if (!createInterviewResult?.interviewId) {
		return;
	}

	assertCondition(
		reporter,
		'resumePool:createInterview-verify',
		Number(createInterviewResult.resumePoolId) === Number(resume.id) &&
			Number(createInterviewResult.recruitPlanId) === Number(recruitPlan.id) &&
			String(createInterviewResult.status || '') === 'interviewing',
		`interviewId=${createInterviewResult.interviewId} status=${createInterviewResult.status}`,
		`unexpected createInterview result ${JSON.stringify(createInterviewResult)}`
	);

	const resumeInfo = await fetchInfoData(
		reporter,
		options,
		token,
		'/admin/performance/resumePool/info',
		resume.id,
		'resumePool:info-after-createInterview'
	);
	if (!resumeInfo) {
		return;
	}

	assertCondition(
		reporter,
		'resumePool:status-link',
		String(resumeInfo.status || '') === 'interviewing' &&
			Number(resumeInfo.latestInterviewId) === Number(createInterviewResult.interviewId),
		`resume status=${resumeInfo.status} latestInterviewId=${resumeInfo.latestInterviewId}`,
		`resume did not link interview correctly ${JSON.stringify({
			status: resumeInfo.status,
			latestInterviewId: resumeInfo.latestInterviewId,
		})}`
	);

	const interviewInfo = await fetchInfoData(
		reporter,
		options,
		token,
		'/admin/performance/interview/info',
		createInterviewResult.interviewId,
		'interview:info'
	);
	if (!interviewInfo) {
		return;
	}

	assertCondition(
		reporter,
		'interview:verify-link',
		Number(interviewInfo.resumePoolId) === Number(resume.id) &&
			Number(interviewInfo.recruitPlanId) === Number(recruitPlan.id) &&
			String(interviewInfo.candidateName || '') === candidateName,
		`interviewId=${interviewInfo.id} resumePoolId=${interviewInfo.resumePoolId}`,
		`unexpected interview link ${JSON.stringify({
			id: interviewInfo.id,
			resumePoolId: interviewInfo.resumePoolId,
			recruitPlanId: interviewInfo.recruitPlanId,
			candidateName: interviewInfo.candidateName,
		})}`
	);

	const hiring = await postData(
		reporter,
		options,
		token,
		'/admin/performance/hiring/add',
		{
			candidateName,
			targetDepartmentId: department.targetDepartmentId,
			targetPosition: positionName,
			hiringDecision: `${unique} 录用建议`,
			interviewId: Number(interviewInfo.id),
			resumePoolId: Number(resume.id),
			recruitPlanId: Number(recruitPlan.id),
		},
		'hiring:add'
	);
	if (!hiring?.id) {
		return;
	}

	assertCondition(
		reporter,
		'hiring:verify-link',
		String(hiring.status || '') === 'offered' &&
			String(hiring.sourceType || '') === 'interview' &&
			Number(hiring.interviewId) === Number(interviewInfo.id) &&
			Number(hiring.resumePoolId) === Number(resume.id) &&
			Number(hiring.recruitPlanId) === Number(recruitPlan.id),
		`hiringId=${hiring.id} sourceType=${hiring.sourceType}`,
		`unexpected hiring link ${JSON.stringify({
			id: hiring.id,
			status: hiring.status,
			sourceType: hiring.sourceType,
			interviewId: hiring.interviewId,
			resumePoolId: hiring.resumePoolId,
			recruitPlanId: hiring.recruitPlanId,
		})}`
	);

	if (options.skipConvert) {
		reporter.skip('resumePool:convertToTalentAsset', 'skipped by --skip-convert');
		return;
	}

	if (!perms.has('performance:resumePool:convertToTalentAsset')) {
		reporter.skip('resumePool:convertToTalentAsset', 'permission missing from permmenu');
		return;
	}

	const convertResult = await postData(
		reporter,
		options,
		token,
		'/admin/performance/resumePool/convertToTalentAsset',
		{ id: Number(resume.id) },
		'resumePool:convertToTalentAsset'
	);
	if (!convertResult?.talentAssetId) {
		return;
	}

	const convertedResumeInfo = await fetchInfoData(
		reporter,
		options,
		token,
		'/admin/performance/resumePool/info',
		resume.id,
		'resumePool:info-after-convert'
	);
	if (!convertedResumeInfo) {
		return;
	}

	assertCondition(
		reporter,
		'resumePool:talentAsset-link',
		Number(convertedResumeInfo.linkedTalentAssetId) === Number(convertResult.talentAssetId),
		`linkedTalentAssetId=${convertedResumeInfo.linkedTalentAssetId}`,
		`resume linkedTalentAssetId mismatch ${JSON.stringify({
			linkedTalentAssetId: convertedResumeInfo.linkedTalentAssetId,
			talentAssetId: convertResult.talentAssetId,
		})}`
	);

	const talentAssetInfo = await fetchInfoData(
		reporter,
		options,
		token,
		'/admin/performance/talentAsset/info',
		convertResult.talentAssetId,
		'talentAsset:info'
	);
	if (!talentAssetInfo) {
		return;
	}

	assertCondition(
		reporter,
		'talentAsset:verify-link',
		String(talentAssetInfo.candidateName || '') === candidateName &&
			Number(talentAssetInfo.targetDepartmentId) === Number(department.targetDepartmentId),
		`talentAssetId=${talentAssetInfo.id} candidate=${talentAssetInfo.candidateName}`,
		`unexpected talentAsset info ${JSON.stringify({
			id: talentAssetInfo.id,
			candidateName: talentAssetInfo.candidateName,
			targetDepartmentId: talentAssetInfo.targetDepartmentId,
		})}`
	);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const reporter = new Reporter();

	console.log('Recruitment chain smoke check');
	console.log(`Base URL: ${options.baseUrl}`);
	console.log(`Username: ${options.username}`);
	console.log(`Skip convert: ${options.skipConvert ? 'yes' : 'no'}`);
	console.log('');

	const preflightOk = await verifyRuntimePreflight(reporter, options);
	if (!preflightOk) {
		printSummary(reporter);
		process.exit(1);
	}

	const session = await fetchCaptchaAndLogin(reporter, options);
	if (!session?.token) {
		printSummary(reporter);
		process.exit(1);
	}

	const menuContext = await verifyPermMenu(reporter, options, session.token);
	if (!menuContext?.perms) {
		printSummary(reporter);
		process.exit(1);
	}

	await runChain(reporter, options, session.token, menuContext.perms);
	printSummary(reporter);
	process.exit(reporter.hasFailures() ? 1 : 0);
}

main().catch(error => {
	console.error('[FATAL]', error?.stack || error?.message || String(error));
	process.exit(1);
});
