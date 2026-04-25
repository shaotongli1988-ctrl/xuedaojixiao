/**
 * 角色工作台前端局部类型。
 * 这里只定义 Phase 1 壳层渲染需要的角色、区块和统一任务卡模型，
 * 不负责后端接口契约、菜单权限注册或真实聚合口径。
 */
export type WorkbenchRoleKey = 'hr' | 'manager' | 'staff';
export type WorkbenchPageId =
	| 'my-assessment'
	| 'pending-approval'
	| 'goal'
	| 'feedback'
	| 'course-learning'
	| 'dashboard'
	| 'work-plan'
	| 'initiated'
	| 'salary'
	| 'indicator-library'
	| 'recruit-plan'
	| 'resume-pool';
export type WorkbenchSurfaceAccessKey =
	| 'workbench'
	| 'assessmentMy'
	| 'assessmentInitiated'
	| 'assessmentPending'
	| 'approvalConfig'
	| 'approvalInstance'
	| 'dashboardSummary'
	| 'dashboardCrossSummary';
export type WorkbenchPersonaKey =
	| 'org.employee'
	| 'org.line_manager'
	| 'org.hrbp'
	| 'fn.performance_operator'
	| 'fn.analysis_viewer';

export type WorkbenchSectionKey = 'pending' | 'mine' | 'zone' | 'shortcuts' | 'risks';

export type WorkbenchCardTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface WorkbenchRoleInput {
	userName?: string;
	departmentName?: string;
	personaKey?: WorkbenchPersonaKey | null;
	roleKind?: 'employee' | 'manager' | 'hr' | 'readonly' | 'unsupported' | null;
	workbenchPages?: WorkbenchPageId[];
	surfaceAccess?: Partial<Record<WorkbenchSurfaceAccessKey, boolean>>;
}

export interface WorkbenchHeroStat {
	key: string;
	label: string;
	value: number | string;
	hint: string;
}

export interface WorkbenchTaskMetric {
	label: string;
	value: string;
}

export interface WorkbenchTaskCardModel {
	id: string;
	title: string;
	description: string;
	badge?: string;
	tone?: WorkbenchCardTone;
	count?: number | string;
	countLabel?: string;
	statusText?: string;
	actionText?: string;
	path?: string;
	query?: Record<
		string,
		string | number | null | undefined | Array<string | number | null | undefined>
	>;
	tags?: string[];
	metrics?: WorkbenchTaskMetric[];
}

export interface WorkbenchSectionModel {
	key: WorkbenchSectionKey;
	title: string;
	description: string;
	tip: string;
	cards: WorkbenchTaskCardModel[];
}

export interface WorkbenchProfile {
	roleKey: WorkbenchRoleKey;
	roleLabel: string;
	name: string;
	departmentName: string;
	welcomeText: string;
	description: string;
	tags: string[];
	stats: WorkbenchHeroStat[];
}

export interface WorkbenchSnapshot {
	profile: WorkbenchProfile;
	sections: WorkbenchSectionModel[];
}
