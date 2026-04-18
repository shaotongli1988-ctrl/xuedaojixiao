<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="list-page" scroll-y>
			<view class="list-page__header">
				<text class="list-page__title">待我审批</text>
				<text class="list-page__subtitle">仅展示当前经理部门树范围内状态为 submitted 的记录</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号不在移动端首批经理审批范围内。"
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
				title="当前暂无待审批记录"
				description="当前范围内暂无数据。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="list-page__body">
				<view v-for="item in state.list" :key="item.id" class="record-card">
					<view class="record-card__top">
						<view>
							<text class="record-card__title">
								{{ item.employeeName || "-" }} · {{ item.periodValue }}
							</text>
							<text class="record-card__meta">{{ item.departmentName || "-" }}</text>
						</view>
						<status-pill
							:label="assessmentStatusLabel(item.status)"
							:tone="assessmentStatusTone(item.status)"
						/>
					</view>

					<view class="record-card__grid">
						<text>目标完成：{{ item.targetCompletion || 0 }}%</text>
						<text>总分：{{ item.totalScore || 0 }}</text>
						<text>等级：{{ item.grade || "-" }}</text>
						<text>提交时间：{{ item.submitTime || "-" }}</text>
					</view>

					<view class="record-card__actions">
						<cl-button type="primary" size="mini" @tap="openDetail(item.id)">
							查看并审批
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
import { router } from "/@/cool/router";
import { useStore } from "/@/cool/store";
import { performanceAssessmentService } from "/@/service/performance/assessment";
import {
	assessmentStatusLabel,
	assessmentStatusTone,
	type AssessmentRecord,
} from "/@/types/performance-assessment";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";

const { user } = useStore();

const state = reactive({
	loading: false,
	error: "",
	list: [] as AssessmentRecord[],
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/approval/list"));

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		const res = await performanceAssessmentService.fetchPage({
			page: 1,
			size: 20,
			mode: "pending",
		});
		state.list = res?.list || [];
	} catch (error: any) {
		state.error = error?.message || "待审批列表加载失败";
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
		path: "/pages/performance/assessment/detail",
		query: {
			id,
			source: "approval",
		},
	});
}

onShow(load);

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.list-page {
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

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.record-card {
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
		margin-top: 26rpx;
	}
}
</style>
