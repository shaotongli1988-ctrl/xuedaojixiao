<!-- 文件职责：承接 cool-uni 绩效驾驶舱移动页聚合摘要展示；不负责复杂图表、跨模块钻取或部门树筛选；维护重点是所有指标都继续来自 dashboard summary 既有接口。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="dashboard-page" scroll-y>
			<view class="dashboard-page__header">
				<text class="dashboard-page__title">绩效驾驶舱</text>
				<text class="dashboard-page__subtitle">只展示已开放的聚合指标，不下沉复杂图表和跨模块明细</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有绩效驾驶舱移动端入口。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.error"
				title="加载失败"
				:description="state.error"
				action-text="重试"
				@action="load"
			/>

			<view v-else class="dashboard-page__body">
				<view class="metric-grid">
					<view v-for="item in metrics" :key="item.key" class="metric-card">
						<text class="metric-card__label">{{ item.label }}</text>
						<text class="metric-card__value">{{ item.value }}</text>
						<text class="metric-card__hint">{{ item.hint }}</text>
					</view>
				</view>

				<view class="panel-card">
					<view class="panel-card__top">
						<text class="panel-card__title">五环节进度</text>
						<cl-button plain size="mini" @tap="load">刷新</cl-button>
					</view>

					<page-state
						v-if="!summary.stageProgress.length"
						title="暂无进度数据"
						description="当前筛选范围内暂无阶段聚合结果。"
					/>

					<view v-else class="stage-list">
						<view v-for="item in summary.stageProgress" :key="item.stageKey" class="stage-row">
							<view class="stage-row__top">
								<text class="stage-row__title">{{ item.stageLabel }}</text>
								<text class="stage-row__value">{{ item.completionRate }}%</text>
							</view>
							<view class="stage-row__track">
								<view class="stage-row__fill" :style="{ width: `${Math.min(item.completionRate || 0, 100)}%` }" />
							</view>
							<text class="stage-row__hint">{{ item.completedCount }} / {{ item.totalCount }}</text>
						</view>
					</view>
				</view>

				<view class="panel-card">
					<text class="panel-card__title">部门绩效分布</text>
					<page-state
						v-if="!summary.departmentDistribution.length"
						title="暂无部门分布"
						description="当前没有可展示的部门均分数据。"
					/>
					<view v-else class="distribution-list">
						<view
							v-for="item in summary.departmentDistribution.slice(0, 8)"
							:key="item.departmentId"
							class="distribution-row"
						>
							<text class="distribution-row__name">{{ item.departmentName || `部门${item.departmentId}` }}</text>
							<text class="distribution-row__meta">均分 {{ Number(item.averageScore || 0).toFixed(1) }}</text>
							<text class="distribution-row__meta">评估单 {{ item.assessmentCount || 0 }}</text>
						</view>
					</view>
				</view>

				<view class="panel-card">
					<text class="panel-card__title">绩效等级分布</text>
					<view class="grade-grid">
						<view v-for="item in summary.gradeDistribution" :key="item.grade" class="grade-card">
							<text class="grade-card__grade">{{ item.grade }}</text>
							<text class="grade-card__count">{{ item.count || 0 }}</text>
							<text class="grade-card__ratio">{{ Number(item.ratio || 0).toFixed(1) }}%</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { performanceDashboardService } from "/@/service/performance/dashboard";
import type { DashboardSummary } from "/@/types/performance-dashboard";
import PageState from "/@/pages/performance/components/page-state.vue";

const { router } = useCool();
const { user } = useStore();

const summary = reactive<DashboardSummary>({
	averageScore: 0,
	pendingApprovalCount: 0,
	goalCompletionRate: 0,
	stageProgress: [],
	departmentDistribution: [],
	gradeDistribution: [],
});
const state = reactive({
	loading: false,
	error: "",
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/dashboard/index"));
const metrics = computed(() => [
	{
		key: "averageScore",
		label: "全员绩效均分",
		value: Number(summary.averageScore || 0).toFixed(1),
		hint: "approved 评估单实时计算",
	},
	{
		key: "pendingApprovalCount",
		label: "待审批数量",
		value: String(summary.pendingApprovalCount || 0),
		hint: "submitted 状态待审批单",
	},
	{
		key: "goalCompletionRate",
		label: "目标完成率",
		value: `${Number(summary.goalCompletionRate || 0).toFixed(1)}%`,
		hint: "当前周期目标完成率",
	},
]);

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		Object.assign(summary, await performanceDashboardService.fetchSummary());
	} catch (error: any) {
		state.error = error?.message || "绩效驾驶舱加载失败";
	} finally {
		state.loading = false;
	}
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.dashboard-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__header {
		padding: 12rpx 8rpx 20rpx;
	}

	&__title {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #687489;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.metric-grid,
.grade-grid {
	display: grid;
	gap: 18rpx;
}

.metric-grid {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grade-grid {
	grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card,
.panel-card,
.grade-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.metric-card {
	&__label,
	&__hint {
		display: block;
		font-size: 22rpx;
		color: #748198;
	}

	&__value {
		display: block;
		margin: 12rpx 0;
		font-size: 38rpx;
		font-weight: 700;
		color: #1e4db7;
	}
}

.panel-card {
	&__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}
}

.stage-list,
.distribution-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 24rpx;
}

.stage-row {
	&__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title,
	&__value {
		font-size: 24rpx;
		color: #1a2233;
	}

	&__value {
		font-weight: 700;
	}

	&__track {
		height: 14rpx;
		margin-top: 16rpx;
		border-radius: 999rpx;
		background: #edf1f7;
		overflow: hidden;
	}

	&__fill {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #2457c5 0%, #4d8cf7 100%);
	}

	&__hint {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #748198;
	}
}

.distribution-row {
	display: grid;
	grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(0, 1fr));
	gap: 16rpx;
	font-size: 24rpx;
	line-height: 1.6;

	&__name {
		color: #1a2233;
		font-weight: 700;
	}

	&__meta {
		color: #4f5c74;
	}
}

.grade-card {
	text-align: center;

	&__grade {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__count {
		display: block;
		margin-top: 12rpx;
		font-size: 34rpx;
		font-weight: 700;
		color: #2457c5;
	}

	&__ratio {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #748198;
	}
}
</style>
