<!-- 文件职责：承接 cool-uni 课程学习任务详情查看；不负责课程切换、课程管理或提交动作执行；维护重点是详情只按 route query 中的 id/type 读取，并继续依赖服务端的本人范围校验。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="detail-page" scroll-y>
			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号无法查看该学习任务详情。"
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

			<view v-else-if="detail" class="detail-page__body">
				<view class="detail-card">
					<view class="detail-card__top">
						<view>
							<text class="detail-card__title">{{ detail.title }}</text>
							<text class="detail-card__meta">{{ detail.courseTitle || "-" }}</text>
						</view>
						<status-pill
							:label="courseTaskStatusLabel(detail.status)"
							:tone="courseTaskStatusTone(detail.status)"
						/>
					</view>

					<view class="detail-card__grid">
						<text
							>任务类型：{{
								detail.taskType === "recite" ? "AI 背诵" : "AI 练习"
							}}</text
						>
						<text>最近分数：{{ detail.latestScore ?? "-" }}</text>
						<text>提交时间：{{ detail.submittedAt || "-" }}</text>
						<text>评估时间：{{ detail.evaluatedAt || "-" }}</text>
					</view>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">任务内容</text>
					<text class="detail-card__paragraph">{{
						detail.promptText || "暂无内容"
					}}</text>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">最近反馈</text>
					<text class="detail-card__paragraph">{{
						detail.feedbackSummary || "暂无反馈摘要"
					}}</text>
				</view>

				<view class="detail-card">
					<text class="detail-card__section">我的提交</text>
					<text class="detail-card__paragraph">{{
						detail.submissionText || "尚未提交"
					}}</text>
				</view>

				<view class="detail-actions">
					<cl-button plain @tap="backToCourse">返回学习页</cl-button>
					<cl-button
						v-if="canAccessSubmit && canCourseTaskSubmit(detail)"
						type="primary"
						@tap="openSubmit"
					>
						去提交
					</cl-button>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import {
	performanceCoursePracticeService,
	performanceCourseReciteService,
} from "/@/service/performance/courseLearning";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import {
	canCourseTaskSubmit,
	type CourseLearningTaskRecord,
} from "/@/types/performance-course-learning";

const { router } = useCool();
const { user, dict } = useStore();

const COURSE_LEARNING_TASK_STATUS_DICT_KEY = "performance.courseLearning.taskStatus";

const detail = ref<CourseLearningTaskRecord | null>(null);
const state = ref({
	mode: "loading",
	error: "",
});

const recordId = Number(router.query.id || 0);
const courseId = Number(router.query.courseId || 0);
const taskType = String(router.query.type || "").trim() as "recite" | "practice";
const allowed = user.canAccessRoute("/pages/performance/course-learning/detail");
const canAccessSubmit = user.canAccessRoute("/pages/performance/course-learning/submit");

function resolveMode(message?: string) {
	if (/无权限|无权/.test(String(message || ""))) {
		return "error";
	}

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
		await dict.refresh([COURSE_LEARNING_TASK_STATUS_DICT_KEY]);
		detail.value =
			taskType === "practice"
				? await performanceCoursePracticeService.fetchInfo({ id: recordId })
				: await performanceCourseReciteService.fetchInfo({ id: recordId });
		state.value = { mode: "ready", error: "" };
	} catch (error: any) {
		state.value = {
			mode: resolveMode(error?.message),
			error: error?.message || "学习任务详情加载失败",
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

function backToCourse() {
	router.push({
		path: "/pages/performance/course-learning/index",
		query: courseId ? { courseId } : {},
	});
}

function openSubmit() {
	router.push({
		path: "/pages/performance/course-learning/submit",
		query: {
			id: recordId,
			type: taskType,
			courseId,
		},
	});
}

function courseTaskStatusLabel(value?: string | null) {
	return dict.getLabel(COURSE_LEARNING_TASK_STATUS_DICT_KEY, value) || value || "未知";
}

function courseTaskStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(COURSE_LEARNING_TASK_STATUS_DICT_KEY, value)?.tone;
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
		font-size: 24rpx;
		line-height: 1.8;
		color: #4f5c74;
		white-space: pre-wrap;
	}
}

.detail-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
	padding-bottom: 24rpx;
}
</style>
