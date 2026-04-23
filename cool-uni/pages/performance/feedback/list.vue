<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="feedback-page" scroll-y>
			<view class="feedback-page__header">
				<text class="feedback-page__title">360 环评</text>
				<text class="feedback-page__subtitle">查看任务、提交反馈和查看汇总</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号不在移动端首批 360 环评范围内。"
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
				title="当前暂无环评任务"
				description="当前范围内暂无数据。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="feedback-page__list">
				<view v-for="item in state.list" :key="item.id" class="task-card">
					<view class="task-card__top">
						<view>
							<text class="task-card__title">{{ item.title }}</text>
							<text class="task-card__meta">
								{{ item.employeeName || "-" }} · {{ item.departmentName || "-" }}
							</text>
						</view>
						<status-pill
							:label="taskStatusLabel(item.status)"
							:tone="taskStatusTone(item.status)"
						/>
					</view>

					<view class="task-card__grid">
						<text>截止：{{ item.deadline || "-" }}</text>
						<text>关系：{{ item.currentUserRelationType || "-" }}</text>
						<text>已提交：{{ item.submittedCount || 0 }}/{{ item.totalCount || 0 }}</text>
						<text>均分：{{ item.averageScore || 0 }}</text>
					</view>

					<view class="task-card__actions">
						<cl-button plain size="mini" @tap="openDetail(item.id)">查看详情</cl-button>
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
import { type FeedbackTaskRecord } from "/@/types/performance-feedback";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { buildFeedbackDetailQuery } from "./utils";

const FEEDBACK_TASK_STATUS_DICT_KEY = "performance.feedback.taskStatus";

const { service, router } = useCool();
const { user, dict } = useStore();

const state = reactive({
	loading: false,
	error: "",
	list: [] as FeedbackTaskRecord[],
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/feedback/list"));

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		await dict.refresh([FEEDBACK_TASK_STATUS_DICT_KEY]);
		const res = await (service as any).performance.feedback.fetchPage({
			page: 1,
			size: 20,
		});
		state.list = res?.list || [];
	} catch (error: any) {
		state.error = error?.message || "环评任务加载失败";
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
		path: "/pages/performance/feedback/detail",
		query: buildFeedbackDetailQuery(id),
	});
}

function taskStatusLabel(value?: string | null) {
	return dict.getLabel(FEEDBACK_TASK_STATUS_DICT_KEY, value) || value || "未知";
}

function taskStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(FEEDBACK_TASK_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.feedback-page {
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

.task-card {
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
