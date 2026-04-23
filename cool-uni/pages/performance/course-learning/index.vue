<!-- 文件职责：承接 cool-uni 课程学习移动页入口、课程 ID 上下文切换、背诵/练习任务浏览和考试摘要查看；不负责课程管理主链或课程选择来源；维护重点是缺少 courseId 时只能停留在引导态，所有学习数据都必须继续由服务端按本人范围裁剪。 -->
<template>
	<cl-page background-color="#f4f6fb">
		<scroll-view class="course-page" scroll-y>
			<view class="course-page__header">
				<text class="course-page__title">课程学习</text>
				<text class="course-page__subtitle">输入课程 ID 后查看本人背诵、练习和考试结果摘要</text>
			</view>

			<page-state
				v-if="!allowed"
				title="无权限访问该页面"
				description="当前账号不在移动端课程学习开放范围内。"
				action-text="返回工作台"
				@action="goHome"
			/>

			<view v-else class="course-page__body">
				<view class="course-entry">
					<cl-form label-position="top">
						<cl-form-item label="课程 ID">
							<cl-input
								v-model="courseIdInput"
								:border="false"
								:height="80"
								:border-radius="16"
								placeholder="请输入课程 ID"
								type="number"
							/>
						</cl-form-item>
					</cl-form>

					<view class="course-entry__actions">
						<cl-button type="primary" size="mini" @tap="applyCourseId">进入课程</cl-button>
						<cl-button plain size="mini" @tap="clearCourseId">清空</cl-button>
					</view>

					<text class="course-entry__hint">
						当前课程 ID：{{ courseId || "-" }}。后端会再次校验该课程是否属于当前登录人的学习上下文。
					</text>
				</view>

				<page-state
					v-if="!courseId"
					title="请输入课程 ID"
					description="当前没有课程上下文。可手动输入 courseId，或从后续桌面端课程入口携带参数进入。"
				/>

				<page-state
					v-else-if="state.error"
					title="加载失败"
					:description="state.error"
					action-text="重试"
					@action="load"
				/>

				<view v-else>
					<view class="course-stats">
						<view class="course-stat">
							<text class="course-stat__label">背诵任务</text>
							<text class="course-stat__value">{{ state.recitePagination.total }}</text>
						</view>
						<view class="course-stat">
							<text class="course-stat__label">练习任务</text>
							<text class="course-stat__value">{{ state.practicePagination.total }}</text>
						</view>
						<view class="course-stat">
							<text class="course-stat__label">结果状态</text>
							<text class="course-stat__value course-stat__value--small">
								{{ courseExamStatusLabel(state.examSummary?.resultStatus) }}
							</text>
						</view>
					</view>

					<view class="course-panel">
						<cl-tabs v-model="activeTab" :list="tabList" :show-line="false" fill />

						<view v-if="activeTab === 'exam'" class="course-panel__section">
							<page-state
								v-if="!state.examSummary"
								title="暂无结果摘要"
								description="当前课程还没有可展示的考试结果摘要。"
							/>
							<view v-else class="exam-card">
								<view class="exam-card__top">
									<text class="exam-card__title">{{ state.examSummary.courseTitle || currentCourseTitle }}</text>
									<status-pill
										:label="courseExamStatusLabel(state.examSummary.resultStatus)"
										:tone="courseExamStatusTone(state.examSummary.resultStatus)"
									/>
								</view>
								<view class="exam-card__grid">
									<text>最近分数：{{ state.examSummary.latestScore ?? "-" }}</text>
									<text>通过阈值：{{ state.examSummary.passThreshold ?? "-" }}</text>
									<text>更新时间：{{ state.examSummary.updatedAt || "-" }}</text>
								</view>
								<text class="exam-card__summary">{{ state.examSummary.summaryText || "暂无摘要" }}</text>
							</view>
						</view>

						<view v-else class="course-panel__section">
							<page-state
								v-if="!currentTaskList.length"
								title="当前暂无学习任务"
								description="当前课程上下文内暂无数据。"
							/>

							<view v-else class="task-list">
								<view
									v-for="item in currentTaskList"
									:key="`${item.taskType}-${item.id}`"
									class="task-card"
								>
									<view class="task-card__top">
										<view>
											<text class="task-card__title">{{ item.title }}</text>
											<text class="task-card__meta">{{ item.courseTitle || currentCourseTitle }}</text>
										</view>
										<status-pill
											:label="courseTaskStatusLabel(item.status)"
											:tone="courseTaskStatusTone(item.status)"
										/>
									</view>

									<view class="task-card__grid">
										<text>最近分数：{{ item.latestScore ?? "-" }}</text>
										<text>提交时间：{{ item.submittedAt || "-" }}</text>
										<text>评估时间：{{ item.evaluatedAt || "-" }}</text>
									</view>

									<view class="task-card__actions">
										<cl-button plain size="mini" @tap="openDetail(item)">查看详情</cl-button>
										<cl-button
											v-if="canCourseTaskSubmit(item)"
											type="primary"
											size="mini"
											@tap="openSubmit(item)"
										>
											提交
										</cl-button>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import { useStore } from "/@/cool/store";
import { useUi } from "/$/cool-ui";
import {
	performanceCourseExamService,
	performanceCoursePracticeService,
	performanceCourseReciteService,
} from "/@/service/performance/courseLearning";
import PageState from "/@/pages/performance/components/page-state.vue";
import StatusPill from "/@/pages/performance/components/status-pill.vue";
import {
	canCourseTaskSubmit,
	type CourseExamSummary,
	type CourseLearningTaskRecord,
} from "/@/types/performance-course-learning";

const COURSE_LEARNING_TASK_STATUS_DICT_KEY = "performance.courseLearning.taskStatus";
const COURSE_LEARNING_EXAM_STATUS_DICT_KEY = "performance.courseLearning.examStatus";

