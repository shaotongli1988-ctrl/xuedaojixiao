<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="detail-page" scroll-y>
			<goal-state
				v-if="state.mode === 'denied'"
				title="无权限访问该数据"
				tips="当前目标不可访问。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<goal-state
				v-else-if="state.mode === 'missing'"
				title="记录不存在或已失效"
				tips="请返回上一级重新进入。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<goal-state
				v-else-if="state.mode === 'error'"
				title="加载失败"
				:tips="state.error"
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
						<goal-status-tag :status="detail.status" />
					</view>

					<view class="detail-card__grid">
						<text>目标值：{{ detail.targetValue }} {{ detail.unit }}</text>
						<text>当前值：{{ detail.currentValue }} {{ detail.unit }}</text>
						<text>权重：{{ detail.weight }}%</text>
						<text>进度：{{ detail.progressRate || 0 }}%</text>
						<text>开始：{{ detail.startDate }}</text>
						<text>结束：{{ detail.endDate }}</text>
					</view>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">目标说明</text>
					<text class="detail-card__paragraph">{{ detail.description || "未填写" }}</text>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">进度记录</text>
					<goal-state
						v-if="!(detail.progressRecords || []).length"
						title="暂无进度记录"
						tips="当前范围内暂无数据。"
					/>
					<view
						v-for="item in detail.progressRecords || []"
						:key="item.id"
						class="progress-row"
					>
						<text class="progress-row__title">
							{{ item.afterValue }} / {{ detail.targetValue }} {{ detail.unit }}
						</text>
						<text class="progress-row__meta">
							{{ item.operatorName || "-" }} · {{ item.createTime || "-" }} ·
							{{ item.progressRate }}%
						</text>
						<text v-if="item.remark" class="progress-row__remark">{{ item.remark }}</text>
					</view>
				</view>

				<view class="detail-actions">
					<cl-button plain @tap="backToList">返回</cl-button>
					<cl-button
						v-if="canGoalEdit(detail) && user.hasPerm('performance:goal:update')"
						plain
						@tap="openEdit"
					>
						编辑目标
					</cl-button>
					<cl-button
						v-if="canGoalProgressUpdate(detail) && user.hasPerm('performance:goal:progressUpdate')"
						type="primary"
						@tap="openProgress"
					>
						更新进度
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
	canGoalEdit,
	canGoalProgressUpdate,
	type GoalRecord,
} from "/@/types/performance-goal";
import GoalState from "./components/goal-state.vue";
import GoalStatusTag from "./components/goal-status-tag.vue";

const { service, router } = useCool();
const { user } = useStore();

const detail = ref<GoalRecord | null>(null);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);

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
	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	try {
		detail.value = await (service as any).performance.goal.fetchInfo({ id: recordId });
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "目标详情加载失败",
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

function openEdit() {
	router.push({
		path: "/pages/performance/goal/edit",
		query: { id: recordId },
	});
}

function openProgress() {
	router.push({
		path: "/pages/performance/goal/progress",
		query: { id: recordId },
	});
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
		white-space: pre-wrap;
	}
}

.progress-row {
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

	&__remark {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #4f5c74;
		white-space: pre-wrap;
	}
}

.detail-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
