/* 文件职责：将驾驶舱 DTO 映射为页面 ViewModel；不负责请求、副作用和组件渲染。 */

import dayjs from 'dayjs';
import type {
	DashboardCrossMetricCardDto,
	DashboardCrossSummaryResponseDto,
	DashboardSummaryResponseDto
} from './dashboard.dto';
import type {
	DashboardCardTone,
	DashboardCrossMetricViewModel,
	DashboardPageViewModel,
	DashboardStatCardViewModel
} from './dashboard.view-model';

export function createEmptyDashboardSummary(): DashboardSummaryResponseDto {
	return {
		averageScore: 0,
		pendingApprovalCount: 0,
		goalCompletionRate: 0,
		stageProgress: [],
		departmentDistribution: [],
		gradeDistribution: [],
		updatedAt: null
	};
}

export function createEmptyCrossSummary(): DashboardCrossSummaryResponseDto {
	return {
		metricCards: []
	};
}

export function mapDashboardPageViewModel(params: {
	summary: DashboardSummaryResponseDto;
	crossSummary: DashboardCrossSummaryResponseDto;
	refreshing: boolean;
	errorMessage?: string;
}): DashboardPageViewModel {
	const { summary, crossSummary, refreshing, errorMessage } = params;

	return {
		hero: {
			title: '绩效驾驶舱',
			description: '围绕当前筛选周期展示整体结果、待处理事项和跨模块观察点。',
			lastUpdatedLabel: summary.updatedAt
				? dayjs(summary.updatedAt).format('YYYY-MM-DD HH:mm:ss')
				: '暂无刷新记录',
			refreshing,
			scopeLabel: resolveScopeLabelFromSummary(summary)
		},
		stats: mapStatCards(summary),
		stageProgress: summary.stageProgress
			.slice()
			.sort((a, b) => a.sort - b.sort)
			.map(item => ({
				stageKey: item.stageKey,
				stageLabel: item.stageLabel,
				completedCount: item.completedCount,
				totalCount: item.totalCount,
				completionRate: item.completionRate,
				sort: item.sort,
				displayText: `${item.completedCount} / ${item.totalCount}`
			})),
		departmentBars: summary.departmentDistribution.map(item => ({
			departmentId: item.departmentId,
			departmentName: item.departmentName,
			averageScore: item.averageScore,
			assessmentCount: item.assessmentCount
		})),
		gradeSlices: summary.gradeDistribution.map(item => ({
			grade: item.grade,
			count: item.count,
			ratio: item.ratio
		})),
		crossMetrics: (crossSummary.metricCards || []).map(mapCrossMetricCard),
		errorMessage
	};
}

function mapStatCards(summary: DashboardSummaryResponseDto): DashboardStatCardViewModel[] {
	return [
		{
			key: 'averageScore',
			label: '整体绩效均分',
			value: formatDecimal(summary.averageScore),
			helper: '按已审批评估单汇总',
			tone: 'brand',
			variant: 'featured'
		},
		{
			key: 'pendingApprovalCount',
			label: '待审批事项',
			value: String(summary.pendingApprovalCount || 0),
			helper: '当前权限范围内待处理',
			tone: 'warning',
			variant: 'featured'
		},
		{
			key: 'goalCompletionRate',
			label: '目标完成率',
			value: formatDecimal(summary.goalCompletionRate),
			unit: '%',
			helper: '当前周期目标完成进度',
			tone: 'success'
		},
		{
			key: 'departmentCoverage',
			label: '覆盖部门数',
			value: String(summary.departmentDistribution.length),
			unit: '个',
			helper: '当前筛选范围内已产出统计',
			tone: 'neutral'
		}
	];
}

function mapCrossMetricCard(item: DashboardCrossMetricCardDto): DashboardCrossMetricViewModel {
	return {
		metricCode: item.metricCode,
		metricLabel: item.metricLabel,
		domainLabel: resolveDomainLabel(item.sourceDomain),
		valueText: resolveMetricValueText(item),
		unitText: item.unit || '',
		periodLabel: `${resolvePeriodTypeLabel(item.periodType)} ${item.periodValue || '--'}`,
		scopeLabel: resolveScopeLabel(item.scopeType, item.departmentId),
		statusLabel: resolveStatusLabel(item),
		status: item.dataStatus,
		updatedAtLabel: item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '--',
		tone: resolveTone(item.dataStatus)
	};
}

function resolveDomainLabel(domain: string) {
	if (domain === 'recruitment') return '招聘域';
	if (domain === 'training') return '培训域';
	if (domain === 'meeting') return '会议域';
	return domain || '--';
}

function resolvePeriodTypeLabel(periodType: string) {
	if (periodType === 'month') return '月度';
	if (periodType === 'quarter') return '季度';
	if (periodType === 'year') return '年度';
	return '周期';
}

function resolveScopeLabel(scopeType: string, departmentId: number | null) {
	if (scopeType === 'global') return '全局口径';
	if (scopeType === 'department_tree')
		return departmentId ? `部门树 #${departmentId}` : '部门树范围';
	return '--';
}

function resolveStatusLabel(item: DashboardCrossMetricCardDto) {
	if (item.statusText) return item.statusText;
	if (item.dataStatus === 'ready') return '已就绪';
	if (item.dataStatus === 'delayed') return '数据延迟';
	if (item.dataStatus === 'unavailable') return '暂未开放';
	return '状态未知';
}

function resolveMetricValueText(item: DashboardCrossMetricCardDto) {
	if (item.dataStatus === 'unavailable') return '未开放';
	if (item.metricValue == null) return '暂无数据';
	return formatDecimal(item.metricValue);
}

function resolveScopeLabelFromSummary(summary: DashboardSummaryResponseDto) {
	if (summary.departmentDistribution.length) {
		return `当前已覆盖 ${summary.departmentDistribution.length} 个部门`;
	}

	if (summary.stageProgress.length) {
		return `当前周期共跟踪 ${summary.stageProgress.length} 个关键环节`;
	}

	return '当前范围内暂无统计覆盖';
}

function resolveTone(status: string): DashboardCardTone {
	if (status === 'ready') return 'success';
	if (status === 'delayed') return 'warning';
	if (status === 'unavailable') return 'neutral';
	return 'neutral';
}

function formatDecimal(value: number | null | undefined) {
	return Number(value || 0).toFixed(2);
}
