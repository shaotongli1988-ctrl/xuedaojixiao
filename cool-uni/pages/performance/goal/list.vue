<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="goal-page" scroll-y>
			<view class="goal-page__header">
				<text class="goal-page__title">目标</text>
				<text class="goal-page__subtitle">员工看本人目标，经理看部门树范围目标</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号不在移动端首批目标范围内。"
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

			<page-state
				v-else-if="!state.loading && !state.list.length"
				title="当前暂无目标"
				description="当前范围内暂无数据。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="goal-page__list">
				<view v-for="item in state.list" :key="item.id" class="goal-card">
					<view class="goal-card__top">
						<view>
							<text class="goal-card__title">{{ item.title }}</text>
							<text class="goal-card__meta">
								{{ item.employeeName || "-" }} · {{ item.departmentName || "-" }}
							</text>
						</view>
						<goal-status-tag :status="item.status" />
					</view>

					<view class="goal-card__grid">
						<text>目标值：{{ item.targetValue }} {{ item.unit }}</text>
						<text>当前值：{{ item.currentValue }} {{ item.unit }}</text>
						<text>权重：{{ item.weight }}%</text>
						<text>进度：{{ item.progressRate || 0 }}%</text>
					</view>

					<view class="goal-card__actions">
						<cl-button plain size="mini" @tap="openDetail(item.id)">查看详情</cl-button>
						<cl-button
							v-if="canGoalEdit(item) && user.hasPerm('performance:goal:update')"
							plain
							size="mini"
							@tap="openEdit(item.id)"
						>
							编辑
						</cl-button>
						<cl-button
							v-if="canGoalProgressUpdate(item) && user.hasPerm('performance:goal:progressUpdate')"
							type="primary"
							size="mini"
							@tap="openProgress(item.id)"
						>
							更新进度
						</cl-button>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import {
	canGoalEdit,
	canGoalProgressUpdate,
	type GoalRecord,
} from "/@/types/performance-goal";
import PageState from "/@/pages/performance/components/page-state.vue";
import GoalStatusTag from "./components/goal-status-tag.vue";

const { service, router } = useCool();
const { user } = useStore();

const state = reactive({
	loading: false,
	error: "",
	list: [] as GoalRecord[],
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/goal/list"));

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		const res = await (service as any).performance.goal.fetchPage({
			page: 1,
			size: 20,
		});
		state.list = res?.list || [];
	} catch (error: any) {
		state.error = error?.message || "目标列表加载失败";
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

function openDetail(id?: number) {
	if (!id) return;
	router.push({
		path: "/pages/performance/goal/detail",
		query: { id },
	});
}

function openEdit(id?: number) {
	if (!id) return;
	router.push({
		path: "/pages/performance/goal/edit",
		query: { id },
	});
}

function openProgress(id?: number) {
	if (!id) return;
	router.push({
		path: "/pages/performance/goal/progress",
		query: { id },
	});
}

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.goal-page {
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
		color: #687489;
	}

	&__list {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.goal-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: #4f5c74;
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 26rpx;
	}
}
</style>
