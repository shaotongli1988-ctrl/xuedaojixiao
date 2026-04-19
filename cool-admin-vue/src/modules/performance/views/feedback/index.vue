<!-- 文件职责：承接模块 5 的 360 环评任务列表、任务发起、反馈填写和汇总查看主链；不负责后端评分口径、匿名策略或其他绩效模块逻辑；依赖 feedback service、基础用户列表接口和反馈相关抽屉/表单组件；维护重点是页面只调用统一后端接口，不在前端做二次统计或补算。 -->
<template>
	<div v-if="canAccess" class="feedback-page">
		<el-card shadow="never">
			<div class="feedback-page__toolbar">
				<div class="feedback-page__toolbar-left">
					<el-input
						v-model="filters.title"
						placeholder="按任务标题筛选"
						clearable
						style="width: 220px"
					/>
					<el-select
						v-model="filters.employeeId"
						placeholder="被评价人"
						clearable
						filterable
						style="width: 180px"
					>
						<el-option
							v-for="item in userOptions"
							:key="item.id"
							:label="item.name"
							:value="item.id"
						/>
					</el-select>
					<el-select
						v-model="filters.status"
						placeholder="状态"
						clearable
						style="width: 160px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</div>

				<div class="feedback-page__toolbar-right">
					<el-button @click="refresh">查询</el-button>
					<el-button v-if="canCreateTask" type="primary" @click="openCreate">
						发起环评任务
					</el-button>
					<el-button v-if="showExportButton" @click="handleExport">导出汇总</el-button>
				</div>
			</div>
		</el-card>

		<div class="feedback-page__content">
			<el-card shadow="never" class="feedback-page__list-card">
				<template #header>
					<div class="feedback-page__header">
						<div class="feedback-page__header-main">
							<h2>360 环评任务</h2>
							<el-tag effect="plain">模块 5</el-tag>
						</div>
						<el-tag effect="plain" type="info">任务列表区</el-tag>
					</div>
				</template>

				<el-table
					:data="rows"
					border
					highlight-current-row
					v-loading="tableLoading"
					@current-change="handleCurrentChange"
				>
					<el-table-column prop="title" label="任务标题" min-width="220" />
					<el-table-column prop="employeeName" label="被评价人" min-width="120" />
					<el-table-column prop="assessmentId" label="来源评估单" width="120">
						<template #default="{ row }">
							{{ row.assessmentId || '-' }}
						</template>
					</el-table-column>
					<el-table-column prop="deadline" label="截止时间" min-width="170">
						<template #default="{ row }">
							{{ row.deadline || '未设置' }}
						</template>
					</el-table-column>
					<el-table-column label="提交进度" min-width="140">
						<template #default="{ row }">
							{{ row.submittedCount ?? 0 }} / {{ row.totalCount ?? 0 }}
						</template>
					</el-table-column>
					<el-table-column prop="status" label="状态" width="120">
						<template #default="{ row }">
							<el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="updateTime" label="更新时间" min-width="170" />
					<el-table-column label="操作" fixed="right" min-width="340">
					<template #default="{ row }">
						<el-button text @click="inspectTask(row)">查看任务</el-button>
						<el-button
							v-if="canViewSourceAssessment(row)"
							text
							type="primary"
							@click="goSourceAssessment(row.assessmentId!)"
						>
							来源评估单
						</el-button>
						<el-button
							v-if="canSubmitFeedback(row)"
							text
								type="primary"
								@click="openSubmit(row)"
							>
								填写反馈
							</el-button>
							<el-button
								v-if="canViewSummary"
								text
								type="success"
								@click="openSummary(row)"
							>
								查看汇总
							</el-button>
						</template>
					</el-table-column>
				</el-table>

				<div class="feedback-page__pagination">
					<el-pagination
						background
						layout="total, prev, pager, next"
						:current-page="pagination.page"
						:page-size="pagination.size"
						:total="pagination.total"
						@current-change="changePage"
					/>
				</div>
			</el-card>

			<el-card shadow="never" class="feedback-page__summary-card">
				<template #header>
					<div class="feedback-page__header">
						<div class="feedback-page__header-main">
							<h2>当前任务汇总</h2>
							<el-tag effect="plain" type="warning">汇总结果区</el-tag>
						</div>
						<el-button
							v-if="selectedTask && canViewSummary"
							text
							type="primary"
							@click="openSummary(selectedTask)"
						>
							展开详情
						</el-button>
					</div>
				</template>

				<el-empty
					v-if="!selectedTask"
					description="请选择一条环评任务查看后端汇总结果"
				/>

				<div v-else class="feedback-page__summary-panel" v-loading="summaryLoading">
					<el-descriptions :column="1" border>
						<el-descriptions-item label="任务标题">
							{{ selectedTask.title || '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="被评价人">
							{{ selectedTask.employeeName || selectedTask.employeeId || '-' }}
						</el-descriptions-item>
						<el-descriptions-item label="截止时间">
							{{ selectedTask.deadline || '未设置' }}
						</el-descriptions-item>
						<el-descriptions-item label="任务状态">
							{{ statusLabel(selectedTask.status) }}
						</el-descriptions-item>
					</el-descriptions>

					<el-row :gutter="12">
						<el-col :span="8">
							<el-card shadow="never">
								<div class="feedback-page__metric-label">平均分</div>
								<div class="feedback-page__metric-value">
									{{ formatScore(selectedSummary?.averageScore) }}
								</div>
							</el-card>
						</el-col>
						<el-col :span="8">
							<el-card shadow="never">
								<div class="feedback-page__metric-label">已提交</div>
								<div class="feedback-page__metric-value">
									{{ selectedSummary?.submittedCount ?? selectedTask.submittedCount ?? 0 }}
								</div>
							</el-card>
						</el-col>
						<el-col :span="8">
							<el-card shadow="never">
								<div class="feedback-page__metric-label">应提交</div>
								<div class="feedback-page__metric-value">
									{{ selectedSummary?.totalCount ?? selectedTask.totalCount ?? 0 }}
								</div>
							</el-card>
						</el-col>
					</el-row>

					<el-alert
						:title="
							canViewRecordDetails
								? '当前账号可查看后端返回的单条反馈记录'
								: '当前账号仅可查看汇总结果，单条反馈内容不在此展示'
						"
						:type="canViewRecordDetails ? 'success' : 'info'"
						:closable="false"
						show-icon
					/>

					<div class="feedback-page__actions">
						<el-button
							v-if="canSubmitFeedback(selectedTask)"
							type="primary"
							plain
							@click="openSubmit(selectedTask)"
						>
							填写反馈
						</el-button>
						<el-button
							v-if="canViewSummary"
							type="success"
							plain
							@click="openSummary(selectedTask)"
						>
							查看完整汇总
						</el-button>
					</div>
				</div>
			</el-card>
		</div>

		<el-dialog
			v-model="formVisible"
			title="发起环评任务"
			width="860px"
			destroy-on-close
		>
			<feedback-task-form
				:model-value="form"
				:users="userOptions"
				:loading="submitLoading"
				@update:model-value="updateForm"
				@submit="submitTask"
				@cancel="formVisible = false"
			/>
		</el-dialog>

		<feedback-submit-drawer
			v-model="submitVisible"
			:task="submitTaskRecord"
			:loading="submitLoading"
			@submit="submitFeedback"
		/>

		<feedback-summary-drawer
			v-model="summaryVisible"
			:task="summaryTask"
			:summary="summaryRecord"
			:loading="summaryLoading"
			:can-view-records="canViewRecordDetails"
		/>
	</div>

	<el-card v-else shadow="never">
		<el-empty description="当前账号没有该页面权限" />
	</el-card>
</template>

<script lang="ts" setup>
defineOptions({
	name: 'performance-feedback'
});

import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { checkPerm } from '/$/base/utils/permission';
import { exportJsonToExcel } from '/@/plugins/excel/utils';
import { service } from '/@/cool';
import { useRoute, useRouter } from 'vue-router';
import FeedbackSubmitDrawer from '../../components/feedback-submit-drawer.vue';
import FeedbackSummaryDrawer from '../../components/feedback-summary-drawer.vue';
import FeedbackTaskForm from '../../components/feedback-task-form.vue';
import { performanceAssessmentService } from '../../service/assessment';
import {
	type FeedbackExportRow,
	type FeedbackSummary,
	type FeedbackTaskRecord,
	type UserOption,
	createEmptyFeedbackTask
} from '../../types';
import { performanceFeedbackService } from '../../service/feedback';
import { loadUserOptions } from '../../utils/lookup-options.js';
import {
	consumeRoutePreset,
	firstQueryValue,
	normalizeQueryNumber
} from '../../utils/route-preset.js';

const route = useRoute();
const router = useRouter();
const rows = ref<FeedbackTaskRecord[]>([]);
const userOptions = ref<UserOption[]>([]);
const tableLoading = ref(false);
const submitLoading = ref(false);
const summaryLoading = ref(false);
const formVisible = ref(false);
const submitVisible = ref(false);
const summaryVisible = ref(false);
const selectedTask = ref<FeedbackTaskRecord | null>(null);
const submitTaskRecord = ref<FeedbackTaskRecord | null>(null);
const summaryTask = ref<FeedbackTaskRecord | null>(null);
const selectedSummary = ref<FeedbackSummary | null>(null);
const summaryRecord = ref<FeedbackSummary | null>(null);
const form = reactive(createEmptyFeedbackTask());

const filters = reactive({
	title: '',
	employeeId: undefined as number | undefined,
	status: ''
});

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0
});

