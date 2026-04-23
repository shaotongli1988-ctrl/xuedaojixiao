/**
 * 角色工作台前端组装服务。
 * 这里只负责消费后端下发的 persona / roleKind / workbench 上下文并组装本地占位快照，
 * 不负责真实后端聚合、权限注册或路由装配。
 * 维护重点是角色归类、SSOT 入口过滤和 persona 展示收敛在这里，静态模板配置统一下沉到 workbench-snapshot-config。
 */
import type {
	WorkbenchPageId,
	WorkbenchRoleInput,
	WorkbenchRoleKey,
	WorkbenchSurfaceAccessKey,
	WorkbenchSnapshot,
	WorkbenchTaskCardModel
} from '../workbench/types';
import {
	buildWorkbenchTemplateSnapshot,
	type WorkbenchTemplateKey
} from './workbench-snapshot-config';
import { resolvePerformanceRoleFact } from './role-fact';

type WorkbenchRouteBinding = {
	pageIds?: WorkbenchPageId[];
	surfaceAccessKeys?: WorkbenchSurfaceAccessKey[];
};

type WorkbenchPersonaPresentation = {
	templateKey: WorkbenchTemplateKey;
	roleKey: WorkbenchRoleKey;
	roleLabel: string;
	profileTags: string[];
};

const WORKBENCH_ROUTE_BINDINGS: Record<string, WorkbenchRouteBinding> = {
	'/performance/my-assessment': {
		pageIds: ['my-assessment'],
		surfaceAccessKeys: ['assessmentMy']
	},
	'/performance/goals': {
		pageIds: ['goal']
	},
	'/performance/feedback': {
		pageIds: ['feedback']
	},
	'/performance/course': {
		pageIds: ['course-learning']
	},
	'/performance/work-plan': {
		pageIds: ['work-plan']
	},
	'/data-center/dashboard': {
		pageIds: ['dashboard'],
		surfaceAccessKeys: ['dashboardSummary', 'dashboardCrossSummary']
	},
	'/performance/salary': {
		pageIds: ['salary']
	},
	'/performance/recruit-plan': {
		pageIds: ['recruit-plan']
	},
	'/performance/resume-pool': {
		pageIds: ['resume-pool']
	},
	'/performance/recruitment-center': {
		pageIds: ['recruit-plan', 'resume-pool']
	}
};

function hasSsotBindings(input: WorkbenchRoleInput) {
	return Array.isArray(input.workbenchPages) || Boolean(input.surfaceAccess);
}

function isCardVisibleBySsot(card: WorkbenchTaskCardModel, input: WorkbenchRoleInput) {
	if (!hasSsotBindings(input)) {
		return true;
	}

	if (!card.path) {
		return true;
	}

	const binding = WORKBENCH_ROUTE_BINDINGS[card.path];
	if (!binding) {
		return false;
	}

	const pageSet = new Set((input.workbenchPages || []).filter(Boolean));
	const hasPageAccess =
		binding.pageIds?.some(pageId => pageSet.has(pageId)) || false;
	const hasSurfaceAccess =
		binding.surfaceAccessKeys?.some(key => input.surfaceAccess?.[key] === true) ||
		false;

	return hasPageAccess || hasSurfaceAccess;
}

function filterSnapshotBySsot(
	snapshot: WorkbenchSnapshot,
	input: WorkbenchRoleInput
): WorkbenchSnapshot {
	if (!hasSsotBindings(input)) {
		return snapshot;
	}

	const sections = snapshot.sections
		.map(section => ({
			...section,
			cards: section.cards.filter(card => isCardVisibleBySsot(card, input))
		}))
		.filter(section => section.cards.length > 0);

	const sectionCardCount = new Map(sections.map(section => [section.key, section.cards.length]));
	const pendingCount = sectionCardCount.get('pending') || 0;
	const mineCount = sectionCardCount.get('mine') || 0;
	const zoneCount = sectionCardCount.get('zone') || 0;
	const shortcutCount = sectionCardCount.get('shortcuts') || 0;
	const riskCount = sectionCardCount.get('risks') || 0;
	const nextStats = snapshot.profile.stats.map(item => ({ ...item }));

	switch (snapshot.profile.roleKey) {
		case 'hr':
			nextStats.forEach(item => {
				if (item.key === 'pending') item.value = pendingCount;
				if (item.key === 'interview') item.value = mineCount;
				if (item.key === 'risk') item.value = riskCount;
				if (item.key === 'ready') item.value = zoneCount + shortcutCount;
			});
			break;
		case 'manager':
			nextStats.forEach(item => {
				if (item.key === 'approval') item.value = pendingCount;
				if (item.key === 'people') item.value = mineCount + zoneCount;
				if (item.key === 'meeting') item.value = shortcutCount;
				if (item.key === 'risk') item.value = riskCount;
			});
			break;
		default:
			nextStats.forEach(item => {
				if (item.key === 'todo') item.value = pendingCount;
				if (item.key === 'learning') item.value = mineCount + zoneCount;
				if (item.key === 'meeting') item.value = shortcutCount;
				if (item.key === 'risk') item.value = riskCount;
			});
			break;
	}

	return {
		...snapshot,
		profile: {
			...snapshot.profile,
			stats: nextStats
		},
		sections
	};
}

function applyPersonaPresentation(
	snapshot: WorkbenchSnapshot,
	presentation: WorkbenchPersonaPresentation
): WorkbenchSnapshot {
	return {
		...snapshot,
		profile: {
			...snapshot.profile,
			roleKey: presentation.roleKey,
			roleLabel: presentation.roleLabel,
			tags: Array.from(new Set([presentation.roleLabel, ...presentation.profileTags]))
		}
	};
}

/**
 * 根据后端 access context 下发的 persona / roleKind 归类工作台占位角色。
 * 当前仍保留 hr / manager / staff 三类 UI 框架，但选择权已经收敛到后端事实源字段。
 */
export function resolveWorkbenchRoleKey(input: WorkbenchRoleInput): WorkbenchRoleKey {
	return resolvePerformanceRoleFact({
		personaKey: input.personaKey || null,
		roleKind: input.roleKind || null
	}).roleKey as WorkbenchRoleKey;
}

function resolveWorkbenchPersonaPresentation(
	input: WorkbenchRoleInput
): WorkbenchPersonaPresentation {
	const fact = resolvePerformanceRoleFact({
		personaKey: input.personaKey || null,
		roleKind: input.roleKind || null
	});

	return {
		templateKey: fact.templateKey as WorkbenchTemplateKey,
		roleKey: fact.roleKey as WorkbenchRoleKey,
		roleLabel: fact.roleLabel,
		profileTags: fact.profileTags
	};
}

function buildWorkbenchSnapshot(input: WorkbenchRoleInput): WorkbenchSnapshot {
	const presentation = resolveWorkbenchPersonaPresentation(input);
	const snapshot = buildWorkbenchTemplateSnapshot(presentation.templateKey, input);

	return filterSnapshotBySsot(applyPersonaPresentation(snapshot, presentation), input);
}

export default class PerformanceWorkbenchService {
	/**
	 * 获取角色工作台占位快照。
	 * 当前阶段返回本地静态数据，后续接真实接口时保持返回结构不变。
	 */
	fetchSnapshot(input: WorkbenchRoleInput) {
		return Promise.resolve(buildWorkbenchSnapshot(input));
	}
}

export const performanceWorkbenchService = new PerformanceWorkbenchService();
