<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="list-page" scroll-y>
			<view class="list-page__header">
				<text class="list-page__title">我的考核</text>
				<text class="list-page__subtitle">只显示当前登录人的考核记录与可提交草稿</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号不在移动端首批员工考核范围内。"
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
				title="当前暂无考核记录"
				description="当前范围内暂无数据。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="list-page__body">
				<view v-for="item in state.list" :key="item.id" class="record-card">
					<view class="record-card__top">
						<view>
							<text class="record-card__title">{{ item.periodValue }}</text>
							<text class="record-card__meta">{{ item.code || "未生成编码" }}</text>
						</view>
						<status-pill
							:label="statusLabel(item.status)"
							:tone="statusTone(item.status)"
						/>
					</view>

					<view class="record-card__grid">
						<text>目标完成：{{ item.targetCompletion || 0 }}%</text>
						<text>总分：{{ item.totalScore || 0 }}</text>
						<text>等级：{{ item.grade || "-" }}</text>
						<text>更新时间：{{ item.updateTime || "-" }}</text>
					</view>

					<view class="record-card__actions">
						<cl-button plain size="mini" @tap="openDetail(item.id)">查看详情</cl-button>
						<cl-button
							v-if="canAssessmentEdit(item) && user.hasPerm(PERMISSIONS.performance.assessment.update)"
							plain
							size="mini"
							@tap="openEdit(item.id)"
						>
							编辑草稿
						</cl-button>
						<cl-button
							v-if="canAssessmentSubmit(item) && user.hasPerm(PERMISSIONS.performance.assessment.submit)"
							type="primary"
							size="mini"
							@tap="submitItem(item.id)"
						>
							提交自评
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
	canAssessmentEdit,
	canAssessmentSubmit,
	type AssessmentRecord,
} from "/@/types/performance-assessment";
import { useUi } from "/$/cool-ui";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import { PERMISSIONS } from "/@/generated/permissions.generated";

const ASSESSMENT_STATUS_DICT_KEY = "performance.assessment.status";

const { user, dict } = useStore();
const ui = useUi();

const state = reactive({
	loading: false,
	error: "",
	list: [] as AssessmentRecord[],
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/assessment/list"));

async function load() {
	if (!allowed.value) {
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		await dict.refresh([ASSESSMENT_STATUS_DICT_KEY]);
		const res = await performanceAssessmentService.fetchPage({
			page: 1,
			size: 20,
			mode: "my",
		});
		state.list = res?.list || [];
	} catch (error: any) {
		state.error = error?.message || "考核列表加载失败";
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
			source: "assessment",
		},
	});
}

function openEdit(id?: number) {
	if (!id) return;
	router.push({
		path: "/pages/performance/assessment/edit",
		query: { id },
	});
}

async function submitItem(id?: number) {
	if (!id) return;

	try {
		await performanceAssessmentService.submit({ id });
		ui.showToast("提交成功");
		load();
	} catch (error: any) {
		ui.showTips(error?.message || "提交失败");
	}
}

function statusLabel(value?: string | null) {
	return dict.getLabel(ASSESSMENT_STATUS_DICT_KEY, value) || value || "未知";
}

function statusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(ASSESSMENT_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
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
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 26rpx;
	}
}
</style>