const statusOptions = [
	{ label: '草稿', value: 'draft' },
	{ label: '进行中', value: 'running' },
	{ label: '已关闭', value: 'closed' }
];

const canAccess = computed(() => checkPerm(performanceFeedbackService.permission.page));
const canCreateTask = computed(() => checkPerm(performanceFeedbackService.permission.add));
const canViewSummary = computed(() => checkPerm(performanceFeedbackService.permission.summary));
const showExportButton = computed(() => checkPerm(performanceFeedbackService.permission.export));
const canViewRecordDetails = computed(() => canCreateTask.value);

onMounted(async () => {
	await loadUsers();
	await refresh();
	await consumeCreatePresetQuery();
});

async function loadUsers() {
	userOptions.value = await loadUserOptions(
		() =>
			service.base.sys.user.page({
			page: 1,
			size: 200
			}),
		(error: any) => {
			ElMessage.warning(error.message || '用户选项加载失败');
		}
	);
}

async function refresh() {
	if (!canAccess.value) {
		return;
	}

	tableLoading.value = true;

	try {
		const result = await performanceFeedbackService.fetchPage({
			page: pagination.page,
			size: pagination.size,
			keyword: filters.title || undefined,
			employeeId: filters.employeeId || undefined,
			status: filters.status || undefined
		});

		rows.value = result.list || [];
		pagination.total = result.pagination?.total || 0;

		if (!rows.value.length) {
			selectedTask.value = null;
			selectedSummary.value = null;
			return;
		}

		const currentId = selectedTask.value?.id;
		const fallback = rows.value.find(item => item.id === currentId) || rows.value[0];
		await inspectTask(fallback, false);
	} catch (error: any) {
		rows.value = [];
		selectedTask.value = null;
		selectedSummary.value = null;
		ElMessage.error(error.message || '环评任务列表加载失败');
	} finally {
		tableLoading.value = false;
	}
}

