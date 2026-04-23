<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="detail-page" scroll-y>
			<page-state
				v-if="state.mode === 'denied'"
				title="无权限访问该数据"
				description="当前任务不可访问。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.mode === 'missing'"
				title="记录不存在或已失效"
				description="请返回上一级重新进入。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.mode === 'error'"
				title="加载失败"
				:description="state.error"
				action-text="重试"
				@action="load"
			/>

			<view v-else-if="detail" class="detail-page__body">
				<view class="detail-card">
					<view class="detail-card__top">
						<view>
							<text class="detail-card__title">{{ detail.title }}</text>
							<text class="detail-card__meta">
								{{ detail.employeeName || "-" }} · {{ detail.departmentName || "-" }}
							</text>
						</view>
						<status-pill
							:label="taskStatusLabel(detail.status)"
							:tone="taskStatusTone(detail.status)"
						/>
					</view>

					<view class="detail-card__grid">
						<text>截止：{{ detail.deadline || "-" }}</text>
						<text>当前关系：{{ detail.currentUserRecord?.relationType || "-" }}</text>
						<text>已提交：{{ detail.submittedCount || 0 }}/{{ detail.totalCount || 0 }}</text>
						<text>均分：{{ detail.averageScore || 0 }}</text>
					</view>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">我的状态</text>
					<text class="detail-card__paragraph">
						{{ recordStatusLabel(detail.currentUserRecord?.status || "draft") }}
					</text>
				</view>

				<view v-if="detail.feedbackUsers?.length" class="detail-card">
					<text class="detail-card__section">评价人进度</text>
					<view v-for="item in detail.feedbackUsers" :key="item.id" class="record-row">
						<view>
							<text class="record-row__title">{{ item.feedbackUserName || "-" }}</text>
							<text class="record-row__meta">{{ item.relationType || "-" }}</text>
						</view>
						<status-pill
							:label="recordStatusLabel(item.status)"
							:tone="recordStatusTone(item.status)"
						/>
					</view>
				</view>

				<view class="detail-actions">
					<cl-button plain @tap="backToList">返回</cl-button>
					<cl-button
						v-if="canFeedbackSubmit(detail) && user.hasPerm(PERMISSIONS.performance.feedback.submit)"
						type="primary"
						@tap="openSubmit"
					>
						提交反馈
					</cl-button>
					<cl-button
						v-if="user.hasPerm(PERMISSIONS.performance.feedback.summary)"
						plain
						@tap="openSummary"
					>
						查看汇总
					</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import {
	canFeedbackSubmit,
	type FeedbackTaskRecord,
} from "/@/types/performance-feedback";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { PERMISSIONS } from "/@/generated/permissions.generated";
import {
	buildFeedbackSubmitQuery,
	buildFeedbackSummaryQuery,
	isRouteSourceValid,
} from "./utils";

const FEEDBACK_TASK_STATUS_DICT_KEY = "performance.feedback.taskStatus";
const FEEDBACK_RECORD_STATUS_DICT_KEY = "performance.feedback.recordStatus";

const { service, router } = useCool();
const { user, dict } = useStore();

const detail = ref<FeedbackTaskRecord | null>(null);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);
const routeSource = router.query.source;

function resolveMode(message?: string) {
	if (/无权限|无权/.test(String(message || ""))) {
		return "denied";
	}

	if (/不存在|失效/.test(String(message || ""))) {
		return "missing";
	}

	return "error";
}

async function load() {
	if (!isRouteSourceValid(routeSource, "list")) {
		uni.showToast({
			title: "页面来源已失效，已返回工作台",
			icon: "none",
		});
		goHome();
		return;
	}

	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	try {
		await dict.refresh([FEEDBACK_TASK_STATUS_DICT_KEY, FEEDBACK_RECORD_STATUS_DICT_KEY]);
		detail.value = await (service as any).performance.feedback.fetchInfo({ id: recordId });
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "环评详情加载失败",
		};
	}
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function backToList() {
	uni.navigateBack();
}

function openSubmit() {
	router.push({
		path: "/pages/performance/feedback/submit",
		query: buildFeedbackSubmitQuery(recordId),
	});
}

function openSummary() {
	router.push({
		path: "/pages/performance/feedback/summary",
		query: buildFeedbackSummaryQuery(recordId),
	});
}

function taskStatusLabel(value?: string | null) {
	return dict.getLabel(FEEDBACK_TASK_STATUS_DICT_KEY, value) || value || "未知";
}

function taskStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(FEEDBACK_TASK_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

function recordStatusLabel(value?: string | null) {
	return dict.getLabel(FEEDBACK_RECORD_STATUS_DICT_KEY, value) || value || "未知";
}

function recordStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(FEEDBACK_RECORD_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

onShow(load);
</script>

<style lang="scss" scoped>
.detail-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.detail-card {
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
		font-size: 32rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #748198;
	}

	&__section {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2233;
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

	&__paragraph {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		line-height: 1.8;
		color: #4f5c74;
	}
}

.record-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #eef2f7;

	&:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	&__title {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #1a2233;
	}

	&__meta {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #748198;
	}
}

.detail-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
