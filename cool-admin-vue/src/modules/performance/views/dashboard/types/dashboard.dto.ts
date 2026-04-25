/* 文件职责：定义绩效驾驶舱请求与响应 DTO；不负责页面展示映射和组件渲染。 */
import type {
	DashboardCrossDataStatus as SsotDashboardCrossDataStatus,
	DashboardCrossMetricCard as SsotDashboardCrossMetricCard,
	DashboardCrossMetricCode as SsotDashboardCrossMetricCode,
	DashboardCrossScopeType as SsotDashboardCrossScopeType,
	DashboardCrossSourceDomain as SsotDashboardCrossSourceDomain,
	DashboardCrossSummary as SsotDashboardCrossSummary,
	DashboardCrossSummaryQuery as SsotDashboardCrossSummaryQuery,
	DashboardDepartmentDistributionItem as SsotDashboardDepartmentDistributionItem,
	DashboardGradeDistributionItem as SsotDashboardGradeDistributionItem,
	DashboardStageProgressItem as SsotDashboardStageProgressItem,
	DashboardSummary as SsotDashboardSummary,
	DashboardSummaryQuery as SsotDashboardSummaryQuery
} from '../../../types';

export type DashboardPeriodType = 'month' | 'quarter' | 'year';
export type DashboardScopeType = SsotDashboardCrossScopeType;
export type DashboardMetricStatus = SsotDashboardCrossDataStatus;

export type DashboardSummaryQueryDto = Omit<
	SsotDashboardSummaryQuery,
	'periodType' | 'periodValue'
> & {
	periodType: DashboardPeriodType;
	periodValue: string;
};

export type DashboardCrossMetricCode = SsotDashboardCrossMetricCode;

export type DashboardCrossSummaryQueryDto = Omit<
	SsotDashboardCrossSummaryQuery,
	'periodType' | 'periodValue'
> & {
	periodType: DashboardPeriodType;
	periodValue: string;
};

export type DashboardSummaryResponseDto = SsotDashboardSummary & {
	updatedAt?: string | null;
};

export type DashboardStageProgressItemDto = SsotDashboardStageProgressItem;

export type DashboardDepartmentDistributionItemDto = SsotDashboardDepartmentDistributionItem;

export type DashboardGradeDistributionItemDto = SsotDashboardGradeDistributionItem;

export type DashboardCrossSummaryResponseDto = Omit<SsotDashboardCrossSummary, 'metricCards'> & {
	metricCards: DashboardCrossMetricCardDto[];
};

export type DashboardCrossMetricCardDto = Omit<
	SsotDashboardCrossMetricCard,
	| 'metricCode'
	| 'sourceDomain'
	| 'metricValue'
	| 'periodType'
	| 'scopeType'
	| 'departmentId'
	| 'updatedAt'
> & {
	metricCode: DashboardCrossMetricCode | string;
	sourceDomain: SsotDashboardCrossSourceDomain | string;
	metricValue: number | null;
	periodType: DashboardPeriodType | string;
	scopeType: DashboardScopeType | string;
	departmentId: number | null;
	updatedAt: string | null;
};
