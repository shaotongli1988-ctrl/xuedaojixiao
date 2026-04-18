<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="summary-page" scroll-y>
			<page-state
				v-if="state.mode === 'denied'"
				title="无权限访问该数据"
				description="当前汇总结果不可访问。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.mode === 'missing'"
				title="记录不存在或已失效"
				description="请返回详情页重新进入。"
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

			<view v-else-if="summary" class="summary-page__body">
				<view class="summary-card">
					<text class="summary-card__title">汇总指标</text>
					<view class="summary-card__metrics">
						<view class="metric-box">
							<text class="metric-box__value">{{ summary.averageScore || 0 }}</text>
							<text class="metric-box__label">平均分</text>
						</view>
						<view class="metric-box">
							<text class="metric-box__value">{{ summary.submittedCount || 0 }}</text>
							<text class="metric-box__label">已提交</text>
						</view>
						<view class="metric-box">
							<text class="metric-box__value">{{ summary.totalCount || 0 }}</text>
							<text class="metric-box__label">总人数</text>
						</view>
					</view>
				</view>

				<page-state
					v-if="!summary.records.length"
					title="当前仅显示汇总指标"
					description="员工移动端不展示他人单条反馈全文；如有记录权限，列表会在下方展示。"
					action-text="返回详情"
					@action="backToDetail"
				/>

				<view v-else class="summary-card">
					<text class="summary-card__title">反馈明细</text>
					<view v-for="item in summary.records" :key="item.id" class="summary-row">
						<view>
							<text class="summary-row__title">
								{{ item.feedbackUserName || "-" }} · {{ item.relationType || "-" }}
							</text>
							<text class="summary-row__meta">{{ item.submitTime || "-" }}</text>
							<text v-if="item.content" class="summary-row__content">{{ item.content }}</text>
						</view>
						<text class="summary-row__score">{{ item.score || 0 }}</text>
					</view>
				</view>

				<view class="summary-actions">
					<cl-button plain @tap="backToDetail">返回详情</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import type { FeedbackSummary } from "/@/types/performance-feedback";
import PageState from "/@/pages/performance/components/page-state.vue";
import { buildFeedbackDetailQuery, isRouteSourceValid } from "./utils";

const { service, router } = useCool();

const summary = ref<FeedbackSummary | null>(null);
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
	if (!isRouteSourceValid(routeSource, "detail")) {
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
		summary.value = await (service as any).performance.feedback.fetchSummary({ id: recordId });
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "环评汇总加载失败",
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

function backToDetail() {
	router.push({
		path: "/pages/performance/feedback/detail",
		mode: "redirectTo",
		query: buildFeedbackDetailQuery(recordId),
	});
}

onShow(load);
</script>

<style lang="scss" scoped>
.summary-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.summary-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

	&__title {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18rpx;
		margin-top: 24rpx;
	}
}

.metric-box {
	padding: 22rpx 16rpx;
	border-radius: 22rpx;
	background: #f6f8fc;
	text-align: center;

	&__value {
		display: block;
		font-size: 34rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__label {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #748198;
	}
}

.summary-row {
	display: flex;
	justify-content: space-between;
	gap: 18rpx;
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

	&__content {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
		white-space: pre-wrap;
	}

	&__score {
		font-size: 30rpx;
		font-weight: 700;
		color: #2b61bf;
	}
}

.summary-actions {
	display: flex;
	padding-bottom: 48rpx;
}
</style>
