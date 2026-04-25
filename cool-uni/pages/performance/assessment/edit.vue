<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="edit-page" scroll-y>
			<page-state
				v-if="state.mode === 'denied'"
				title="无权限访问该页面"
				description="仅本人草稿或被驳回记录允许编辑。"
				action-text="返回详情"
				@action="backToDetail"
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

			<view v-else-if="form" class="edit-page__body">
				<view class="form-card">
					<text class="form-card__title">自评内容</text>
					<textarea
						v-model.trim="form.selfEvaluation"
						class="form-card__textarea"
						placeholder="请输入自评内容"
					/>

					<text class="form-card__title form-card__title--spaced">目标完成度</text>
					<input
						v-model.number="form.targetCompletion"
						class="form-card__input"
						type="number"
						placeholder="请输入 0-100 的完成度"
					/>
				</view>

				<view class="form-card">
					<text class="form-card__title">评分项</text>
					<view
						v-for="item in form.scoreItems"
						:key="item.id || item.indicatorName"
						class="score-editor"
					>
						<text class="score-editor__name">{{ item.indicatorName }}</text>
						<input
							v-model.number="item.score"
							class="form-card__input"
							type="number"
							placeholder="分数"
						/>
						<textarea
							v-model.trim="item.comment"
							class="form-card__textarea form-card__textarea--small"
							placeholder="补充说明"
						/>
					</view>
				</view>

				<view class="edit-actions">
					<cl-button plain @tap="backToDetail">取消</cl-button>
					<cl-button type="primary" :loading="submitting" @tap="save">保存草稿</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { router } from "/@/cool/router";
import { performanceAssessmentService } from "/@/service/performance/assessment";
import { canAssessmentEdit, type AssessmentRecord } from "/@/types/performance-assessment";
import { useUi } from "/$/cool-ui";
import PageState from "/@/pages/performance/components/page-state.vue";

const ui = useUi();

const form = ref<AssessmentRecord | null>(null);
const submitting = ref(false);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);

async function load() {
	if (!recordId) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	state.value = { mode: "loading", error: "" };

	try {
		const res = await performanceAssessmentService.fetchInfo({ id: recordId });

		if (!canAssessmentEdit(res)) {
			state.value = { mode: "denied", error: "" };
			return;
		}

		form.value = {
			...res,
			scoreItems: (res.scoreItems || []).map((item: any) => ({ ...item })),
		};
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: /无权限|无权/.test(String(error?.message || "")) ? "denied" : "error",
			error: error?.message || "自评草稿加载失败",
		};
	}
}

function backToDetail() {
	router.push({
		path: "/pages/performance/assessment/detail",
		mode: "redirectTo",
		query: {
			id: recordId,
			source: "assessment",
		},
	});
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

async function save() {
	if (!form.value || !form.value.id) {
		return;
	}

	submitting.value = true;

	try {
		await performanceAssessmentService.updateAssessment({
			...form.value,
			id: form.value.id,
		});
		ui.showToast("草稿已保存");
		backToDetail();
	} catch (error: any) {
		ui.showTips(error?.message || "保存失败");
	} finally {
		submitting.value = false;
	}
}

onShow(load);
</script>

<style lang="scss" scoped>
.edit-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.form-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

	&__title {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #1a2233;

		&--spaced {
			margin-top: 26rpx;
		}
	}

	&__input {
		height: 88rpx;
		margin-top: 18rpx;
		padding: 0 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;
	}

	&__textarea {
		width: 100%;
		min-height: 200rpx;
		margin-top: 18rpx;
		padding: 22rpx 24rpx;
		border-radius: 22rpx;
		background: #f6f8fc;
		font-size: 26rpx;
		color: #1a2233;
		box-sizing: border-box;

		&--small {
			min-height: 140rpx;
		}
	}
}

.score-editor {
	padding-top: 22rpx;
	border-bottom: 1rpx solid #eef2f7;

	&:last-child {
		border-bottom: none;
	}

	&__name {
		display: block;
		font-size: 26rpx;
		font-weight: 600;
		color: #1a2233;
	}
}

.edit-actions {
	display: flex;
	gap: 18rpx;
	padding-bottom: 48rpx;
}
</style>
