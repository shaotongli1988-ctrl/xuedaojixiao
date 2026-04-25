/* 文件职责：定义驾驶舱页面消费的 ViewModel；不直接绑定后端接口字段。 */

export type DashboardCardTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
export type DashboardEmptyKind = 'loading' | 'no-data' | 'unavailable' | 'no-permission';
export type DashboardStatCardVariant = 'featured' | 'default';

export interface DashboardFilterViewModel {
	periodType: 'month' | 'quarter' | 'year';
	periodValue: string;
	departmentId?: number;
}

export interface DashboardHeroViewModel {
	title: string;
	description: string;
	lastUpdatedLabel: string;
	refreshing: boolean;
	scopeLabel: string;
}

export interface DashboardStatCardViewModel {
	key: string;
	label: string;
	value: string;
	unit?: string;
	helper?: string;
	trend?: string;
	tone: DashboardCardTone;
	variant?: DashboardStatCardVariant;
}

export interface DashboardStageProgressViewModel {
	stageKey: string;
	stageLabel: string;
	completedCount: number;
	totalCount: number;
	completionRate: number;
	sort: number;
	displayText: string;
}

export interface DashboardDepartmentBarViewModel {
	departmentId: number;
	departmentName: string;
	averageScore: number;
	assessmentCount: number;
}

export interface DashboardGradeSliceViewModel {
	grade: string;
	count: number;
	ratio: number;
}

export interface DashboardCrossMetricViewModel {
	metricCode: string;
	metricLabel: string;
	domainLabel: string;
	valueText: string;
	unitText: string;
	periodLabel: string;
	scopeLabel: string;
	statusLabel: string;
	status: 'ready' | 'delayed' | 'unavailable';
	updatedAtLabel: string;
	tone: DashboardCardTone;
}

export interface DashboardPageViewModel {
	hero: DashboardHeroViewModel;
	stats: DashboardStatCardViewModel[];
	stageProgress: DashboardStageProgressViewModel[];
	departmentBars: DashboardDepartmentBarViewModel[];
	gradeSlices: DashboardGradeSliceViewModel[];
	crossMetrics: DashboardCrossMetricViewModel[];
	emptyKind?: DashboardEmptyKind;
	errorMessage?: string;
}