function changePage(page: number) {
	pagination.page = page;
	refresh();
}

function openCreate() {
	Object.assign(form, createEmptyFeedbackTask());
	formVisible.value = true;
}

async function consumeCreatePresetQuery() {
	await consumeRoutePreset({
		route,
		router,
		keys: ['openCreate', 'assessmentId', 'employeeId'],
		parse: query => ({
			shouldOpenCreate: firstQueryValue(query.openCreate) === '1',
			assessmentId: normalizeQueryNumber(query.assessmentId),
			employeeId: normalizeQueryNumber(query.employeeId)
		}),
		shouldConsume: payload => Boolean(payload.shouldOpenCreate && canCreateTask.value),
		consume: payload => {
			openCreate();
			form.assessmentId = payload.assessmentId ?? null;
			form.employeeId = payload.employeeId;
		}
	});
}

function updateForm(value: FeedbackTaskRecord) {
	Object.assign(form, createEmptyFeedbackTask(), value);
}

async function submitTask(record: FeedbackTaskRecord) {
	submitLoading.value = true;

	try {
		await performanceFeedbackService.createTask(record);
		ElMessage.success('环评任务创建成功');
		formVisible.value = false;
		await refresh();
	} catch (error: any) {
		ElMessage.error(error.message || '环评任务创建失败');
	} finally {
		submitLoading.value = false;
	}
}

async function inspectTask(row: FeedbackTaskRecord, openDrawer = false) {
	if (!row.id) {
		return;
	}

	summaryLoading.value = true;

	try {
		const [task, summary] = await Promise.all([
			performanceFeedbackService.fetchInfo({ id: row.id }),
			canViewSummary.value
				? performanceFeedbackService.fetchSummary({ taskId: row.id })
				: Promise.resolve(null)
		]);

		selectedTask.value = task;
		selectedSummary.value = summary;

		if (openDrawer) {
			summaryTask.value = task;
			summaryRecord.value = summary;
			summaryVisible.value = true;
		}
	} catch (error: any) {
		ElMessage.error(error.message || '环评任务详情加载失败');
	} finally {
		summaryLoading.value = false;
	}
}

async function handleCurrentChange(row?: FeedbackTaskRecord) {
	if (!row?.id) {
		return;
	}

	await inspectTask(row, false);
}