const { router } = useCool();
const { user, dict } = useStore();
const ui = useUi();

const activeTab = ref<"recite" | "practice" | "exam">("recite");
const courseIdInput = ref("");
const tabList = [
	{ label: "AI 背诵", value: "recite" },
	{ label: "AI 练习", value: "practice" },
	{ label: "考试摘要", value: "exam" },
];

const state = reactive({
	loading: false,
	error: "",
	reciteList: [] as CourseLearningTaskRecord[],
	practiceList: [] as CourseLearningTaskRecord[],
	recitePagination: {
		page: 1,
		size: 20,
		total: 0,
	},
	practicePagination: {
		page: 1,
		size: 20,
		total: 0,
	},
	examSummary: null as CourseExamSummary | null,
});

const allowed = computed(() => user.canAccessRoute("/pages/performance/course-learning/index"));
const courseId = computed(() => {
	const value = Number(router.query.courseId || 0);
	return Number.isInteger(value) && value > 0 ? value : 0;
});
const currentTaskList = computed(() =>
	activeTab.value === "practice" ? state.practiceList : state.reciteList
);
const currentCourseTitle = computed(() => {
	return (
		state.examSummary?.courseTitle ||
		state.reciteList[0]?.courseTitle ||
		state.practiceList[0]?.courseTitle ||
		"课程学习任务"
	);
});

function syncCourseIdInput() {
	courseIdInput.value = courseId.value ? String(courseId.value) : "";
}

async function load() {
	if (!allowed.value || !courseId.value) {
		state.error = "";
		state.reciteList = [];
		state.practiceList = [];
		state.examSummary = null;
		state.recitePagination.total = 0;
		state.practicePagination.total = 0;
		return;
	}

	state.loading = true;
	state.error = "";

	try {
		await dict.refresh([
			COURSE_LEARNING_TASK_STATUS_DICT_KEY,
			COURSE_LEARNING_EXAM_STATUS_DICT_KEY,
		]);
		const [reciteRes, practiceRes, examRes] = await Promise.all([
			performanceCourseReciteService.fetchPage({
				page: 1,
				size: 20,
				courseId: courseId.value,
			}),
			performanceCoursePracticeService.fetchPage({
				page: 1,
				size: 20,
				courseId: courseId.value,
			}),
			performanceCourseExamService.fetchSummary({
				courseId: courseId.value,
			}),
		]);

		state.reciteList = reciteRes?.list || [];
		state.practiceList = practiceRes?.list || [];
		state.recitePagination = reciteRes?.pagination || state.recitePagination;
		state.practicePagination = practiceRes?.pagination || state.practicePagination;
		state.examSummary = examRes || null;
	} catch (error: any) {
		state.error = error?.message || "课程学习数据加载失败";
	} finally {
		state.loading = false;
	}
}

function applyCourseId() {
	const value = Number(courseIdInput.value || 0);

	if (!Number.isInteger(value) || value <= 0) {
		ui.showTips("请输入合法的课程 ID");
		return;
	}

	router.push({
		path: "/pages/performance/course-learning/index",
		query: {
			courseId: value,
		},
	});
}

function clearCourseId() {
	courseIdInput.value = "";
	router.push({
		path: "/pages/performance/course-learning/index",
	});
}

function goHome() {
	router.push({
		path: "/pages/index/home",
		mode: "reLaunch",
		isGuard: false,
	});
}

function openDetail(task: CourseLearningTaskRecord) {
	router.push({
		path: "/pages/performance/course-learning/detail",
		query: {
			id: task.id,
			type: task.taskType,
			courseId: task.courseId,
		},
	});
}

function openSubmit(task: CourseLearningTaskRecord) {
	router.push({
		path: "/pages/performance/course-learning/submit",
		query: {
			id: task.id,
			type: task.taskType,
			courseId: task.courseId,
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

function courseExamStatusLabel(value?: string | null) {
	return dict.getLabel(COURSE_LEARNING_EXAM_STATUS_DICT_KEY, value) || value || "未知";
}

function courseExamStatusTone(value?: string | null): "info" | "warning" | "success" | "error" {
	const tone = dict.getMeta(COURSE_LEARNING_EXAM_STATUS_DICT_KEY, value)?.tone;
	return tone === "success" || tone === "warning" ? tone : tone === "danger" ? "error" : "info";
}

onShow(() => {
	syncCourseIdInput();
	load();
});

onPullDownRefresh(async () => {
	await load();
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.course-page {
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

.course-entry,
.course-panel,
.exam-card,
.task-card,
.course-stat {
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 12rpx 30rpx rgba(34, 56, 99, 0.06);
}

.course-entry {
	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18rpx;
		margin-top: 8rpx;
	}

	&__hint {
		display: block;
		margin-top: 18rpx;
		font-size: 22rpx;
		line-height: 1.7;
		color: #748198;
	}
}

.course-stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18rpx;
}

.course-stat {
	&__label {
		display: block;
		font-size: 22rpx;
		color: #748198;
	}

	&__value {
		display: block;
		margin-top: 12rpx;
		font-size: 38rpx;
		font-weight: 700;
		color: #1e4db7;
	}

	&__value--small {
		font-size: 28rpx;
	}
}

.course-panel {
	&__section {
		margin-top: 24rpx;
	}
}

.exam-card {
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

	&__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16rpx;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 1.6;
		color: #4f5c74;
	}

	&__summary {
		display: block;
		margin-top: 22rpx;
		font-size: 24rpx;
		line-height: 1.7;
		color: #4f5c74;
	}
}

.task-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.task-card {
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
		margin-top: 24rpx;
	}
}
</style>
