<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="detail-page" scroll-y>
			<page-state
				v-if="state.mode === 'denied'"
				title="无权限访问该数据"
				description="当前记录不可访问。"
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
							<text class="detail-card__title">{{ detail.periodValue }}</text>
							<text class="detail-card__meta">{{ detail.code || "未生成编码" }}</text>
						</view>
						<status-pill
							:label="statusLabel(detail.status)"
							:tone="statusTone(detail.status)"
						/>
					</view>

					<view class="detail-card__grid">
						<text>员工：{{ detail.employeeName || "-" }}</text>
						<text>考核人：{{ detail.assessorName || "-" }}</text>
						<text>部门：{{ detail.departmentName || "-" }}</text>
						<text>目标完成：{{ detail.targetCompletion || 0 }}%</text>
						<text>总分：{{ detail.totalScore || 0 }}</text>
						<text>等级：{{ detail.grade || "-" }}</text>
					</view>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">自评内容</text>
					<text class="detail-card__paragraph">{{
						detail.selfEvaluation || "未填写"
					}}</text>
					<text v-if="detail.managerFeedback" class="detail-card__section">审批意见</text>
					<text v-if="detail.managerFeedback" class="detail-card__paragraph">
						{{ detail.managerFeedback }}
					</text>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">评分项</text>
					<view
						v-for="item in detail.scoreItems"
						:key="item.id || item.indicatorName"
						class="score-row"
					>
						<view>
							<text class="score-row__name">{{ item.indicatorName }}</text>
							<text class="score-row__meta">
								权重 {{ item.weight }}% · 分数 {{ item.score }}
							</text>
						</view>
						<text class="score-row__value">{{ item.weightedScore || 0 }}</text>
					</view>
				</view>

				<view v-if="canReviewForm(detail)" class="detail-card">
					<text class="detail-card__section">审批意见</text>
					<textarea
						v-model.trim="reviewComment"
						class="detail-card__textarea"
						placeholder="可选填写审批意见"
					/>
				</view>

				<view class="detail-actions">
					<cl-button plain @tap="backToSource">返回</cl-button>
					<cl-button v-if="canEditAction(detail)" plain @tap="openEdit">
						编辑草稿
					</cl-button>
					<cl-button v-if="canSubmitAction(detail)" type="primary" @tap="submitSelf">
						提交自评
					</cl-button>
					<cl-button v-if="canRejectAction(detail)" plain @tap="review('reject')">
						驳回
					</cl-button>
					<cl-button
						v-if="canApproveAction(detail)"
						type="primary"
						@tap="review('approve')"
					>
						通过
					</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { router } from "/@/cool/router";
import { useStore } from "/@/cool/store";
import { performanceAssessmentService } from "/@/service/performance/assessment";
import {
	canAssessmentEdit,
	canAssessmentReview,
	canAssessmentSubmit,
	type AssessmentRecord,
} from "/@/types/performance-assessment";
import { useUi } from "/$/cool-ui";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";

const ASSESSMENT_STATUS_DICT_KEY = "performance.assessment.status";

const { user, dict } = useStore();
const ui = useUi();

const detail = ref<AssessmentRecord | null>(null);
const reviewComment = ref("");
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = computed(() => Number(router.query.id || 0));
const source = computed(() => String(router.query.source || "assessment"));
const canEditAction = (record: AssessmentRecord | null) =>
	record
		? user.hasPerm(performanceAssessmentService.permission.update) && canAssessmentEdit(record)
		: false;
const canSubmitAction = (record: AssessmentRecord | null) =>
	record
		? user.hasPerm(performanceAssessmentService.permission.submit) &&
			canAssessmentSubmit(record)
		: false;
const canApproveAction = (record: AssessmentRecord | null) =>
	record
		? user.hasPerm(performanceAssessmentService.permission.approve) &&
			canAssessmentReview(record)
		: false;
const canRejectAction = (record: AssessmentRecord | null) =>
	record
		? user.hasPerm(performanceAssessmentService.permission.reject) &&
			canAssessmentReview(record)
		: false;
const canReviewForm = (record: AssessmentRecord | null) =>
	Boolean(record) && (canApproveAction(record) || canRejectAction(record));

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
	if (!recordId.value) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	if (!user.canAccessRoute("/pages/performance/assessment/detail")) {
		state.value = { mode: "denied", error: "" };
		return;
	}

	state.value = { mode: "loading", error: "" };

	try {
		await dict.refresh([ASSESSMENT_STATUS_DICT_KEY]);
		detail.value = await performanceAssessmentService.fetchInfo({
			id: recordId.value,
		});
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "详情加载失败",
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

function backToSource() {
	if (source.value === "approval") {
		router.push({
			path: "/pages/performance/approval/list",
			mode: "redirectTo",
		});
		return;
	}

	uni.navigateBack();
}

function openEdit() {
	if (!canEditAction(detail.value)) {
		ui.showTips("当前无权编辑该考核");
		return;
	}

	router.push({
		path: "/pages/performance/assessment/edit",
		query: { id: recordId.value },
	});
}

async function submitSelf() {
	if (!canSubmitAction(detail.value)) {
		ui.showTips("当前无权提交该考核");
		return;
	}

	try {
		await performanceAssessmentService.submit({ id: recordId.value });
		ui.showToast("提交成功");
		load();
	} catch (error: any) {
		ui.showTips(error?.message || "提交失败");
	}
}

async function review(action: "approve" | "reject") {
	const allowed =
		action === "approve" ? canApproveAction(detail.value) : canRejectAction(detail.value);

	if (!allowed) {
		ui.showTips("当前无权执行审批动作");
		return;
	}

	try {
		await performanceAssessmentService[action]({
			id: recordId.value,
			comment: reviewComment.value,
		});
		ui.showToast(action === "approve" ? "审批通过" : "已驳回");
		load();
	} catch (error: any) {
		ui.showTips(error?.message || "审批失败");
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

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: #4f5c74;
	}

	&__section {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2233;
	}

	&__paragraph {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		line-height: 1.8;
		color: #4f5c74;
		white-space: pre-wrap;
	}

	&__textarea {
		width: 100%;
		min-height: 180rpx;
		margin-top: 18rpx;
		padding: 20rpx 22rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;
	}
}

.score-row {
	display: flex;
	justify-content: space-between;
	gap: 18rpx;
	padding: 22rpx 0;
	border-bottom: 1rpx solid #eef2f7;

	&:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	&__name {
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

	&__value {
		font-size: 28rpx;
		font-weight: 700;
		color: #2b61bf;
	}
}

.detail-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