async function openSubmit(row: FeedbackTaskRecord) {
	if (!row.id) {
		return;
	}

	try {
		submitTaskRecord.value = await performanceFeedbackService.fetchInfo({
			id: row.id
		});
		submitVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '环评任务详情加载失败');
	}
}

async function submitFeedback(payload: {
	taskId: number;
	score: number;
	content?: string;
	relationType: string;
}) {
	submitLoading.value = true;

	try {
		await performanceFeedbackService.submitFeedback(payload);
		ElMessage.success('反馈提交成功');
		submitVisible.value = false;
		await refresh();
		if (selectedTask.value?.id === payload.taskId) {
			await inspectTask(selectedTask.value, false);
		}
	} catch (error: any) {
		ElMessage.error(error.message || '反馈提交失败');
	} finally {
		submitLoading.value = false;
	}
}

async function openSummary(row: FeedbackTaskRecord) {
	if (!row.id) {
		return;
	}

	summaryLoading.value = true;

	try {
		const [task, summary] = await Promise.all([
			performanceFeedbackService.fetchInfo({ id: row.id }),
			performanceFeedbackService.fetchSummary({ taskId: row.id })
		]);

		summaryTask.value = task;
		summaryRecord.value = summary;
		summaryVisible.value = true;
	} catch (error: any) {
		ElMessage.error(error.message || '环评汇总加载失败');
	} finally {
		summaryLoading.value = false;
	}
}

async function handleExport() {
	try {
		const exportRows = await performanceFeedbackService.exportSummary({
			keyword: filters.title || undefined,
			employeeId: filters.employeeId || undefined,
			status: filters.status || undefined
		});

		exportJsonToExcel({
			header: [
				'任务ID',
				'来源评估单',
				'被评价人ID',
				'任务标题',
				'截止时间',
				'平均分',
				'已提交',
				'应提交'
			],
			data: (exportRows || []).map((item: FeedbackExportRow) => [
				item.taskId,
				item.assessmentId ?? '',
				item.employeeId,
				item.title,
				item.deadline || '',
				Number(item.averageScore ?? 0).toFixed(2),
				item.submittedCount ?? 0,
				item.totalCount ?? 0
			]),
			filename: `feedback-summary-${Date.now()}`
		});
	} catch (error: any) {
		ElMessage.error(error.message || '导出失败');
	}
}

function canSubmitFeedback(row: FeedbackTaskRecord) {
	return checkPerm(performanceFeedbackService.permission.submit) && row.status !== 'closed';
}

function canViewSourceAssessment(row: FeedbackTaskRecord) {
	return Boolean(row.assessmentId) && resolveAssessmentPagePath() !== '';
}

async function goSourceAssessment(assessmentId: number) {
	const path = resolveAssessmentPagePath();

	if (!path) {
		return;
	}

	await router.push({
		path,
		query: {
			openDetail: '1',
			assessmentId: String(assessmentId)
		}
	});
}

function resolveAssessmentPagePath() {
	if (checkPerm(performanceAssessmentService.permission.page)) {
		return '/performance/initiated';
	}

	if (checkPerm(performanceAssessmentService.permission.myPage)) {
		return '/performance/my-assessment';
	}

	if (checkPerm(performanceAssessmentService.permission.pendingPage)) {
		return '/performance/pending';
	}

	return '';
}

function statusLabel(status?: string) {
	const item = statusOptions.find(option => option.value === status);
	return item?.label || status || '-';
}

function statusTagType(status?: string) {
	switch (status) {
		case 'running':
			return 'warning';
		case 'closed':
			return 'success';
		default:
			return 'info';
	}
}

function formatScore(value?: number) {
	return Number(value || 0).toFixed(2);
}
</script>

<style lang="scss" scoped>
.feedback-page {
	display: grid;
	gap: 16px;

	&__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}

	&__toolbar-left,
	&__toolbar-right {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	&__content {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
		gap: 16px;
		align-items: start;
	}

	&__list-card,
	&__summary-card {
		min-width: 0;
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	&__header-main {
		display: flex;
		align-items: center;
		gap: 12px;

		h2 {
			margin: 0;
			font-size: 18px;
		}
	}

	&__pagination {
		display: flex;
		justify-content: flex-end;
		padding-top: 16px;
	}

	&__summary-panel {
		display: grid;
		gap: 16px;
	}

	&__metric-label {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__metric-value {
		margin-top: 8px;
		font-size: 28px;
		font-weight: 600;
		color: var(--el-text-color-primary);
	}

	&__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
}

@media (max-width: 1200px) {
	.feedback-page {
		&__content {
			grid-template-columns: 1fr;
		}
	}
}
</style>
