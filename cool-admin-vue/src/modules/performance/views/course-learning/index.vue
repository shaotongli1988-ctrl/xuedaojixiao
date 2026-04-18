<!-- 文件职责：承接主题14课程关联学习入口下的背诵/练习任务和考试结果摘要；不负责课程管理主链、独立AI平台、题库配置和移动端；依赖 course-learning service、路由 query 中的 courseId 与 Element Plus 组件；维护重点是只能消费冻结接口，缺少 courseId 时必须停留在引导态。 -->
<template>
	<div v-if="canAccess" class="course-learning-page">
		<el-card shadow="never">
			<div class="course-learning-page__hero">
				<div>
					<div class="course-learning-page__eyebrow">主题 14</div>
					<h2>培训学习与考试增强</h2>
					<p>只覆盖课程关联学习入口、背诵/练习提交和考试结果摘要。</p>
				</div>
				<el-tag effect="plain" type="success">员工自助</el-tag>
			</div>

			<div class="course-learning-page__entry">
				<el-input-number
					v-model="courseIdInput"
					:min="1"
					:controls="false"
					placeholder="请输入课程 ID"
				/>
				<el-button type="primary" @click="applyCourseId">进入课程学习</el-button>
				<el-button @click="reloadCurrentCourse">刷新当前课程</el-button>
				<span class="course-learning-page__hint">当前课程 ID：{{ courseId || '-' }}</span>
			</div>
		</el-card>

		<template v-if="courseId">
			<el-row :gutter="16">
				<el-col :xs="24" :md="8">
					<el-card shadow="never" class="course-learning-page__stat">
						<div class="course-learning-page__stat-label">背诵任务</div>
						<div class="course-learning-page__stat-value">{{ recitePagination.total }}</div>
					</el-card>
				</el-col>
				<el-col :xs="24" :md="8">
					<el-card shadow="never" class="course-learning-page__stat">
						<div class="course-learning-page__stat-label">练习任务</div>
						<div class="course-learning-page__stat-value">{{ practicePagination.total }}</div>
					</el-card>
				</el-col>
				<el-col :xs="24" :md="8">
					<el-card shadow="never" class="course-learning-page__stat">
						<div class="course-learning-page__stat-label">结果摘要状态</div>
						<div class="course-learning-page__stat-value">
							{{ examSummary ? examStatusLabel(examSummary.resultStatus) : '-' }}
						</div>
					</el-card>
				</el-col>
			</el-row>

			<el-card shadow="never">
				<template #header>
					<div class="course-learning-page__header">
						<div>
							<h3>{{ currentCourseTitle || '课程学习任务' }}</h3>
							<p>列表只返回本人任务摘要，详情中才展示提交内容。</p>
						</div>
						<el-tag effect="plain" type="info">
							{{ activeTab === 'exam' ? '结果摘要' : '任务列表' }}
						</el-tag>
					</div>
				</template>

				<el-tabs v-model="activeTab">
					<el-tab-pane label="AI 背诵" name="recite">
						<div class="course-learning-page__toolbar">
							<el-select
								v-model="reciteStatus"
								clearable
								placeholder="按状态筛选"
								style="width: 180px"
							>
								<el-option
									v-for="item in taskStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-button @click="fetchReciteTasks">刷新背诵任务</el-button>
						</div>

						<el-table :data="reciteRows" border v-loading="reciteLoading">
							<el-table-column prop="title" label="任务标题" min-width="180" />
							<el-table-column prop="status" label="状态" width="120">
								<template #default="{ row }">
									<el-tag :type="taskStatusTag(row.status)">{{ taskStatusLabel(row.status) }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column prop="latestScore" label="最近分数" width="100">
								<template #default="{ row }">
									{{ row.latestScore ?? '-' }}
								</template>
							</el-table-column>
							<el-table-column prop="submittedAt" label="提交时间" min-width="170" />
							<el-table-column prop="evaluatedAt" label="评估时间" min-width="170" />
							<el-table-column label="操作" width="180" fixed="right">
								<template #default="{ row }">
									<el-button text @click="openTaskDetail(row, 'recite')">详情</el-button>
									<el-button
										text
										type="primary"
										:disabled="row.status === 'evaluated'"
										@click="openTaskSubmit(row, 'recite')"
									>
										提交
									</el-button>
								</template>
							</el-table-column>
						</el-table>

						<div class="course-learning-page__pagination">
							<el-pagination
								background
								layout="total, prev, pager, next"
								:current-page="recitePagination.page"
								:page-size="recitePagination.size"
								:total="recitePagination.total"
								@current-change="changeRecitePage"
							/>
						</div>
					</el-tab-pane>

					<el-tab-pane label="AI 练习" name="practice">
						<div class="course-learning-page__toolbar">
							<el-select
								v-model="practiceStatus"
								clearable
								placeholder="按状态筛选"
								style="width: 180px"
							>
								<el-option
									v-for="item in taskStatusOptions"
									:key="item.value"
									:label="item.label"
									:value="item.value"
								/>
							</el-select>
							<el-button @click="fetchPracticeTasks">刷新练习任务</el-button>
						</div>

						<el-table :data="practiceRows" border v-loading="practiceLoading">
							<el-table-column prop="title" label="任务标题" min-width="180" />
							<el-table-column prop="status" label="状态" width="120">
								<template #default="{ row }">
									<el-tag :type="taskStatusTag(row.status)">{{ taskStatusLabel(row.status) }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column prop="latestScore" label="最近分数" width="100">
								<template #default="{ row }">
									{{ row.latestScore ?? '-' }}
								</template>
							</el-table-column>
							<el-table-column prop="submittedAt" label="提交时间" min-width="170" />
							<el-table-column prop="evaluatedAt" label="评估时间" min-width="170" />
							<el-table-column label="操作" width="180" fixed="right">
								<template #default="{ row }">
									<el-button text @click="openTaskDetail(row, 'practice')">详情</el-button>
									<el-button
										text
										type="primary"
										:disabled="row.status === 'evaluated'"
										@click="openTaskSubmit(row, 'practice')"
									>
										提交
									</el-button>
								</template>
							</el-table-column>
						</el-table>

						<div class="course-learning-page__pagination">
							<el-pagination
								background
								layout="total, prev, pager, next"
								:current-page="practicePagination.page"
								:page-size="practicePagination.size"
								:total="practicePagination.total"
								@current-change="changePracticePage"
							/>
						</div>
					</el-tab-pane>

					<el-tab-pane label="考试 / 结果摘要" name="exam">
						<el-skeleton :loading="examLoading" animated :rows="5">
							<template #default>
								<el-descriptions v-if="examSummary" :column="2" border>
									<el-descriptions-item label="课程标题">
										{{ examSummary.courseTitle }}
									</el-descriptions-item>
									<el-descriptions-item label="结果状态">
										<el-tag :type="examStatusTag(examSummary.resultStatus)">
											{{ examStatusLabel(examSummary.resultStatus) }}
										</el-tag>
									</el-descriptions-item>
									<el-descriptions-item label="最近分数">
										{{ examSummary.latestScore ?? '-' }}
									</el-descriptions-item>
									<el-descriptions-item label="通过阈值">
										{{ examSummary.passThreshold ?? '-' }}
									</el-descriptions-item>
									<el-descriptions-item label="最近更新时间">
										{{ examSummary.updatedAt || '-' }}
									</el-descriptions-item>
									<el-descriptions-item label="结果摘要" :span="2">
										{{ examSummary.summaryText || '-' }}
									</el-descriptions-item>
								</el-descriptions>
							</template>
						</el-skeleton>
					</el-tab-pane>
				</el-tabs>
			</el-card>
		</template>

		<el-card v-else shadow="never">
			<el-empty description="缺少课程上下文，请先输入 courseId 或从课程入口携带查询参数进入" />
		</el-card>

		<el-dialog v-model="detailVisible" title="任务详情" width="760px" destroy-on-close>
			<el-skeleton :loading="detailLoading" animated :rows="6">
				<template #default>
					<el-descriptions v-if="detailTask" :column="2" border>
						<el-descriptions-item label="课程标题">
							{{ detailTask.courseTitle }}
						</el-descriptions-item>
						<el-descriptions-item label="任务标题">
							{{ detailTask.title }}
						</el-descriptions-item>
						<el-descriptions-item label="任务类型">
							{{ detailTask.taskType === 'recite' ? 'AI 背诵' : 'AI 练习' }}
						</el-descriptions-item>
						<el-descriptions-item label="状态">
							{{ taskStatusLabel(detailTask.status) }}
						</el-descriptions-item>
						<el-descriptions-item label="最近分数">
							{{ detailTask.latestScore ?? '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="评估时间">
							{{ detailTask.evaluatedAt || '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="任务内容" :span="2">
							{{ detailTask.promptText || '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="结果摘要" :span="2">
							{{ detailTask.feedbackSummary || '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="我的提交" :span="2">
							{{ detailTask.submissionText || '-' }}
						</el-descriptions-item>
					</el-descriptions>
				</template>
			</el-skeleton>
		</el-dialog>

		<el-dialog v-model="submitVisible" title="提交任务" width="720px" destroy-on-close>
			<el-alert
				type="info"
				show-icon
				:closable="false"
				title="首批只允许文本提交；提交后由服务端生成结果摘要。"
			/>
			<el-form label-width="90px" class="course-learning-page__submit-form">
				<el-form-item label="任务标题">
					<div>{{ submitTask?.title || '-' }}</div>
				</el-form-item>
				<el-form-item label="任务内容">
					<div>{{ submitTask?.promptText || '-' }}</div>
				</el-form-item>
				<el-form-item label="提交内容">
					<el-input
						v-model="submissionText"
						type="textarea"
						:rows="8"
						maxlength="4000"
						show-word-limit
						placeholder="请输入本次背诵或练习的文本内容"
					/>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="submitVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitLoading" @click="submitCurrentTask">
					提交并生成结果摘要
				</el-button>
			</template>
		</el-dialog>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-course-learning'
});

import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { checkPerm } from '/$/base/utils/permission';
import type {
	CourseExamSummaryRecord,
	CourseLearningTaskRecord,
	CourseLearningTaskStatus
} from '../../course-learning';
import {
	performanceCourseExamService,
	performanceCoursePracticeService,
	performanceCourseReciteService
} from '../../service/course-learning';

type LearningTab = 'recite' | 'practice' | 'exam';
type TagType = 'info' | 'success' | 'warning' | 'danger';

const TASK_STATUS_TAG_MAP: Record<CourseLearningTaskStatus, TagType> = {
	pending: 'info',
	submitted: 'warning',
	evaluated: 'success'
};

const EXAM_STATUS_TAG_MAP: Record<CourseExamSummaryRecord['resultStatus'], TagType> = {
	locked: 'info',
	pending: 'warning',
	passed: 'success',
	failed: 'danger'
};

const route = useRoute();
const router = useRouter();

const canAccess = computed(() => {
	return [
		'performance:courseRecite:page',
		'performance:coursePractice:page',
		'performance:courseExam:summary'
	].some(checkPerm);
});

const activeTab = ref<LearningTab>('recite');
const courseIdInput = ref<number | undefined>();
const reciteStatus = ref<CourseLearningTaskStatus | ''>('');
const practiceStatus = ref<CourseLearningTaskStatus | ''>('');

const reciteRows = ref<CourseLearningTaskRecord[]>([]);
const practiceRows = ref<CourseLearningTaskRecord[]>([]);
const examSummary = ref<CourseExamSummaryRecord | null>(null);
const detailTask = ref<CourseLearningTaskRecord | null>(null);
const submitTask = ref<CourseLearningTaskRecord | null>(null);
const submitTaskType = ref<'recite' | 'practice'>('recite');
const submissionText = ref('');

const reciteLoading = ref(false);
const practiceLoading = ref(false);
const examLoading = ref(false);
const detailLoading = ref(false);
const submitLoading = ref(false);
const detailVisible = ref(false);
const submitVisible = ref(false);

const recitePagination = ref({
	page: 1,
	size: 10,
	total: 0
});

const practicePagination = ref({
	page: 1,
	size: 10,
	total: 0
});

const taskStatusOptions = [
	{ label: '待完成', value: 'pending' },
	{ label: '已提交', value: 'submitted' },
	{ label: '已评估', value: 'evaluated' }
];

const courseId = computed(() => {
	const value = Number(route.query.courseId);
	return Number.isInteger(value) && value > 0 ? value : 0;
});

const currentCourseTitle = computed(() => {
	return (
		examSummary.value?.courseTitle ||
		reciteRows.value[0]?.courseTitle ||
		practiceRows.value[0]?.courseTitle ||
		''
	);
});

watch(
	() => route.query.courseId,
	value => {
		const numeric = Number(value);
		courseIdInput.value = Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
		if (courseId.value) {
			void reloadCurrentCourse();
		}
	},
	{ immediate: true }
);

watch(activeTab, value => {
	if (!courseId.value) {
		return;
	}
	if (value === 'recite') {
		void fetchReciteTasks();
		return;
	}
	if (value === 'practice') {
		void fetchPracticeTasks();
		return;
	}
	void fetchExamSummary();
});

async function applyCourseId() {
	if (!courseIdInput.value) {
		ElMessage.warning('请先输入课程 ID');
		return;
	}

	await router.replace({
		query: {
			...route.query,
			courseId: String(courseIdInput.value)
		}
	});
}

async function reloadCurrentCourse() {
	if (!courseId.value) {
		return;
	}
	await Promise.all([fetchReciteTasks(), fetchPracticeTasks(), fetchExamSummary()]);
}

async function fetchReciteTasks() {
	if (!courseId.value) {
		return;
	}
	reciteLoading.value = true;
	try {
		const data = await performanceCourseReciteService.fetchPage({
			page: recitePagination.value.page,
			size: recitePagination.value.size,
			courseId: courseId.value,
			status: reciteStatus.value || undefined
		});
		reciteRows.value = data.list || [];
		recitePagination.value = data.pagination;
	} finally {
		reciteLoading.value = false;
	}
}

async function fetchPracticeTasks() {
	if (!courseId.value) {
		return;
	}
	practiceLoading.value = true;
	try {
		const data = await performanceCoursePracticeService.fetchPage({
			page: practicePagination.value.page,
			size: practicePagination.value.size,
			courseId: courseId.value,
			status: practiceStatus.value || undefined
		});
		practiceRows.value = data.list || [];
		practicePagination.value = data.pagination;
	} finally {
		practiceLoading.value = false;
	}
}

async function fetchExamSummary() {
	if (!courseId.value) {
		return;
	}
	examLoading.value = true;
	try {
		examSummary.value = await performanceCourseExamService.fetchSummary({
			courseId: courseId.value
		});
	} finally {
		examLoading.value = false;
	}
}

async function openTaskDetail(
	row: CourseLearningTaskRecord,
	type: 'recite' | 'practice'
) {
	detailVisible.value = true;
	detailLoading.value = true;
	try {
		detailTask.value =
			type === 'recite'
				? await performanceCourseReciteService.fetchInfo({ id: row.id })
				: await performanceCoursePracticeService.fetchInfo({ id: row.id });
	} finally {
		detailLoading.value = false;
	}
}

async function openTaskSubmit(
	row: CourseLearningTaskRecord,
	type: 'recite' | 'practice'
) {
	submitVisible.value = true;
	submitLoading.value = false;
	submissionText.value = '';
	submitTaskType.value = type;
	submitTask.value =
		type === 'recite'
			? await performanceCourseReciteService.fetchInfo({ id: row.id })
			: await performanceCoursePracticeService.fetchInfo({ id: row.id });
	submissionText.value = submitTask.value.submissionText || '';
}

async function submitCurrentTask() {
	if (!submitTask.value) {
		return;
	}
	if (!submissionText.value.trim()) {
		ElMessage.warning('提交内容不能为空');
		return;
	}

	submitLoading.value = true;
	try {
		const result =
			submitTaskType.value === 'recite'
				? await performanceCourseReciteService.submitTask({
						id: submitTask.value.id,
						submissionText: submissionText.value
				  })
				: await performanceCoursePracticeService.submitTask({
						id: submitTask.value.id,
						submissionText: submissionText.value
				  });
		submitTask.value = result;
		submitVisible.value = false;
		ElMessage.success('提交成功');
		await reloadCurrentCourse();
	} finally {
		submitLoading.value = false;
	}
}

function changeRecitePage(page: number) {
	recitePagination.value.page = page;
	void fetchReciteTasks();
}

function changePracticePage(page: number) {
	practicePagination.value.page = page;
	void fetchPracticeTasks();
}

function taskStatusLabel(status: CourseLearningTaskStatus) {
	return (
		{
			pending: '待完成',
			submitted: '已提交',
			evaluated: '已评估'
		}[status] || status
	);
}

function taskStatusTag(status: CourseLearningTaskStatus): TagType {
	return TASK_STATUS_TAG_MAP[status];
}

function examStatusLabel(status: CourseExamSummaryRecord['resultStatus']) {
	return (
		{
			locked: '未解锁',
			pending: '待生成',
			passed: '已通过',
			failed: '未通过'
		}[status] || status
	);
}

function examStatusTag(status: CourseExamSummaryRecord['resultStatus']): TagType {
	return EXAM_STATUS_TAG_MAP[status];
}

onMounted(() => {
	if (courseId.value) {
		void reloadCurrentCourse();
	}
});
</script>

<style scoped>
.course-learning-page {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.course-learning-page__hero {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}

.course-learning-page__hero h2,
.course-learning-page__header h3 {
	margin: 0;
}

.course-learning-page__hero p,
.course-learning-page__header p {
	margin: 8px 0 0;
	color: var(--el-text-color-secondary);
}

.course-learning-page__eyebrow {
	margin-bottom: 8px;
	color: var(--el-color-primary);
	font-size: 13px;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.course-learning-page__entry {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-top: 20px;
}

.course-learning-page__hint {
	color: var(--el-text-color-secondary);
	font-size: 13px;
}

.course-learning-page__stat {
	height: 100%;
}

.course-learning-page__stat-label {
	color: var(--el-text-color-secondary);
	font-size: 13px;
}

.course-learning-page__stat-value {
	margin-top: 10px;
	font-size: 28px;
	font-weight: 700;
}

.course-learning-page__header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
}

.course-learning-page__toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
}

.course-learning-page__pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
}

.course-learning-page__submit-form {
	margin-top: 16px;
}

@media (max-width: 768px) {
	.course-learning-page__hero,
	.course-learning-page__header {
		flex-direction: column;
	}

	.course-learning-page__pagination {
		justify-content: flex-start;
	}
}
</style>
