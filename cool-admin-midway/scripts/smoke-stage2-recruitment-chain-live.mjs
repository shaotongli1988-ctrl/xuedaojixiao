/**
 * Recruitment center live chain smoke verification.
 * This script validates the real cross-module chain on a live backend:
 * jobStandard -> recruitPlan -> resumePool -> talentAsset -> interview -> hiring.
 * It does not clean up created records, seed databases, or replace broader permission smoke coverage.
 * Maintenance pitfall: payload field names and endpoint paths must stay aligned with the frozen service contracts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const successCode = 1000;
const defaultUsername = 'hr_admin';
const defaultPassword = '123456';

function md5(value) {
	return crypto.createHash('md5').update(String(value)).digest('hex');
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
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

function decodeTokenPayload(token) {
	const encoded = String(token || '').split('.')[1];
	if (!encoded) {
		return {};
	}
	return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
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
			ok: response.ok,
			body,
		};
	} finally {
		clearTimeout(timeout);
	}
}

function createJsonHeaders(token) {
	return {
		Authorization: token,
		'Content-Type': 'application/json',
	};
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

	summary() {
		const stats = { PASS: 0, FAIL: 0 };
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
	console.log(`Conclusion: ${reporter.hasFailures() ? 'FAILED' : 'PASSED'}`);
}

function parseArgs(argv) {
	const options = {
		baseUrl: process.env.RECRUITMENT_CHAIN_BASE_URL || '',
		username: process.env.RECRUITMENT_CHAIN_USERNAME || defaultUsername,
		password: process.env.RECRUITMENT_CHAIN_PASSWORD || defaultPassword,
		cacheDir: process.env.RECRUITMENT_CHAIN_CACHE_DIR || resolveDefaultCacheDir(),
	};

	for (let index = 0; index < argv.length; index += 1) {
		const current = argv[index];
		const next = argv[index + 1];

		if ((current === '--base-url' || current === '-u') && next) {
			options.baseUrl = next;
			index += 1;
			continue;
		}
		if ((current === '--username' || current === '-n') && next) {
			options.username = next;
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
  --base-url, -u   Backend base URL, e.g. http://127.0.0.1:8064
  --username, -n   Login username (default: ${defaultUsername})
  --password, -p   Login password (default: ${defaultPassword})
  --cache-dir, -c  Cool cache directory for captcha lookup
  --help, -h       Show this help message
`);
			process.exit(0);
		}
	}

	if (!options.baseUrl) {
		throw new Error(
			'Missing target backend base URL. Pass --base-url URL or set RECRUITMENT_CHAIN_BASE_URL.'
		);
	}

	options.baseUrl = options.baseUrl.replace(/\/+$/, '');
	return options;
}

async function login(reporter, options) {
	const captchaResponse = await requestJson(`${options.baseUrl}/admin/base/open/captcha`);
	if (captchaResponse.body?.code !== successCode) {
		reporter.fail('login captcha', formatResponse(captchaResponse.body));
		return null;
	}

	const captchaId = captchaResponse.body?.data?.captchaId;
	if (!captchaId) {
		reporter.fail('login captcha', 'missing captchaId');
		return null;
	}
	reporter.pass('login captcha', `captchaId=${captchaId}`);

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
			reporter.fail('login', formatResponse(loginResponse.body));
			return null;
		}

		const token = loginResponse.body?.data?.token;
		if (!token) {
			reporter.fail('login', 'login succeeded without token');
			return null;
		}

		const personResponse = await requestJson(`${options.baseUrl}/admin/base/comm/person`, {
			headers: { Authorization: token },
		});
		if (personResponse.body?.code !== successCode) {
			reporter.fail('person', formatResponse(personResponse.body));
			return null;
		}

		const payload = decodeTokenPayload(token);
		const person = personResponse.body?.data || {};
		reporter.pass(
			'login',
			`userId=${payload.userId ?? 'unknown'} departmentId=${person.departmentId ?? 'unknown'}`
		);
		return { token, payload, person };
	} catch (error) {
		reporter.fail('login', error.message);
		return null;
	}
}

function assertCondition(reporter, scope, condition, detail) {
	if (!condition) {
		reporter.fail(scope, detail);
		return false;
	}
	reporter.pass(scope, detail);
	return true;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const reporter = new Reporter();

	console.log('Recruitment center live chain smoke');
	console.log(`Base URL: ${options.baseUrl}`);
	console.log(`Username: ${options.username}`);

	const session = await login(reporter, options);
	if (!session) {
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}

	const targetDepartmentId = Number(session.person?.departmentId || 0);
	const recruiterId = Number(session.payload?.userId || 0);
	if (!Number.isInteger(targetDepartmentId) || targetDepartmentId <= 0) {
		reporter.fail('bootstrap', 'person.departmentId missing or invalid');
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	if (!Number.isInteger(recruiterId) || recruiterId <= 0) {
		reporter.fail('bootstrap', 'token payload.userId missing or invalid');
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}

	const unique = `${Date.now()}`;
	const positionName = `招聘链路联调-${unique}`;
	const candidateName = `候选人-${unique}`;
	const token = session.token;

	const jobStandardResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/add`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				positionName,
				targetDepartmentId,
				jobLevel: 'P6',
				profileSummary: `岗位画像-${unique}`,
				requirementSummary: `任职要求-${unique}`,
				skillTagList: ['Node.js', 'TypeScript'],
				interviewTemplateSummary: `面试模板-${unique}`,
			}),
		}
	);
	if (jobStandardResponse.body?.code !== successCode) {
		reporter.fail('jobStandard:add', formatResponse(jobStandardResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const jobStandard = jobStandardResponse.body.data;
	const jobStandardId = Number(jobStandard?.id || 0);
	assertCondition(reporter, 'jobStandard:add', jobStandardId > 0, `id=${jobStandardId}`);

	const jobStandardActiveResponse = await requestJson(
		`${options.baseUrl}/admin/performance/jobStandard/setStatus`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: jobStandardId,
				status: 'active',
			}),
		}
	);
	if (jobStandardActiveResponse.body?.code !== successCode) {
		reporter.fail('jobStandard:setStatus', formatResponse(jobStandardActiveResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'jobStandard:setStatus',
		jobStandardActiveResponse.body?.data?.status === 'active',
		`status=${jobStandardActiveResponse.body?.data?.status}`
	);

	const recruitPlanResponse = await requestJson(
		`${options.baseUrl}/admin/performance/recruitPlan/add`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				title: `招聘计划-${unique}`,
				targetDepartmentId,
				positionName,
				headcount: 2,
				startDate: '2026-04-20',
				endDate: '2026-05-31',
				recruiterId,
				requirementSummary: `计划要求-${unique}`,
				jobStandardId,
			}),
		}
	);
	if (recruitPlanResponse.body?.code !== successCode) {
		reporter.fail('recruitPlan:add', formatResponse(recruitPlanResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const recruitPlan = recruitPlanResponse.body.data;
	const recruitPlanId = Number(recruitPlan?.id || 0);
	assertCondition(reporter, 'recruitPlan:add', recruitPlanId > 0, `id=${recruitPlanId}`);
	assertCondition(
		reporter,
		'recruitPlan:jobStandardSnapshot',
		Number(recruitPlan?.jobStandardSnapshot?.id || recruitPlan?.jobStandardId || 0) ===
			jobStandardId,
		`jobStandardId=${recruitPlan?.jobStandardId} snapshotId=${recruitPlan?.jobStandardSnapshot?.id}`
	);

	const recruitPlanSubmitResponse = await requestJson(
		`${options.baseUrl}/admin/performance/recruitPlan/submit`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({ id: recruitPlanId }),
		}
	);
	if (recruitPlanSubmitResponse.body?.code !== successCode) {
		reporter.fail('recruitPlan:submit', formatResponse(recruitPlanSubmitResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'recruitPlan:submit',
		recruitPlanSubmitResponse.body?.data?.status === 'active',
		`status=${recruitPlanSubmitResponse.body?.data?.status}`
	);

	const resumeResponse = await requestJson(`${options.baseUrl}/admin/performance/resumePool/add`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			candidateName,
			targetDepartmentId,
			targetPosition: positionName,
			phone: `139${unique.slice(-8)}`,
			email: `candidate.${unique}@example.com`,
			resumeText: `真实联调简历文本-${unique}`,
			sourceType: 'external',
			sourceRemark: `外部推荐-${unique}`,
			externalLink: `https://example.com/resume/${unique}`,
			recruitPlanId,
		}),
	});
	if (resumeResponse.body?.code !== successCode) {
		reporter.fail('resumePool:add', formatResponse(resumeResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const resume = resumeResponse.body.data;
	const resumeId = Number(resume?.id || 0);
	assertCondition(reporter, 'resumePool:add', resumeId > 0, `id=${resumeId}`);
	assertCondition(
		reporter,
		'resumePool:source-chain',
		Number(resume?.recruitPlanId || 0) === recruitPlanId &&
			Number(resume?.jobStandardId || 0) === jobStandardId,
		`recruitPlanId=${resume?.recruitPlanId} jobStandardId=${resume?.jobStandardId}`
	);

	const convertResponse = await requestJson(
		`${options.baseUrl}/admin/performance/resumePool/convertToTalentAsset`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({ id: resumeId }),
		}
	);
	if (convertResponse.body?.code !== successCode) {
		reporter.fail('resumePool:convertToTalentAsset', formatResponse(convertResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const talentAssetId = Number(convertResponse.body?.data?.talentAssetId || 0);
	assertCondition(
		reporter,
		'resumePool:convertToTalentAsset',
		talentAssetId > 0,
		`talentAssetId=${talentAssetId} created=${convertResponse.body?.data?.created}`
	);

	const talentAssetInfoResponse = await requestJson(
		`${options.baseUrl}/admin/performance/talentAsset/info?id=${talentAssetId}`,
		{
			headers: { Authorization: token },
		}
	);
	if (talentAssetInfoResponse.body?.code !== successCode) {
		reporter.fail('talentAsset:info', formatResponse(talentAssetInfoResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'talentAsset:info',
		talentAssetInfoResponse.body?.data?.candidateName === candidateName,
		`candidate=${talentAssetInfoResponse.body?.data?.candidateName}`
	);

	const resumeInfoAfterTalentResponse = await requestJson(
		`${options.baseUrl}/admin/performance/resumePool/info?id=${resumeId}`,
		{
			headers: { Authorization: token },
		}
	);
	if (resumeInfoAfterTalentResponse.body?.code !== successCode) {
		reporter.fail('resumePool:info-after-talent', formatResponse(resumeInfoAfterTalentResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'resumePool:linkedTalentAssetId',
		Number(resumeInfoAfterTalentResponse.body?.data?.linkedTalentAssetId || 0) === talentAssetId,
		`linkedTalentAssetId=${resumeInfoAfterTalentResponse.body?.data?.linkedTalentAssetId}`
	);

	const createInterviewResponse = await requestJson(
		`${options.baseUrl}/admin/performance/resumePool/createInterview`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({ id: resumeId }),
		}
	);
	if (createInterviewResponse.body?.code !== successCode) {
		reporter.fail('resumePool:createInterview', formatResponse(createInterviewResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const interviewId = Number(createInterviewResponse.body?.data?.interviewId || 0);
	assertCondition(
		reporter,
		'resumePool:createInterview',
		interviewId > 0 && createInterviewResponse.body?.data?.status === 'interviewing',
		`interviewId=${interviewId} status=${createInterviewResponse.body?.data?.status}`
	);

	const interviewInfoResponse = await requestJson(
		`${options.baseUrl}/admin/performance/interview/info?id=${interviewId}`,
		{
			headers: { Authorization: token },
		}
	);
	if (interviewInfoResponse.body?.code !== successCode) {
		reporter.fail('interview:info', formatResponse(interviewInfoResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'interview:source-chain',
		Number(interviewInfoResponse.body?.data?.resumePoolId || 0) === resumeId &&
			Number(interviewInfoResponse.body?.data?.recruitPlanId || 0) === recruitPlanId,
		`resumePoolId=${interviewInfoResponse.body?.data?.resumePoolId} recruitPlanId=${interviewInfoResponse.body?.data?.recruitPlanId}`
	);

	const resumeInfoAfterInterviewResponse = await requestJson(
		`${options.baseUrl}/admin/performance/resumePool/info?id=${resumeId}`,
		{
			headers: { Authorization: token },
		}
	);
	if (resumeInfoAfterInterviewResponse.body?.code !== successCode) {
		reporter.fail(
			'resumePool:info-after-interview',
			formatResponse(resumeInfoAfterInterviewResponse.body)
		);
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'resumePool:interviewing-status',
		resumeInfoAfterInterviewResponse.body?.data?.status === 'interviewing' &&
			Number(resumeInfoAfterInterviewResponse.body?.data?.latestInterviewId || 0) === interviewId,
		`status=${resumeInfoAfterInterviewResponse.body?.data?.status} latestInterviewId=${resumeInfoAfterInterviewResponse.body?.data?.latestInterviewId}`
	);

	const hiringResponse = await requestJson(`${options.baseUrl}/admin/performance/hiring/add`, {
		method: 'POST',
		headers: createJsonHeaders(token),
		body: JSON.stringify({
			candidateName,
			targetDepartmentId,
			targetPosition: positionName,
			hiringDecision: `录用决策-${unique}`,
			interviewId,
		}),
	});
	if (hiringResponse.body?.code !== successCode) {
		reporter.fail('hiring:add', formatResponse(hiringResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	const hiring = hiringResponse.body.data;
	const hiringId = Number(hiring?.id || 0);
	assertCondition(reporter, 'hiring:add', hiringId > 0, `id=${hiringId}`);
	assertCondition(
		reporter,
		'hiring:source-chain',
		hiring?.sourceType === 'interview' &&
			Number(hiring?.interviewId || 0) === interviewId &&
			Number(hiring?.resumePoolId || 0) === resumeId &&
			Number(hiring?.recruitPlanId || 0) === recruitPlanId,
		`sourceType=${hiring?.sourceType} interviewId=${hiring?.interviewId} resumePoolId=${hiring?.resumePoolId} recruitPlanId=${hiring?.recruitPlanId}`
	);

	const hiringAcceptedResponse = await requestJson(
		`${options.baseUrl}/admin/performance/hiring/updateStatus`,
		{
			method: 'POST',
			headers: createJsonHeaders(token),
			body: JSON.stringify({
				id: hiringId,
				status: 'accepted',
			}),
		}
	);
	if (hiringAcceptedResponse.body?.code !== successCode) {
		reporter.fail('hiring:updateStatus', formatResponse(hiringAcceptedResponse.body));
		printSummary(reporter);
		process.exitCode = 1;
		return;
	}
	assertCondition(
		reporter,
		'hiring:updateStatus',
		hiringAcceptedResponse.body?.data?.status === 'accepted',
		`status=${hiringAcceptedResponse.body?.data?.status}`
	);

	printSummary(reporter);
	process.exitCode = reporter.hasFailures() ? 1 : 0;
}

await main();
