/**
 * 导航归组规则测试。
 * 场景覆盖：一级域收敛为 5 个、目标&计划承接目标地图、班主任化下沉为二级目录。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import {
	buildMenuGroups,
	normalizeMenuIcon,
	PERFORMANCE_ROOT_PATH
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
			createPage(101, '/data-center/dashboard', '绩效驾驶舱', 1, 'icon-data-board'),
			createPage(102, '/performance/my-assessment', '我的考核', 2, 'icon-user'),
			createPage(103, '/performance/goals', '目标地图', 3, 'icon-data-board'),
			createPage(104, '/performance/recruitment-center', '招聘中心', 4, 'icon-user'),
			createPage(105, '/performance/course', '培训课程管理', 5, 'icon-task'),
			createPage(106, '/performance/teacher-channel/dashboard', '首页看板', 6, 'icon-data-board'),
			createPage(107, '/performance/teacher-channel/teacher', '班主任列表', 7, 'icon-user'),
			createPage(108, '/performance/teacher-channel/todo', '我的待跟进', 8, 'icon-time'),
			createPage(109, '/performance/teacher-channel/class', '班级列表', 9, 'icon-course'),
			createPage(110, '/performance/meeting', '会议管理', 10, 'icon-calendar'),
			createPage(111, '/performance/contract', '合同管理', 11, 'icon-safe'),
			createPage(112, '/performance/purchase-order', '采购订单', 12, 'icon-order'),
			createPage(113, '/performance/purchase-inquiry', '询价管理', 13, 'icon-order'),
			createPage(114, '/performance/purchase-approval', '采购审批', 14, 'icon-order'),
			createPage(115, '/performance/purchase-execution', '订单管理', 15, 'icon-order'),
			createPage(116, '/performance/purchase-receipt', '收货管理', 16, 'icon-order'),
			createPage(117, '/performance/purchase-report', '采购报表', 17, 'icon-data-board'),
			createPage(118, '/performance/supplier', '供应商管理', 18, 'icon-user'),
			createPage(119, '/performance/asset/dashboard', '资产首页', 19, 'icon-set'),
			createPage(120, '/performance/asset/ledger', '资产台账', 20, 'icon-set'),
			createPage(121, '/performance/asset/assignment', '领用归还', 21, 'icon-set'),
			createPage(122, '/performance/asset/maintenance', '维护保养', 22, 'icon-set'),
			createPage(123, '/performance/asset/procurement', '采购入库', 23, 'icon-set'),
			createPage(124, '/performance/asset/transfer', '资产调拨', 24, 'icon-set'),
			createPage(125, '/performance/asset/inventory', '资产盘点', 25, 'icon-set'),
			createPage(126, '/performance/asset/report', '资产报表', 26, 'icon-set'),
			createPage(127, '/performance/asset/depreciation', '折旧管理', 27, 'icon-set'),
			createPage(128, '/performance/asset/disposal', '报废管理', 28, 'icon-set'),
			createPage(129, '/performance/office/annual-inspection', '年检材料', 29, 'icon-safe'),
			createPage(130, '/performance/custom-extra', '自定义页', 30, 'icon-menu')
		]
	};
}

test('navigation grouping keeps exactly five top-level performance domains', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});

	assert.deepEqual(
		grouped.map(item => item.meta?.label || item.name),
		['绩效中心', '人才中心', '目标&计划', '行政协同', '采购&资产']
	);
});

test('goal plan domain keeps goals as overview and teacher channel as nested submenu', () => {
	const grouped = buildMenuGroups([createPerformanceGroup()], {
		isGroupEnabled: true
	});
	const goalPlan = grouped.find(item => item.meta?.label === '目标&计划');
	const teacherChannel = goalPlan.children.find(item => item.meta?.label === '班主任化');
	const overview = goalPlan.children.find(item => item.meta?.label === '目标&计划总览');

	assert.equal(overview.path, '/performance/goals');
	assert.equal(teacherChannel.type, 0);
	assert.deepEqual(
		teacherChannel.children.map(item => item.meta?.label),
		['首页看板', '班主任列表', '我的待跟进', '班级列表']
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
		['领用归还', '维护保养', '资产调拨', '资产盘点', '报废管理']
	);
	assert.equal(assetAnalysis.type, 0);
	assert.deepEqual(
		assetAnalysis.children.map(item => item.meta?.label),
		['资产总览', '资产报表', '折旧管理']
	);
});

test('unmatched performance pages fall back into 绩效中心 instead of creating a sixth domain', () => {
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
