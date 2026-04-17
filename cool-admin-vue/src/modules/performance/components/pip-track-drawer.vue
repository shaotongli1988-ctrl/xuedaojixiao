<!-- 文件职责：承接 PIP 详情展示与跟进提交；不负责列表筛选、创建编辑或完成关闭动作；依赖 PIP 类型与 Element Plus 抽屉、表单组件；维护重点是详情展示、跟进输入和状态显隐始终围绕同一条 PIP 记录。 -->
<template>
	<el-drawer
		:model-value="modelValue"
		:title="canTrack ? 'PIP 详情与跟进' : 'PIP 详情'"
		size="760px"
		@close="$emit('update:modelValue', false)"
	>
		<div v-if="pip" class="pip-track-drawer">
			<el-descriptions :column="2" border>
				<el-descriptions-item label="标题">{{ pip.title }}</el-descriptions-item>
				<el-descriptions-item label="状态">{{ statusLabel }}</el-descriptions-item>
				<el-descriptions-item label="员工">
					{{ pip.employeeName || pip.employeeId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="负责人">
					{{ pip.ownerName || pip.ownerId || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="来源评估单">
					{{ pip.assessmentId || '独立创建' }}
				</el-descriptions-item>
				<el-descriptions-item label="时间范围">
					{{ pip.startDate }} ~ {{ pip.endDate }}
				</el-descriptions-item>
				<el-descriptions-item label="更新时间">
					{{ pip.updateTime || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="结果总结">
					{{ pip.resultSummary || '暂无' }}
				</el-descriptions-item>
			</el-descriptions>

			<el-card shadow="never">
				<template #header>改进目标</template>
				<div class="pip-track-drawer__text">{{ pip.improvementGoal || '暂无' }}</div>
			</el-card>

			<el-card shadow="never">
				<template #header>来源原因</template>
				<div class="pip-track-drawer__text">{{ pip.sourceReason || '评估单带入' }}</div>
			</el-card>

			<el-card shadow="never">
				<template #header>跟进记录</template>
				<el-empty v-if="!pip.trackRecords?.length" description="暂无跟进记录" />
				<el-timeline v-else>
					<el-timeline-item
						v-for="item in pip.trackRecords"
						:key="item.id"
						:timestamp="`${item.recordDate || ''} ${item.createTime || ''}`"
					>
						<div class="pip-track-drawer__record">
							<div class="pip-track-drawer__record-progress">
								{{ item.progress || '暂无内容' }}
							</div>
							<div class="pip-track-drawer__record-meta">
								{{ item.operatorName || item.operatorId || '-' }}
							</div>
							<div class="pip-track-drawer__record-plan">
								下一步：{{ item.nextPlan || '暂无' }}
							</div>
						</div>
					</el-timeline-item>
				</el-timeline>
			</el-card>

			<el-card v-if="canTrack" shadow="never">
				<template #header>提交跟进</template>
				<el-form label-width="100px">
					<el-form-item label="跟进日期">
						<el-date-picker
							v-model="recordDate"
							type="date"
							value-format="YYYY-MM-DD"
							placeholder="请选择跟进日期"
						/>
					</el-form-item>
					<el-form-item label="跟进内容">
						<el-input
							v-model="progress"
							type="textarea"
							:rows="4"
							placeholder="请输入本次跟进内容"
						/>
					</el-form-item>
					<el-form-item label="下一步计划">
						<el-input
							v-model="nextPlan"
							type="textarea"
							:rows="3"
							placeholder="请输入下一步计划"
						/>
					</el-form-item>
				</el-form>
			</el-card>

			<div class="pip-track-drawer__footer">
				<el-button @click="$emit('update:modelValue', false)">关闭</el-button>
				<el-button v-if="canTrack" type="primary" :loading="loading" @click="submit">
					提交跟进
				</el-button>
			</div>
		</div>
	</el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { PipRecord } from '../types';

const props = defineProps<{
	modelValue: boolean;
	pip: PipRecord | null;
	loading?: boolean;
	canTrack?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'submit', value: { id: number; recordDate: string; progress: string; nextPlan?: string }): void;
}>();

const recordDate = ref('');
const progress = ref('');
const nextPlan = ref('');

const statusLabel = computed(() => {
	switch (props.pip?.status) {
		case 'active':
			return '进行中';
		case 'completed':
			return '已完成';
		case 'closed':
			return '已关闭';
		default:
			return '草稿';
	}
});

watch(
	() => props.modelValue,
	value => {
		if (value) {
			recordDate.value = '';
			progress.value = '';
			nextPlan.value = '';
		}
	}
);

function submit() {
	if (!props.pip?.id) {
		return;
	}

	if (!recordDate.value) {
		ElMessage.error('请选择跟进日期');
		return;
	}

	if (!progress.value.trim()) {
		ElMessage.error('请输入跟进内容');
		return;
	}

	emit('submit', {
		id: props.pip.id,
		recordDate: recordDate.value,
		progress: progress.value.trim(),
		nextPlan: nextPlan.value.trim()
	});
}
</script>

<style lang="scss" scoped>
.pip-track-drawer {
	display: grid;
	gap: 16px;

	&__text,
	&__record-progress,
	&__record-plan {
		white-space: pre-wrap;
		line-height: 1.7;
		color: var(--el-text-color-regular);
	}

	&__record {
		display: grid;
		gap: 6px;
	}

	&__record-meta {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}

	&__footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
}
</style>
