/**
 * 角色工作台占位服务测试。
 * 场景覆盖：角色归类、默认 fallback、边界优先级和工作台卡片路径必须指向既有菜单路由。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const servicePath = new URL('../src/modules/performance/service/workbench.ts', import.meta.url);
const snapshotConfigPath = new URL(
	'../src/modules/performance/service/workbench-snapshot-config.ts',
	import.meta.url
);
const roleFactPath = new URL('../src/modules/performance/service/role-fact.ts', import.meta.url);
const workbenchPagePath = new URL(
	'../src/modules/performance/views/workbench/index.vue',
	import.meta.url
);
const purchaseReportPagePath = new URL(
	'../src/modules/performance/views/purchase-report/index.vue',
	import.meta.url
);
const purchaseWorkspacePagePath = new URL(
	'../src/modules/performance/views/purchase-order/workspace.vue',
	import.meta.url
);
const goalsPagePath = new URL('../src/modules/performance/views/goals/index.vue', import.meta.url);
const capabilityPagePath = new URL(
	'../src/modules/performance/views/capability/index.vue',
	import.meta.url
);
const coursePagePath = new URL(
	'../src/modules/performance/views/course/index.vue',
	import.meta.url
);
const certificatePagePath = new URL(
	'../src/modules/performance/views/certificate/index.vue',
	import.meta.url
);
const jobStandardPagePath = new URL(
	'../src/modules/performance/views/job-standard/index.vue',
	import.meta.url
);
const supplierPagePath = new URL(
	'../src/modules/performance/views/supplier/index.vue',
	import.meta.url
);
const officeDocumentCenterPagePath = new URL(
	'../src/modules/performance/views/office/documentCenter.vue',
	import.meta.url
);
const officeKnowledgeBasePagePath = new URL(
	'../src/modules/performance/views/office/knowledgeBase.vue',
	import.meta.url
);
const officeLedgerPagePath = new URL(
	'../src/modules/performance/views/office/office-ledger-page.vue',
	import.meta.url
);
const salaryPagePath = new URL(
	'../src/modules/performance/views/salary/index.vue',
	import.meta.url
);
const teacherChannelDashboardPagePath = new URL(
	'../src/modules/performance/views/teacher-channel/dashboard.vue',
	import.meta.url
);
const teacherChannelTeacherListPagePath = new URL(
	'../src/modules/performance/views/teacher-channel/teacher-list.vue',
	import.meta.url
);
const permissionOverlayPath = new URL(
	'../src/modules/performance/components/permission-overlay.vue',
	import.meta.url
);
const officeLedgerConfigPath = new URL(
	'../src/modules/performance/views/office/office-ledger-config.ts',
	import.meta.url
);
const menuStorePath = new URL('../src/modules/base/store/menu.ts', import.meta.url);
const loginPagePath = new URL('../src/modules/base/pages/login/index.vue', import.meta.url);
const processComponentPath = new URL(
	'../src/modules/base/pages/main/components/process.vue',
	import.meta.url
);
const menuPath = new URL('../../cool-admin-midway/src/modules/base/menu.json', import.meta.url);

let workbenchModulePromise;

function transpileSource(source) {
	return ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.ES2022,
			target: ts.ScriptTarget.ES2022
		}
	}).outputText;
}

async function loadWorkbenchModule() {
	if (!workbenchModulePromise) {
		workbenchModulePromise = Promise.all([
			readFile(servicePath, 'utf8'),
			readFile(snapshotConfigPath, 'utf8'),
			readFile(roleFactPath, 'utf8')
		]).then(([serviceSource, snapshotConfigSource, roleFactSource]) => {
			const snapshotConfigModuleUrl = `data:text/javascript;base64,${Buffer.from(
				transpileSource(snapshotConfigSource)
			).toString('base64')}`;
			const roleFactModuleUrl = `data:text/javascript;base64,${Buffer.from(
				transpileSource(roleFactSource)
			).toString('base64')}`;
			const transpiled = transpileSource(serviceSource)
				.replace("'./workbench-snapshot-config'", `'${snapshotConfigModuleUrl}'`)
				.replace("'./role-fact'", `'${roleFactModuleUrl}'`);

			return import(
				`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
			);
		});
	}

	return workbenchModulePromise;
}

async function loadMenuPaths() {
	const menuSource = await readFile(menuPath, 'utf8');
	const menu = JSON.parse(menuSource);
	const paths = new Set();

	(function walk(items) {
		for (const item of items || []) {
			if (item.router) {
				paths.add(item.router);
			}

			walk(item.childMenus);
		}
	})(menu);

	return paths;
}

test('normal path manager role resolves from backend role kind', async () => {
	const { resolveWorkbenchRoleKey } = await loadWorkbenchModule();

	assert.equal(
		resolveWorkbenchRoleKey({
			roleKind: 'manager'
		}),
		'manager'
	);
});

test('error path fallback keeps unknown role on staff snapshot with default labels', async () => {
	const { performanceWorkbenchService } = await loadWorkbenchModule();

	const snapshot = await performanceWorkbenchService.fetchSnapshot({});

	assert.equal(snapshot.profile.roleKey, 'staff');
	assert.equal(snapshot.profile.name, '当前用户');
	assert.equal(snapshot.profile.departmentName, '当前部门');
	assert.equal(snapshot.sections.length, 5);
});

test('boundary path persona key wins over conflicting backend role kind', async () => {
	const { resolveWorkbenchRoleKey } = await loadWorkbenchModule();

	assert.equal(
		resolveWorkbenchRoleKey({
			personaKey: 'org.hrbp',
			roleKind: 'manager'
		}),
		'hr'
	);
});

test('persona key from backend context overrides local role-name guessing', async () => {
	const { resolveWorkbenchRoleKey } = await loadWorkbenchModule();

	assert.equal(
		resolveWorkbenchRoleKey({
			roleKind: 'employee',
			personaKey: 'org.hrbp'
		}),
		'hr'
	);
});

test('permission signal guard keeps shared goal page out of manager-only role inference', async () => {
	const workbenchPageSource = await readFile(workbenchPagePath, 'utf8');

	assert.equal(workbenchPageSource.includes('performanceGoalService.permission.page'), false);
	assert.equal(
		workbenchPageSource.includes('performanceAssessmentService.permission.pendingPage'),
		false
	);
	assert.equal(
		workbenchPageSource.includes('performanceAccessContextService.fetchContext'),
		true
	);
	assert.equal(
		workbenchPageSource.includes('performanceAccessContextService.saveActivePersonaKey'),
		true
	);
});

test('generated workbench card paths stay inside existing menu routes', async () => {
	const [{ performanceWorkbenchService }, menuPaths] = await Promise.all([
		loadWorkbenchModule(),
		loadMenuPaths()
	]);
	const snapshots = await Promise.all([
		performanceWorkbenchService.fetchSnapshot({ roleKind: 'employee' }),
		performanceWorkbenchService.fetchSnapshot({ roleKind: 'manager' }),
		performanceWorkbenchService.fetchSnapshot({ roleKind: 'hr' })
	]);

	const missingPaths = snapshots
		.flatMap(snapshot => snapshot.sections)
		.flatMap(section => section.cards)
		.map(card => card.path)
		.filter(Boolean)
		.filter(path => !menuPaths.has(path));

	assert.deepEqual(missingPaths, []);
});

test('ssot workbench page bindings hide cards outside backend-provided entry set', async () => {
	const { performanceWorkbenchService } = await loadWorkbenchModule();

	const snapshot = await performanceWorkbenchService.fetchSnapshot({
		roleKind: 'manager',
		workbenchPages: ['goal', 'feedback', 'dashboard'],
		surfaceAccess: {
			workbench: true,
			dashboardSummary: true
		}
	});

	const paths = snapshot.sections.flatMap(section => section.cards).map(card => card.path);

	assert.deepEqual(paths.includes('/performance/meeting'), false);
	assert.deepEqual(paths.includes('/performance/promotion'), false);
	assert.deepEqual(paths.includes('/performance/pip'), false);
	assert.deepEqual(paths.includes('/performance/capability'), false);
	assert.deepEqual(paths.includes('/performance/course'), false);
	assert.deepEqual(paths.includes('/performance/certificate'), false);
	assert.deepEqual(paths.includes('/performance/goals'), true);
	assert.deepEqual(paths.includes('/performance/feedback'), true);
	assert.deepEqual(paths.includes('/data-center/dashboard'), true);
});

test('persona-specific snapshot presentation uses backend persona as the template selector', async () => {
	const { performanceWorkbenchService } = await loadWorkbenchModule();

	const [hrbpSnapshot, operatorSnapshot, analysisSnapshot] = await Promise.all([
		performanceWorkbenchService.fetchSnapshot({
			personaKey: 'org.hrbp',
			roleKind: 'hr'
		}),
		performanceWorkbenchService.fetchSnapshot({
			personaKey: 'fn.performance_operator',
			roleKind: 'hr'
		}),
		performanceWorkbenchService.fetchSnapshot({
			personaKey: 'fn.analysis_viewer',
			roleKind: 'readonly',
			workbenchPages: ['dashboard'],
			surfaceAccess: {
				workbench: true,
				dashboardSummary: true
			}
		})
	]);

	assert.equal(hrbpSnapshot.profile.roleLabel, 'HRBP 视角');
	assert.equal(operatorSnapshot.profile.roleLabel, '绩效运营视角');
	assert.equal(analysisSnapshot.profile.roleLabel, '分析视角');
	assert.deepEqual(
		analysisSnapshot.sections.flatMap(section => section.cards).map(card => card.path),
		['/data-center/dashboard', '/data-center/dashboard']
	);
});

test('shared role fact keeps persona-specific labels aligned with the backend fact source', async () => {
	const roleFactSource = await readFile(roleFactPath, 'utf8');
	const { resolvePerformanceRoleFact } = await import(
		`data:text/javascript;base64,${Buffer.from(transpileSource(roleFactSource)).toString('base64')}`
	);

	assert.equal(
		resolvePerformanceRoleFact({
			personaKey: 'org.hrbp',
			roleKind: 'manager'
		}).roleLabel,
		'HRBP 视角'
	);
	assert.equal(
		resolvePerformanceRoleFact({
			personaKey: 'fn.analysis_viewer',
			roleKind: 'readonly'
		}).scopeLabel,
		'分析只读视角'
	);
	assert.equal(
		resolvePerformanceRoleFact({
			roleKind: 'manager'
		}).scopeLabel,
		'主管范围视角'
	);
});

test('home entry points prioritize role workbench before falling back to other pages', async () => {
	const [menuStoreSource, loginPageSource, processComponentSource] = await Promise.all([
		readFile(menuStorePath, 'utf8'),
		readFile(loginPagePath, 'utf8'),
		readFile(processComponentPath, 'utf8')
	]);

	assert.equal(
		menuStoreSource.includes("const HOME_ROUTE_PRIORITY = ['/performance/workbench'];"),
		true
	);
	assert.equal(loginPageSource.includes("router.push('/performance/workbench')"), true);
	assert.equal(processComponentSource.includes("router.push('/performance/workbench')"), true);
});

test('workbench page passes backend workbench context into local snapshot builder', async () => {
	const workbenchPageSource = await readFile(workbenchPagePath, 'utf8');

	assert.equal(
		workbenchPageSource.includes(
			'workbenchPages: (context.workbenchPages || []) as WorkbenchPageId[]'
		),
		true
	);
	assert.equal(workbenchPageSource.includes('surfaceAccess: context.surfaceAccess || {}'), true);
});

test('purchase pages consume access context instead of guessing hr role from supplier permissions', async () => {
	const [purchaseReportSource, purchaseWorkspaceSource] = await Promise.all([
		readFile(purchaseReportPagePath, 'utf8'),
		readFile(purchaseWorkspacePagePath, 'utf8')
	]);

	assert.equal(
		purchaseReportSource.includes('performanceAccessContextService.fetchContext'),
		true
	);
	assert.equal(
		purchaseWorkspaceSource.includes('performanceAccessContextService.fetchContext'),
		true
	);
	assert.equal(
		purchaseReportSource.includes('checkPerm(performanceSupplierService.permission.add)'),
		false
	);
	assert.equal(
		purchaseWorkspaceSource.includes('checkPerm(performanceSupplierService.permission.add)'),
		false
	);
});

test('goal ops page consumes scopeKey instead of legacy isHr aliases', async () => {
	const goalsPageSource = await readFile(goalsPagePath, 'utf8');

	assert.equal(
		goalsPageSource.includes(
			"const hasCompanyGoalScope = computed(() => accessProfile.scopeKey === 'company')"
		),
		true
	);
	assert.equal(
		goalsPageSource.includes('const isHrRole = computed(() => accessProfile.isHr)'),
		false
	);
	assert.equal(goalsPageSource.includes('result.isHr'), false);
});

test('capability course certificate job-standard and supplier pages consume shared role fact for role labels', async () => {
	const pageSources = await Promise.all([
		readFile(capabilityPagePath, 'utf8'),
		readFile(coursePagePath, 'utf8'),
		readFile(certificatePagePath, 'utf8'),
		readFile(jobStandardPagePath, 'utf8'),
		readFile(supplierPagePath, 'utf8')
	]);

	for (const source of pageSources) {
		assert.equal(source.includes('performanceAccessContextService.fetchContext'), true);
		assert.equal(source.includes('resolvePerformanceRoleFact'), true);
		assert.equal(source.includes("isReadOnlyRole ? '经理只读' : 'HR 管理'"), false);
	}

	assert.equal(
		pageSources[3].includes(
			'title="当前账号为经理只读角色，仅可查看本人部门树范围内摘要字段。"'
		),
		false
	);
	assert.equal(
		pageSources[4].includes(
			'title="当前账号为经理只读角色，敏感字段仅展示后端返回的脱敏摘要。"'
		),
		false
	);
});

test('office pages consume shared role fact instead of fixed hr admin labels', async () => {
	const [documentCenterSource, knowledgeBaseSource, officeLedgerPageSource] = await Promise.all([
		readFile(officeDocumentCenterPagePath, 'utf8'),
		readFile(officeKnowledgeBasePagePath, 'utf8'),
		readFile(officeLedgerPagePath, 'utf8')
	]);

	for (const source of [documentCenterSource, knowledgeBaseSource, officeLedgerPageSource]) {
		assert.equal(source.includes('performanceAccessContextService.fetchContext'), true);
		assert.equal(source.includes('resolvePerformanceRoleFact'), true);
	}

	assert.equal(
		documentCenterSource.includes('<el-tag effect="plain" type="info">HR 管理员</el-tag>'),
		false
	);
	assert.equal(
		knowledgeBaseSource.includes('<el-tag effect="plain" type="info">HR 管理员</el-tag>'),
		false
	);
	assert.equal(officeLedgerPageSource.includes('{{ config.audienceLabel }}'), false);
});

test('salary page consumes shared role fact instead of fixed hr-only copy', async () => {
	const salaryPageSource = await readFile(salaryPagePath, 'utf8');

	assert.equal(salaryPageSource.includes('performanceAccessContextService.fetchContext'), true);
	assert.equal(salaryPageSource.includes('resolvePerformanceRoleFact'), true);
	assert.equal(salaryPageSource.includes('<el-tag effect="plain">仅 HR 可见</el-tag>'), false);
	assert.equal(salaryPageSource.includes('sub-title="薪资管理仅对 HR 管理员开放。"'), false);
});

test('teacher-channel pages show ssot role tag separately from readonly capability tag', async () => {
	const [dashboardSource, teacherListSource] = await Promise.all([
		readFile(teacherChannelDashboardPagePath, 'utf8'),
		readFile(teacherChannelTeacherListPagePath, 'utf8')
	]);

	for (const source of [dashboardSource, teacherListSource]) {
		assert.equal(source.includes('performanceAccessContextService.fetchContext'), true);
		assert.equal(source.includes('resolvePerformanceRoleFact'), true);
		assert.equal(source.includes('{{ roleFact.roleLabel }}'), true);
	}

	assert.equal(
		dashboardSource.includes("{{ isReadOnlyRole ? '只读账号' : '可执行写动作' }}"),
		false
	);
	assert.equal(
		teacherListSource.includes("{{ isReadOnlyRole ? '只读账号' : '主链可操作' }}"),
		false
	);
	assert.equal(dashboardSource.includes("isReadOnlyRole.value ? '只读能力' : '可写能力'"), true);
	assert.equal(
		teacherListSource.includes("isReadOnlyRole.value ? '只读能力' : '可写能力'"),
		true
	);
});

test('shared permission overlay and office config avoid stale role-account copy', async () => {
	const [permissionOverlaySource, officeLedgerConfigSource, officeLedgerPageSource] =
		await Promise.all([
			readFile(permissionOverlayPath, 'utf8'),
			readFile(officeLedgerConfigPath, 'utf8'),
			readFile(officeLedgerPagePath, 'utf8')
		]);

	assert.equal(
		permissionOverlaySource.includes(
			"const readonlyText = profile.isReadonly ? '只读账号' : '可写账号';"
		),
		false
	);
	assert.equal(
		permissionOverlaySource.includes(
			"const readonlyText = profile.isReadonly ? '只读能力' : '可写能力';"
		),
		true
	);
	assert.equal(officeLedgerConfigSource.includes("audienceLabel: 'HR 管理员'"), false);
	assert.equal(officeLedgerPageSource.includes('audienceLabel: string;'), false);
});
