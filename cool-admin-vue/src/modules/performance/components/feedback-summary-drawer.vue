<!-- 文件职责：承接环评汇总结果抽屉，展示后端返回的 averageScore/submittedCount/totalCount 与可选 records 列表；不负责汇总计算、权限裁剪判定或单条反馈编辑；依赖环评任务与汇总类型定义以及 Element Plus 组件；维护重点是 records 仅在外层明确允许时才展示。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		title="环评汇总"
		size="760px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="task" class="feedback-summary-drawer" v-loading="loading">
			<el-descriptions :column="2" border>
				<el-descriptions-item label="任务标题">
					{{ task.title || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="被评价人">
					{{ task.employeeName || task.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="来源评估单">
					{{ task.assessmentId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="截止时间">
					{{ task.deadline || '未设置' }}
				</el-descriptions-item>
			</el-descriptions>

			<el-row :gutter="12">
				<el-col :span="8">
					<el-card shadow="never">
						<div class="feedback-summary-drawer__metric-label">平均分</div>
						<div class="feedback-summary-drawer__metric-value">
							{{ Number(summary?.averageScore || 0).toFixed(2) }}
						</div>
					</el-card>
				</el-col>
				<el-col :span="8">
					<el-card shadow="never">
						<div class="feedback-summary-drawer__metric-label">已提交</div>
						<div class="feedback-summary-drawer__metric-value">
							{{ summary?.submittedCount ?? task.submittedCount ?? 0 }}
						</div>
					</el-card>
				</el-col>
				<el-col :span="8">
					<el-card shadow="never">
						<div class="feedback-summary-drawer__metric-label">应提交</div>
						<div class="feedback-summary-drawer__metric-value">
							{{ summary?.totalCount ?? task.totalCount ?? 0 }}
						</div>
					</el-card>
				</el-col>
			</el-row>

			<el-card shadow="never">
				<template #header>汇总说明</template>
				<el-alert
					:title="
						canViewRecords
							? '当前账号可查看后端返回的单条反馈记录'
							: '当前账号仅可查看汇总结果，单条反馈内容按权限不展示'
					"
					:type="canViewRecords ? 'success' : 'info'"
					:closable="false"
					show-icon
				/>
			</el-card>

			<el-card shadow="never">
				<template #header>单条反馈记录</template>
				<el-empty v-if="!canViewRecords" description="当前角色仅允许查看汇总结果" />
				<el-empty
					v-else-if="!summary?.records?.length"
					description="暂无可展示的单条反馈记录"
				/>
				<el-table v-else :data="summary.records" border>
					<el-table-column prop="feedbackUserName" label="评价人" min-width="120">
						<template #default="{ row }">
							{{ row.feedbackUserName || row.feedbackUserId || '-' }}
						</template>
					</el-table-column>
					<el-table-column prop="relationType" label="关系" width="120">
						<template #default="{ row }">
							{{ relationTypeLabel(row.relationType) }}
						</template>
					</el-table-column>
					<el-table-column prop="score" label="评分" width="100" />
					<el-table-column prop="status" label="状态" width="120">
						<template #default="{ row }">
							<el-tag :type="recordStatusTagType(row.status)">
								{{ recordStatusLabel(row.status) }}
							</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="submitTime" label="提交时间" min-width="170">
						<template #default="{ row }">
							{{ row.submitTime || '-' }}
						</template>
					</el-table-column>
					<el-table-column prop="content" label="反馈内容" min-width="220">
						<template #default="{ row }">
							<div class="feedback-summary-drawer__content">
								{{ row.content || '暂无反馈内容' }}
							</div>
						</template>
					</el-table-column>
				</el-table>
			</el-card>

			<div class="feedback-summary-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button
					v-if="showSourceAssessmentButton && task?.assessmentId"
					type="primary"
					plain
					@click="goSourceAssessment(task.assessmentId)"
				>
					查看来源评估单
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { checkPerm } from '/$/base/utils/permission';
import { useDict } from '/$/dict';
import type { FeedbackSummary, FeedbackTaskRecord } from '../types';
import { performanceAssessmentService } from '../service/assessment';

const FEEDBACK_RECORD_STATUS_DICT_KEY = 'performance.feedback.recordStatus';
const FEEDBACK_RELATION_TYPE_DICT_KEY = 'performance.feedback.relationType';

const props = defineProps<{
	modelValue: boolean;
	task: FeedbackTaskRecord | null;
	summary: FeedbackSummary | null;
	loading?: boolean;
	canViewRecords?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const router = useRouter();
const { dict } = useDict();

const showSourceAssessmentButton = computed(() => {
	return (
		checkPerm(performanceAssessmentService.permission.info) &&
		resolveAssessmentPagePath() !== ''
	);
});

function relationTypeLabel(value?: string) {
	return dict.getLabel(FEEDBACK_RELATION_TYPE_DICT_KEY, value) || value || '-';
}

function recordStatusLabel(value?: string) {
	return dict.getLabel(FEEDBACK_RECORD_STATUS_DICT_KEY, value) || value || '-';
}

function recordStatusTagType(value?: string) {
	return dict.getMeta(FEEDBACK_RECORD_STATUS_DICT_KEY, value)?.tone || 'info';
}

async function goSourceAssessment(assessmentId: number) {
	const path = resolveAssessmentPagePath();

	if (!path) {
		return;
	}

	emit('update:modelValue', false);

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
</script>

<style lang="scss" scoped>
@use '../../../styles/patterns.overlay-responsive.scss' as overlayResponsive;

.feedback-summary-drawer {
	display: grid;
	gap: var(--app-space-4);

	&__metric-label {
		font-size: var(--app-font-size-caption);
		color: var(--app-text-tertiary);
	}

	&__metric-value {
		margin-top: var(--app-space-2);
		font-size: 28px;
		font-weight: 600;
		color: var(--app-text-primary);
	}

	&__content {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--app-text-secondary);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--app-space-3);
	}

	@include overlayResponsive.overlay-responsive;
}
</style>
