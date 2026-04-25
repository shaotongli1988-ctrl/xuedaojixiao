<!-- 文件职责：承接 cool-uni 课程学习任务提交动作；不负责课程切换或详情展示全量编排；维护重点是提交前仍按 id/type 调用既有冻结接口，并以后端合法性校验为准。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="submit-page" scroll-y>
			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号无法提交该学习任务。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<page-state
				v-else-if="state.mode === 'missing'"
				title="记录不存在或已失效"
				description="请返回上一级重新进入。"
				action-text="返回学习页"
				@action="backToCourse"
			/>

			<page-state
				v-else-if="state.mode === 'error'"
				title="加载失败"
				:description="state.error"
				action-text="重试"
				@action="load"
			/>

			<view v-else-if="detail" class="submit-page__body">
				<view class="submit-card">
					<text class="submit-card__title">{{ detail.title }}</text>
					<text class="submit-card__meta">{{ detail.courseTitle || "-" }}</text>
					<text class="submit-card__paragraph">{{
						detail.promptText || "暂无任务内容"
					}}</text>
				</view>

				<view class="submit-card">
					<text class="submit-card__section">提交内容</text>
					<textarea
						v-model="submissionText"
						class="submit-card__textarea"
						maxlength="5000"
						placeholder="请输入本次学习任务提交内容"
					/>
					<text class="submit-card__hint"
						>已评估任务不可再次提交；未评估任务提交后会覆盖上一次提交文本。</text
					>
				</view>

				<view class="submit-actions">
					<cl-button plain @tap="backToDetail">返回详情</cl-button>
					<cl-button
						type="primary"
						:disabled="!canCourseTaskSubmit(detail) || !submissionText.trim()"
						:loading="submitting"
						@tap="submitTask"
					>
						提交任务
					</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useUi } from "/$/cool-ui";
import {
	performanceCoursePracticeService,
	performanceCourseReciteService,
} from "/@/service/performance/courseLearning";
import PageState from "/@/pages/performance/components/page-state.vue";
import {
	canCourseTaskSubmit,
	type CourseLearningTaskRecord,
} from "/@/types/performance-course-learning";

const { router } = useCool();
const { user } = useStore();
const ui = useUi();

const detail = ref<CourseLearningTaskRecord | null>(null);
const submissionText = ref("");
const submitting = ref(false);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);
const courseId = Number(router.query.courseId || 0);
const taskType = String(router.query.type || "").trim() as "recite" | "practice";
const allowed = computed(() =>
	taskType === "practice"
		? user.hasPerm(performanceCoursePracticeService.permission.submit)
		: user.hasPerm(performanceCourseReciteService.permission.submit),
);

function resolveMode(message?: string) {
	if (/不存在|失效/.test(String(message || ""))) {
		return "missing";
	}

	return "error";
}

async function load() {
	if (!recordId || !["recite", "practice"].includes(taskType)) {
		state.value = { mode: "missing", error: "" };
		return;
	}

	try {
		detail.value =
			taskType === "practice"
				? await performanceCoursePracticeService.fetchInfo({ id: recordId })
				: await performanceCourseReciteService.fetchInfo({ id: recordId });
		submissionText.value = detail.value?.submissionText || "";
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "学习任务加载失败",
		};
	}
}

async function submitTask() {
	if (!detail.value || !submissionText.value.trim()) {
		ui.showTips("请先填写提交内容");
		return;
	}

	submitting.value = true;

	try {
		if (taskType === "practice") {
			await performanceCoursePracticeService.submitTask({
				id: detail.value.id,
				submissionText: submissionText.value.trim(),
			});
		} else {
			await performanceCourseReciteService.submitTask({
				id: detail.value.id,
				submissionText: submissionText.value.trim(),
			});
		}

		ui.showTips("提交成功", () => {
			backToDetail();
		});
	} catch (error: any) {
		ui.showToast(error?.message || "提交失败");
	} finally {
		submitting.value = false;
	}
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function backToCourse() {
	router.push({
		path: "/pages/performance/course-learning/index",
		query: courseId ? { courseId } : {},
	});
}

function backToDetail() {
	router.push({
		path: "/pages/performance/course-learning/detail",
		query: {
			id: recordId,
			type: taskType,
			courseId,
		},
	});
}

onShow(load);
</script>

<style lang="scss" scoped>
.submit-page {
	min-height: 100vh;
	padding: 24rpx;
	box-sizing: border-box;

	&__body {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}
}

.submit-card {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);

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

	&__paragraph {
		display: block;
		margin-top: 18rpx;
		font-size: 24rpx;
		line-height: 1.8;
		color: #4f5c74;
		white-space: pre-wrap;
	}

	&__textarea {
		width: 100%;
		min-height: 320rpx;
		margin-top: 18rpx;
		padding: 24rpx;
		border-radius: 24rpx;
		background: #f6f8fb;
		box-sizing: border-box;
		font-size: 26rpx;
		line-height: 1.7;
		color: #1a2233;
	}

	&__hint {
		display: block;
		margin-top: 16rpx;
		font-size: 22rpx;
		line-height: 1.7;
		color: #748198;
	}
}

.submit-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	padding-bottom: 24rpx;
}
</style>
