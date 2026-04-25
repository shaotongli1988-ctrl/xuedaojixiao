/**
 * Performance 角色事实源前端展示解析。
 * 这里只把后端 access context 下发的 persona / roleKind 收敛成稳定的展示语义，
 * 不负责发请求、权限判断或业务数据过滤。
 * 维护重点是页面不能再通过本地权限键去猜测 HR / 主管 / 员工视角。
 */
import type { PerformanceAccessContext } from '../types';

export type PerformanceRoleKind = PerformanceAccessContext['roleKind'];
export type PerformancePersonaKey = PerformanceAccessContext['activePersonaKey'];
export type PerformanceRoleFactKey = 'hr' | 'manager' | 'staff';
export type PerformanceRoleTemplateKey = 'hr' | 'manager' | 'staff' | 'analysis';

type PerformanceRoleFactInput = {
	personaKey?: PerformancePersonaKey | null;
	roleKind?: PerformanceRoleKind | null;
};

export type PerformanceRoleFact = {
	templateKey: PerformanceRoleTemplateKey;
	roleKey: PerformanceRoleFactKey;
	roleLabel: string;
	scopeLabel: string;
	profileTags: string[];
};

export function resolvePerformanceRoleFact(
	input: PerformanceRoleFactInput = {}
): PerformanceRoleFact {
	switch (input.personaKey) {
		case 'org.hrbp':
			return {
				templateKey: 'hr',
				roleKey: 'hr',
				roleLabel: 'HRBP 视角',
				scopeLabel: 'HRBP 组织视角',
				profileTags: ['组织身份', '统一事实源']
			};
		case 'fn.performance_operator':
			return {
				templateKey: 'hr',
				roleKey: 'hr',
				roleLabel: '绩效运营视角',
				scopeLabel: '运营全量视角',
				profileTags: ['职能身份', '统一事实源']
			};
		case 'org.line_manager':
			return {
				templateKey: 'manager',
				roleKey: 'manager',
				roleLabel: '主管视角',
				scopeLabel: '主管范围视角',
				profileTags: ['组织身份', '统一事实源']
			};
		case 'fn.analysis_viewer':
			return {
				templateKey: 'analysis',
				roleKey: 'staff',
				roleLabel: '分析视角',
				scopeLabel: '分析只读视角',
				profileTags: ['职能身份', '统一事实源']
			};
		case 'org.employee':
			return {
				templateKey: 'staff',
				roleKey: 'staff',
				roleLabel: '员工视角',
				scopeLabel: '员工本人视角',
				profileTags: ['组织身份', '统一事实源']
			};
		default:
			break;
	}

	if (input.roleKind === 'hr') {
		return {
			templateKey: 'hr',
			roleKey: 'hr',
			roleLabel: 'HR / 运营视角',
			scopeLabel: 'HR 全量视角',
			profileTags: ['兼容回退', '统一事实源']
		};
	}

	if (input.roleKind === 'manager') {
		return {
			templateKey: 'manager',
			roleKey: 'manager',
			roleLabel: '主管 / 负责人视角',
			scopeLabel: '主管范围视角',
			profileTags: ['兼容回退', '统一事实源']
		};
	}

	return {
		templateKey: 'staff',
		roleKey: 'staff',
		roleLabel: '员工视角',
		scopeLabel: '员工本人视角',
		profileTags: ['兼容回退', '统一事实源']
	};
}
