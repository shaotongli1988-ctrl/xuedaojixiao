<!-- 文件职责：承接 cool-uni 班主任看板移动页聚合摘要展示；不负责资源明细钻取、复杂图表或跨主题联动；维护重点是仅消费 teacherDashboard summary 聚合接口。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="teacher-dashboard-page" scroll-y>
			<view class="teacher-dashboard-page__header">
				<text class="teacher-dashboard-page__title">班主任看板</text>
				<text class="teacher-dashboard-page__subtitle"
					>只展示资源总量、待跟进摘要和合作分布，不做复杂钻取</text
				>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号没有班主任看板入口。"
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

			<view v-else class="teacher-dashboard-page__body">
				<view class="metric-grid">
					<view v-for="item in metrics" :key="item.key" class="metric-card">
						<text class="metric-card__label">{{ item.label }}</text>
						<text class="metric-card__value">{{ item.value }}</text>
						<text class="metric-card__hint">{{ item.hint }}</text>
					</view>
				</view>

				<view class="panel-card">
					<text class="panel-card__title">待跟进摘要</text>
					<view class="todo-grid">
						<view class="todo-card">
							<text class="todo-card__label">今日待跟进</text>
							<text class="todo-card__value">{{
								summary.pendingFollowCount || 0
							}}</text>
						</view>
						<view class="todo-card">
							<text class="todo-card__label">已逾期待跟进</text>
							<text class="todo-card__value todo-card__value--danger">{{
								summary.overdueFollowCount || 0
							}}</text>
						</view>
					</view>
				</view>

				<view class="panel-card">
					<text class="panel-card__title">合作 / 班级摘要</text>
					<page-state
						v-if="!distribution.length"
						title="暂无分布摘要"
						description="当前范围内没有可展示的班主任化分布结果。"
					/>
					<view v-else class="distribution-list">
						<view
							v-for="(item, index) in distribution"
							:key="`${item.key || item.status || item.label || index}`"
							class="distribution-row"
						>
							<text class="distribution-row__label">{{
								item.label || item.name || item.status || "-"
							}}</text>
							<text class="distribution-row__value">{{
								Number(item.count ?? item.value ?? 0)
							}}</text>
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
import { performanceTeacherDashboardService } from "/@/service/performance/teacherChannel";
import {
	resolveTeacherDashboardDistribution,
	type TeacherDashboardSummary,
} from "/@/types/performance-teacher-channel";
import PageState from "/@/pages/performance/components/page-state.vue";

const { router } = useCool();
const { user } = useStore();

const summary = reactive<TeacherDashboardSummary>({
	resourceTotal: 0,
	pendingFollowCount: 0,
	overdueFollowCount: 0,
	partneredCount: 0,
	classCount: 0,
	memberDistribution: [],
	cooperationDistribution: [],
	classStatusDistribution: [],
});
const state = reactive({
	loading: false,
	error: "",
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/teacher-channel/dashboard"));
const metrics = computed(() => [
	{
		key: "resourceTotal",
		label: "资源总数",
		value: String(summary.resourceTotal || 0),
		hint: "授权范围内资源总量",
	},
	{
		key: "partneredCount",
		label: "已合作资源",
		value: String(summary.partneredCount || 0),
		hint: `班级数 ${summary.classCount || 0}`,
	},
]);
const distribution = computed(() => resolveTeacherDashboardDistribution(summary));

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		Object.assign(summary, await performanceTeacherDashboardService.fetchSummary());
	} catch (error: any) {
		state.error = error?.message || "班主任看板加载失败";
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
.teacher-dashboard-page {
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
.todo-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
}

.metric-card,
.panel-card,
.todo-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.metric-card,
.todo-card {
	&__label,
	&__hint {
		display: block;
		font-size: 22rpx;
		color: #748198;
	}

	&__value {
		display: block;
		margin-top: 12rpx;
		font-size: 38rpx;
		font-weight: 700;
		color: #2457c5;
	}

	&__value--danger {
		color: #c43333;
	}
}

.panel-card {
	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}
}

.distribution-list {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	margin-top: 24rpx;
}

.distribution-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	font-size: 24rpx;

	&__label {
		color: #1a2233;
	}

	&__value {
		font-weight: 700;
		color: #2457c5;
	}
}
</style>
