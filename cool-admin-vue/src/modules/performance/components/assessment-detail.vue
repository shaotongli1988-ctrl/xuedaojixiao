<template>
	<div class="assessment-detail" v-if="assessment">
		<el-descriptions :column="2" border>
			<el-descriptions-item label="编号">{{ assessment.code || '-' }}</el-descriptions-item>
			<el-descriptions-item label="状态">{{ assessment.status || '-' }}</el-descriptions-item>
			<el-descriptions-item label="被考核人">
				{{ assessment.employeeName || assessment.employeeId || '-' }}
			</el-descriptions-item>
			<el-descriptions-item label="评估负责人">
				{{ assessment.assessorName || assessment.assessorId || '-' }}
			</el-descriptions-item>
			<el-descriptions-item label="所属部门">
				{{ assessment.departmentName || assessment.departmentId || '-' }}
			</el-descriptions-item>
			<el-descriptions-item label="周期">
				{{ assessment.periodType }} / {{ assessment.periodValue }}
			</el-descriptions-item>
			<el-descriptions-item label="目标完成率">
				{{ Number(assessment.targetCompletion || 0).toFixed(2) }}%
			</el-descriptions-item>
			<el-descriptions-item label="总分 / 等级">
				{{ Number(assessment.totalScore || 0).toFixed(2) }} / {{ assessment.grade || '-' }}
			</el-descriptions-item>
			<el-descriptions-item label="提交时间">
				{{ assessment.submitTime || '-' }}
			</el-descriptions-item>
			<el-descriptions-item label="审批时间">
				{{ assessment.approveTime || '-' }}
			</el-descriptions-item>
		</el-descriptions>

		<el-card shadow="never">
			<template #header>员工自评</template>
			<div class="assessment-detail__text">{{ assessment.selfEvaluation || '暂无' }}</div>
		</el-card>

		<el-card shadow="never">
			<template #header>经理反馈</template>
			<div class="assessment-detail__text">{{ assessment.managerFeedback || '暂无' }}</div>
		</el-card>

		<el-card shadow="never">
			<template #header>评分明细</template>
			<score-item-table :model-value="assessment.scoreItems || []" readonly />
		</el-card>
	</div>
</template>

<script lang="ts" setup>
import type { AssessmentRecord } from '../types';
import ScoreItemTable from './score-item-table.vue';

defineProps<{
	assessment: AssessmentRecord | null;
}>();
</script>

<style lang="scss" scoped>
.assessment-detail {
	display: grid;
	gap: var(--app-space-4);

	&__text {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--app-text-secondary);
	}
}
</style>
