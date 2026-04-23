/**
 * 导航归组规则测试。
 * 场景覆盖：一级域收敛结构、工作台并列入口、目标&计划承接目标地图、班主任化下沉为二级目录。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import {
	buildMenuGroups,
	normalizeMenuIcon,
	PERFORMANCE_ROOT_PATH,
	SYSTEM_ROOT_PATH
} from '../src/modules/base/store/menu-grouping.js';

function createPage(id, path, name, orderNum, icon = 'icon-menu') {
	return {
		id,
		parentId: 1,
		path,
		router: path,
		type: 1,
		name,
		icon,
		orderNum,
		isShow: true,
		meta: {
			label: name
		},
		children: []
	};
}

function createPerformanceGroup() {
	return {
		id: 1,
		parentId: 0,
		path: PERFORMANCE_ROOT_PATH,
		type: 0,
		name: '绩效中心',
		icon: 'icon-community',
		orderNum: 1,
		isShow: true,
		meta: {
			label: '绩效中心'
		},
		children: [
			createPage(101, '/performance/workbench', '角色工作台', 1, 'icon-workbench'),
			createPage(102, '/performance/work-plan', '工作计划', 2, 'icon-calendar'),
			createPage(103, '/data-center/dashboard', '绩效驾驶舱', 3, 'icon-data-board'),
			createPage(104, '/performance/my-assessment', '我的考核', 4, 'icon-user'),
			createPage(105, '/performance/goals', '目标地图', 5, 'icon-data-board'),
			createPage(106, '/performance/recruitment-center', '招聘中心', 6, 'icon-user'),
			createPage(107, '/performance/course', '培训课程管理', 7, 'icon-task'),
			createPage(108, '/performance/teacher-channel/dashboard', '首页看板', 8, 'icon-data-board'),
			createPage(109, '/performance/teacher-channel/teacher', '班主任列表', 9, 'icon-user'),
			createPage(110, '/performance/teacher-channel/todo', '我的待跟进', 10, 'icon-time'),
			createPage(111, '/performance/teacher-channel/class', '班级列表', 11, 'icon-course'),
			createPage(112, '/performance/meeting', '会议管理', 12, 'icon-calendar'),
			createPage(113, '/performance/contract', '合同管理', 13, 'icon-safe'),
			createPage(114, '/performance/purchase-order', '采购订单', 14, 'icon-order'),
			createPage(115, '/performance/purchase-inquiry', '询价管理', 15, 'icon-order'),
			createPage(116, '/performance/purchase-approval', '采购审批', 16, 'icon-order'),
			createPage(117, '/performance/purchase-execution', '订单管理', 17, 'icon-order'),
			createPage(118, '/performance/purchase-receipt', '收货管理', 18, 'icon-order'),
			createPage(119, '/performance/purchase-report', '采购报表', 19, 'icon-data-board'),
			createPage(120, '/performance/supplier', '供应商管理', 20, 'icon-user'),
			createPage(121, '/performance/asset/dashboard', '资产首页', 21, 'icon-set'),
			createPage(122, '/performance/asset/ledger', '资产台账', 22, 'icon-set'),
			createPage(123, '/performance/asset/assignment', '资产作业', 23, 'icon-set'),
			createPage(124, '/performance/asset/maintenance', '维护保养', 24, 'icon-set'),
			createPage(125, '/performance/asset/procurement', '采购入库', 25, 'icon-set'),
			createPage(126, '/performance/asset/transfer', '资产调拨', 26, 'icon-set'),
			createPage(127, '/performance/asset/inventory', '资产盘点', 27, 'icon-set'),
			createPage(128, '/performance/asset/report', '资产报表', 28, 'icon-set'),
			createPage(129, '/performance/asset/depreciation', '折旧管理', 29, 'icon-set'),
			createPage(130, '/performance/asset/disposal', '报废管理', 30, 'icon-set'),
			createPage(131, '/performance/office/annual-inspection', '年检材料', 31, 'icon-safe'),
			createPage(132, '/performance/custom-extra', '自定义页', 32, 'icon-menu')
		]
	};
}

function createGenericGroup(id, path, name, orderNum, children = []) {
	return {
		id,
		parentId: 0,
		path,
		router: path,
		type: 0,
		name,
		icon: 'icon-set',
		orderNum,
		isShow: true,
		meta: {
			label: name
		},
		children
	};
}

test('navigation grouping keeps 工作台 inside 绩效中心 and places it before dashboard entries', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});
	const performance = grouped.find(item => item.meta?.label === '绩效中心');

	assert.deepEqual(
		grouped.map(item => item.meta?.label || item.name),
		['绩效中心', '人才中心', '目标&计划', '行政协同', '采购&资产']
	);
	assert.deepEqual(
		performance.children.slice(0, 3).map(item => item.meta?.label),
		['角色工作台', '绩效驾驶舱', '我的考核']
	);
});

test('goal plan domain keeps work plan and goals together while teacher channel stays nested', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});
	const goalPlan = grouped.find(item => item.meta?.label === '目标&计划');
	const workPlan = goalPlan.children.find(item => item.meta?.label === '工作计划');
	const teacherChannel = goalPlan.children.find(item => item.meta?.label === '班主任化');
	const overview = goalPlan.children.find(item => item.meta?.label === '目标&计划总览');

	assert.equal(workPlan.path, '/performance/work-plan');
	assert.equal(overview.path, '/performance/goals');
	assert.deepEqual(
		goalPlan.children.map(item => item.meta?.label),
		['工作计划', '目标&计划总览', '班主任化']
	);
	assert.equal(teacherChannel.type, 0);
	assert.deepEqual(
		teacherChannel.children.map(item => item.meta?.label),
		['首页看板', '班主任列表', '我的待跟进', '班级列表']
	);
});

test('goal plan domain drops hidden teacher channel pages from grouped navigation', () => {
	const performanceGroup = createPerformanceGroup();
	performanceGroup.children = performanceGroup.children.map(item => {
		if (
			item.path === '/performance/teacher-channel/dashboard' ||
			item.path === '/performance/teacher-channel/todo'
		) {
			return {
				...item,
				isShow: false
			};
		}

		return item;
	});

	const grouped = buildMenuGroups([performanceGroup], {
		isGroupEnabled: true
	});
	const goalPlan = grouped.find(item => item.meta?.label === '目标&计划');
	const teacherChannel = goalPlan.children.find(item => item.meta?.label === '班主任化');

	assert.deepEqual(
		teacherChannel.children.map(item => item.meta?.label),
		['班主任列表', '班级列表']
	);
});

test('procurement asset domain keeps six core entries while preserving old routes inside nested groups', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});
	const procurementAsset = grouped.find(item => item.meta?.label === '采购&资产');
	const procurementWorkspace = procurementAsset.children.find(
		item => item.meta?.label === '采购工作台'
	);
	const assetOperations = procurementAsset.children.find(item => item.meta?.label === '资产作业');
	const assetAnalysis = procurementAsset.children.find(item => item.meta?.label === '资产分析');

	assert.deepEqual(
		procurementAsset.children.map(item => item.meta?.label),
		['采购工作台', '供应商管理', '采购转资产', '资产台账', '资产作业', '资产分析']
	);
	assert.equal(procurementWorkspace.type, 0);
	assert.deepEqual(
		procurementWorkspace.children.map(item => item.meta?.label),
		['采购订单', '询价管理', '采购审批', '订单管理', '收货管理', '采购报表']
	);
	assert.equal(assetOperations.type, 0);
	assert.deepEqual(
		assetOperations.children.map(item => item.meta?.label),
		['资产作业', '维护保养', '资产调拨', '资产盘点', '报废管理']
	);
	assert.equal(assetAnalysis.type, 0);
	assert.deepEqual(
		assetAnalysis.children.map(item => item.meta?.label),
		['资产总览', '资产报表', '折旧管理']
	);
});

test('unmatched performance pages fall back into 绩效中心 without changing the approved six-domain layout', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});
	const performance = grouped.find(item => item.meta?.label === '绩效中心');

	assert.equal(
		performance.children.some(item => item.path === '/performance/custom-extra'),
		true
	);
	assert.equal(grouped.length, 5);
});

test('duplicate top-level performance roots are collapsed into one grouped navigation set', () => {
	const legacyPerformanceGroup = createPerformanceGroup();
	legacyPerformanceGroup.id = 99;
	legacyPerformanceGroup.children = [
		createPage(9901, '/performance/recruitment-center', '招聘中心', 1, 'icon-user'),
		createPage(9902, '/performance/meeting', '会议管理', 2, 'icon-calendar'),
		createPage(9903, '/performance/purchase-order', '采购订单', 3, 'icon-order')
	];

	const grouped = buildMenuGroups([createPerformanceGroup(), legacyPerformanceGroup], {
		isGroupEnabled: true
	});

	assert.deepEqual(
		grouped.map(item => item.meta?.label || item.name),
		['绩效中心', '人才中心', '目标&计划', '行政协同', '采购&资产']
	);
	assert.equal(
		grouped.filter(item => item.meta?.label === '绩效中心').length,
		1
	);

	const talent = grouped.find(item => item.meta?.label === '人才中心');
	const office = grouped.find(item => item.meta?.label === '行政协同');
	const procurement = grouped.find(item => item.meta?.label === '采购&资产');

	assert.equal(
		talent.children.some(item => item.path === '/performance/recruitment-center'),
		true
	);
	assert.equal(
		office.children.some(item => item.path === '/performance/meeting'),
		true
	);
	assert.equal(
		procurement.children.some(item => item.meta?.label === '采购工作台'),
		true
	);
});

test('management modules collapse into a single 系统管理 group', () => {
	const grouped = buildMenuGroups(
		[
			createPerformanceGroup(),
			createGenericGroup(2, '/sys', '系统管理', 2, [createPage(201, '/sys/role', '权限管理', 1)]),
			createGenericGroup(3, '/tutorial', '框架教程', 3, [createPage(301, '/tutorial/demo', '示例', 1)]),
			createGenericGroup(4, '/common', '通用', 4, [createPage(401, '/common/directive', '指令', 1)]),
			createGenericGroup(5, '/data', '数据管理', 5, [createPage(501, '/dict/info', '字典管理', 1)]),
			createGenericGroup(6, '/user', '用户管理', 6, [createPage(601, '/user/list', '用户列表', 1)]),
			createGenericGroup(7, '/plugin', '扩展管理', 7, [createPage(701, '/plugin/list', '插件列表', 1)])
		],
		{
			isGroupEnabled: true
		}
	);

	assert.deepEqual(
		grouped.map(item => item.meta?.label || item.name),
		['绩效中心', '人才中心', '目标&计划', '行政协同', '采购&资产', '系统管理']
	);

	const system = grouped.find(item => item.path === SYSTEM_ROOT_PATH);

	assert.equal(system.meta?.label, '系统管理');
	assert.deepEqual(
		system.children.map(item => item.meta?.label || item.name),
		['系统管理', '框架教程', '通用', '数据管理', '用户管理', '扩展管理']
	);
});

test('normalizeMenuIcon maps unavailable aliases to existing local icons', () => {
	assert.equal(normalizeMenuIcon('icon-folder-opened'), 'icon-folder');
	assert.equal(normalizeMenuIcon('icon-ppt'), 'icon-ppt');
	assert.equal(normalizeMenuIcon('icon-user-filled'), 'icon-user');
	assert.equal(normalizeMenuIcon(undefined), 'icon-menu');
});

test('all performance menu page icons resolve to existing base svg assets', async () => {
	const menuPath = new URL('../src/modules/base/../../../../cool-admin-midway/src/modules/base/menu.json', import.meta.url);
	const svgDir = new URL('../src/modules/base/static/svg/', import.meta.url);
	const [menuSource, svgFiles] = await Promise.all([
		readFile(menuPath, 'utf8'),
		readdir(svgDir)
	]);
	const svgNames = new Set(svgFiles.map(name => name.replace(/\.svg$/, '')));
	const performancePages = [];

	function walk(items) {
		for (const item of items || []) {
			const children = item.childMenus || item.children || [];
			if (item.type === 1 && item.router?.startsWith('/performance/')) {
				performancePages.push(item);
			}
			walk(children);
		}
	}

	walk(JSON.parse(menuSource));

	const missingIcons = performancePages
		.map(item => ({
			name: item.name,
			route: item.router,
			icon: item.icon,
			normalizedIcon: normalizeMenuIcon(item.icon)
		}))
		.filter(item => !svgNames.has(item.normalizedIcon));

	assert.deepEqual(missingIcons, []);
});
